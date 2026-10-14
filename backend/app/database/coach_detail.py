from collections import defaultdict
from datetime import date, timedelta
from app.models.wakeup_log import WakeUpLog
from app.database.habit_scoring import calculate_habit_score, calculate_daily_streak
from app.database.behavioral_analytics import calculate_behavioral_analytics, analyze_sleep_patterns
from app.database.productivity_analysis import calculate_productivity_correlation
from app.database.ml_difficulty_model import (
    get_recommended_difficulty, analyze_learning_trend, get_challenge_type_performance
)
from app.database.recommendation_engine import generate_recommendations
from app.database.session_history import get_recent_sessions

TREND_DAYS = 14


def build_user_detail(db, user):
    logs = db.query(WakeUpLog).filter(WakeUpLog.user_id == user.id).order_by(WakeUpLog.started_at.asc()).all()

    start_day = date.today() - timedelta(days=TREND_DAYS - 1)
    per_day = defaultdict(lambda: {"sessions": 0, "verified": 0, "snoozes": 0, "attempts": 0})
    first_wake = {}

    for log in logs:
        day = log.started_at.date()
        if day < start_day:
            continue
        bucket = per_day[day]
        bucket["sessions"] += 1
        bucket["snoozes"] += log.snooze_count
        bucket["attempts"] += log.attempts
        if log.is_verified:
            bucket["verified"] += 1
            if log.verified_at:
                minutes = log.verified_at.hour * 60 + log.verified_at.minute
                wake_day = log.verified_at.date()
                if wake_day >= start_day and (wake_day not in first_wake or minutes < first_wake[wake_day]):
                    first_wake[wake_day] = minutes

    daily_trend = []
    active_days = 0
    for i in range(TREND_DAYS):
        day = start_day + timedelta(days=i)
        bucket = per_day.get(day)
        if bucket and bucket["sessions"] > 0:
            if bucket["verified"] > 0:
                active_days += 1
            daily_trend.append({
                "date": day.isoformat(),
                "sessions": bucket["sessions"],
                "verified": bucket["verified"],
                "avg_attempts": round(bucket["attempts"] / bucket["sessions"], 2),
                "avg_snoozes": round(bucket["snoozes"] / bucket["sessions"], 2),
            })
        else:
            daily_trend.append({
                "date": day.isoformat(), "sessions": 0, "verified": 0,
                "avg_attempts": None, "avg_snoozes": None,
            })

    target_minutes = None
    if user.preferred_wake_time:
        target_minutes = user.preferred_wake_time.hour * 60 + user.preferred_wake_time.minute

    difficulty, confidence, is_ml = get_recommended_difficulty(
        db, user.id, user.difficulty_preference or "medium"
    )
    trend = analyze_learning_trend(db, user.id)

    return {
        "profile": {
            "name": user.name,
            "email": user.email,
            "preferred_wake_time": user.preferred_wake_time.strftime("%H:%M") if user.preferred_wake_time else None,
            "sleep_duration_hours": user.sleep_duration_hours,
            "timezone": user.timezone,
            "productivity_goal": user.productivity_goal,
            "difficulty_preference": user.difficulty_preference,
            "habit_preferences": user.habit_preferences,
        },
        "habit_scores": calculate_habit_score(db, user.id),
        "streak": calculate_daily_streak(db, user.id),
        "adherence": {
            "window_days": TREND_DAYS,
            "active_days": active_days,
            "rate": round(active_days / TREND_DAYS * 100, 1),
        },
        "daily_trend": daily_trend,
        "wake_time_trend": {
            "target_minutes": target_minutes,
            "points": [{"date": d.isoformat(), "wake_minutes": m} for d, m in sorted(first_wake.items())],
        },
        "behavior": calculate_behavioral_analytics(db, user.id),
        "sleep": analyze_sleep_patterns(db, user.id),
        "productivity": calculate_productivity_correlation(db, user.id),
        "challenge_perf": get_challenge_type_performance(db, user.id),
        "difficulty": {
            "recommended": difficulty,
            "confidence": round(float(confidence), 1),
            "is_ml": is_ml,
            "trend": trend["trend"],
            "trend_message": trend["message"],
        },
        "recommendations": generate_recommendations(db, user.id),
        "recent_sessions": get_recent_sessions(db, user.id, 10),
        "total_sessions": len(logs),
        "verified_sessions": len([l for l in logs if l.is_verified]),
    }