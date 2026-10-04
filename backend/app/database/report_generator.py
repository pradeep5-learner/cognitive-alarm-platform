from datetime import datetime
from app.database.habit_scoring import calculate_habit_score, calculate_daily_streak
from app.database.behavioral_analytics import calculate_behavioral_analytics, analyze_sleep_patterns
from app.database.productivity_analysis import calculate_productivity_correlation
from app.database.ml_difficulty_model import get_challenge_type_performance
from app.models.user import User
from app.models.alarm import Alarm
from app.models.wakeup_log import WakeUpLog


def gather_report_data(db, user_id):
    user = db.query(User).filter(User.id == user_id).first()

    habit_scores = calculate_habit_score(db, user_id)
    streak = calculate_daily_streak(db, user_id)
    behavior = calculate_behavioral_analytics(db, user_id)
    sleep = analyze_sleep_patterns(db, user_id)
    productivity = calculate_productivity_correlation(db, user_id)
    challenge_perf = get_challenge_type_performance(db, user_id)

    total_alarms = db.query(Alarm).filter(Alarm.user_id == user_id).count()
    logs = db.query(WakeUpLog).filter(WakeUpLog.user_id == user_id).all()
    total_sessions = len(logs)
    verified_sessions = len([l for l in logs if l.is_verified])

    return {
        "user_name": user.name,
        "user_email": user.email,
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "habit_scores": habit_scores,
        "streak": streak,
        "behavior": behavior,
        "sleep": sleep,
        "productivity": productivity,
        "challenge_perf": challenge_perf,
        "total_alarms": total_alarms,
        "total_sessions": total_sessions,
        "verified_sessions": verified_sessions,
    }