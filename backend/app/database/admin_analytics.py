from collections import Counter, defaultdict
from datetime import date, datetime, time, timedelta
from sqlalchemy import func, case
from app.models.user import User
from app.models.alarm import Alarm
from app.models.wakeup_log import WakeUpLog
from app.models.challenge import Challenge
from app.database.habit_scoring import calculate_habit_score
from app.database.recommendation_engine import generate_recommendations

PRIORITY_RANK = {"high": 3, "medium": 2, "low": 1}


def compute_platform_stats(db):
    total_users = db.query(User).count()
    total_alarms = db.query(Alarm).count()
    active_alarms = db.query(Alarm).filter(Alarm.is_active == True).count()

    total_sessions = db.query(WakeUpLog).count()
    verified_sessions = db.query(WakeUpLog).filter(WakeUpLog.is_verified == True).count()
    completion_rate = (verified_sessions / total_sessions * 100) if total_sessions > 0 else 0.0

    members = db.query(User).filter(User.role == "user").all()
    scores = [calculate_habit_score(db, u.id)["total_score"] for u in members]
    avg_habit_score = round(sum(scores) / len(scores), 1) if scores else 0.0

    distribution = {"beginner": 0, "easy": 0, "medium": 0, "hard": 0, "expert": 0}
    for u in members:
        pref = u.difficulty_preference or "medium"
        if pref in distribution:
            distribution[pref] += 1

    return {
        "total_users": total_users,
        "total_alarms": total_alarms,
        "active_alarms": active_alarms,
        "total_wakeup_sessions": total_sessions,
        "platform_completion_rate": round(completion_rate, 1),
        "avg_habit_score": avg_habit_score,
        "difficulty_distribution": distribution,
    }


def compute_activity_trend(db, days=14):
    start = date.today() - timedelta(days=days - 1)
    logs = db.query(WakeUpLog).filter(WakeUpLog.started_at >= datetime.combine(start, time.min)).all()

    per_day = {}
    for log in logs:
        bucket = per_day.setdefault(log.started_at.date(), {"sessions": 0, "completed": 0, "users": set()})
        bucket["sessions"] += 1
        if log.is_verified:
            bucket["completed"] += 1
        bucket["users"].add(log.user_id)

    trend = []
    for i in range(days):
        day = start + timedelta(days=i)
        b = per_day.get(day)
        trend.append({
            "date": day.isoformat(),
            "sessions": b["sessions"] if b else 0,
            "completed": b["completed"] if b else 0,
            "active_users": len(b["users"]) if b else 0,
        })
    return trend


def compute_challenge_usage(db):
    rows = (
        db.query(
            Challenge.challenge_type,
            func.count(WakeUpLog.id),
            func.sum(case((WakeUpLog.is_verified == True, 1), else_=0)),
            func.avg(WakeUpLog.attempts),
        )
        .join(WakeUpLog, WakeUpLog.challenge_id == Challenge.id)
        .group_by(Challenge.challenge_type)
        .all()
    )
    usage = [
        {
            "challenge_type": ctype,
            "sessions": int(sessions),
            "completed": int(completed or 0),
            "avg_attempts": round(float(avg), 2) if avg is not None else None,
        }
        for ctype, sessions, completed, avg in rows
    ]
    return sorted(usage, key=lambda r: r["sessions"], reverse=True)


def compute_recommendation_monitoring(db, max_users=200):
    members = db.query(User).filter(User.role == "user").order_by(User.id).limit(max_users).all()

    by_category, by_priority, by_title = Counter(), Counter(), Counter()
    per_user = []
    total = 0
    skipped = 0

    for u in members:
        try:
            recs = generate_recommendations(db, u.id)
        except Exception:
            skipped += 1  # one user's bad data should not break the whole monitor
            continue

        top = "low"
        for r in recs:
            by_category[r["category"]] += 1
            by_priority[r["priority"]] += 1
            by_title[r["title"]] += 1
            if PRIORITY_RANK.get(r["priority"], 1) > PRIORITY_RANK[top]:
                top = r["priority"]
        total += len(recs)
        per_user.append({
            "user_id": u.id,
            "name": u.name,
            "email": u.email,
            "count": len(recs),
            "top_priority": top,
            "titles": [r["title"] for r in recs],
        })

    per_user.sort(key=lambda p: (PRIORITY_RANK[p["top_priority"]], p["count"]), reverse=True)

    return {
        "users_analyzed": len(per_user),
        "skipped_users": skipped,
        "total_recommendations": total,
        "by_priority": {k: by_priority.get(k, 0) for k in ("high", "medium", "low")},
        "by_category": [{"category": c, "count": n} for c, n in by_category.most_common()],
        "top_recommendations": [{"title": t, "count": n} for t, n in by_title.most_common(8)],
        "users": per_user,
    }