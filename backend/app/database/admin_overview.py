from collections import Counter, defaultdict
from datetime import date, timedelta
from app.models.user import User
from app.models.alarm import Alarm
from app.models.wakeup_log import WakeUpLog
from app.database.habit_scoring import calculate_habit_score, calculate_daily_streak
from app.database.admin_analytics import compute_activity_trend, compute_challenge_usage

ROLE_LABELS = {"user": "Users", "wellness_coach": "Coaches", "admin": "Admins"}
DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
SCORE_BUCKETS = [("0-20", 0, 20), ("20-40", 20, 40), ("40-60", 40, 60), ("60-80", 60, 80), ("80-100", 80, 100.01)]
SLEEP_LABELS = ["Under 6h", "6 to 7h", "7 to 8h", "8 to 9h", "9h or more", "Not set"]
DIFFICULTIES = ["beginner", "easy", "medium", "hard", "expert"]


def _sleep_bucket(hours):
    if hours is None:
        return "Not set"
    if hours < 6:
        return "Under 6h"
    if hours < 7:
        return "6 to 7h"
    if hours < 8:
        return "7 to 8h"
    if hours < 9:
        return "8 to 9h"
    return "9h or more"


def compute_admin_overview(db):
    users = db.query(User).order_by(User.id).all()
    names = {u.id: u.name for u in users}
    members = [u for u in users if u.role == "user"]

    sessions, completed, last_active = Counter(), Counter(), {}
    hour_counts = Counter()
    weekday = defaultdict(lambda: {"snoozes": 0, "sessions": 0})

    rows = db.query(
        WakeUpLog.user_id, WakeUpLog.is_verified, WakeUpLog.started_at,
        WakeUpLog.verified_at, WakeUpLog.snooze_count,
    ).all()
    for user_id, verified, started, verified_at, snoozes in rows:
        sessions[user_id] += 1
        if verified:
            completed[user_id] += 1
            if verified_at:
                hour_counts[verified_at.hour] += 1
        if started:
            if user_id not in last_active or started > last_active[user_id]:
                last_active[user_id] = started
            bucket = weekday[started.weekday()]
            bucket["snoozes"] += snoozes or 0
            bucket["sessions"] += 1

    user_rows, member_scores = [], []
    for u in users:
        s, c = sessions[u.id], completed[u.id]
        is_member = u.role == "user"
        score = calculate_habit_score(db, u.id)["total_score"] if is_member else None
        streak = calculate_daily_streak(db, u.id)["current_streak"] if is_member else None
        if is_member:
            member_scores.append((u.name, score))
        active = last_active.get(u.id)
        user_rows.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "coach_id": u.coach_id,
            "coach_name": names.get(u.coach_id, "") if u.coach_id else "",
            "sessions": s,
            "completion_rate": round(c / s * 100, 1) if s else None,
            "habit_score": score,
            "streak": streak,
            "difficulty": u.difficulty_preference,
            "joined": u.created_at.date().isoformat() if u.created_at else None,
            "last_active": active.isoformat() if active else None,
        })

    role_counts = Counter(u.role for u in users)
    roles = [{"name": ROLE_LABELS[r], "value": role_counts[r]} for r in ("user", "wellness_coach", "admin") if role_counts[r] > 0]

    start = date.today() - timedelta(days=13)
    signup_counts = Counter(u.created_at.date() for u in users if u.created_at)
    signups = [
        {"date": (start + timedelta(days=i)).isoformat(), "count": signup_counts.get(start + timedelta(days=i), 0)}
        for i in range(14)
    ]

    habit_distribution = [
        {"range": label, "users": sum(1 for _, sc in member_scores if low <= sc < high)}
        for label, low, high in SCORE_BUCKETS
    ]

    pref_counts = Counter((u.difficulty_preference or "medium") for u in members)
    difficulty = [{"level": lvl.title(), "users": pref_counts.get(lvl, 0)} for lvl in DIFFICULTIES]

    sleep_counts = Counter(_sleep_bucket(u.sleep_duration_hours) for u in members)
    sleep_distribution = [{"range": label, "users": sleep_counts.get(label, 0)} for label in SLEEP_LABELS]

    weekday_snoozes = [
        {
            "day": DAY_NAMES[i],
            "avg_snoozes": round(weekday[i]["snoozes"] / weekday[i]["sessions"], 2) if weekday[i]["sessions"] else 0,
            "sessions": weekday[i]["sessions"],
        }
        for i in range(7)
    ]

    total_sessions = sum(sessions.values())
    total_completed = sum(completed.values())

    return {
        "summary": {
            "total_users": len(users),
            "total_alarms": db.query(Alarm).count(),
            "active_alarms": db.query(Alarm).filter(Alarm.is_active == True).count(),
            "total_sessions": total_sessions,
            "completion_rate": round(total_completed / total_sessions * 100, 1) if total_sessions else 0.0,
            "avg_habit_score": round(sum(sc for _, sc in member_scores) / len(member_scores), 1) if member_scores else 0.0,
        },
        "roles": roles,
        "signups": signups,
        "activity": compute_activity_trend(db, 14),
        "habit_distribution": habit_distribution,
        "difficulty": difficulty,
        "challenge_usage": compute_challenge_usage(db),
        "wake_hours": [{"hour": h, "wakeups": hour_counts.get(h, 0)} for h in range(24)],
        "weekday_snoozes": weekday_snoozes,
        "sleep_distribution": sleep_distribution,
        "top_users": [
            {"name": n, "habit_score": sc}
            for n, sc in sorted(member_scores, key=lambda x: x[1], reverse=True)[:8]
        ],
        "users": user_rows,
    }