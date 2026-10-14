from collections import Counter
from datetime import datetime
from sqlalchemy import func
from app.models.user import User
from app.models.wakeup_log import WakeUpLog
from app.models.notification import Notification
from app.models.habit_score import HabitScoreLog
from app.models.productivity_log import ProductivityLog
from app.database.habit_scoring import calculate_habit_score
from app.database.admin_analytics import (
    compute_platform_stats, compute_activity_trend,
    compute_challenge_usage, compute_recommendation_monitoring,
)


def gather_system_report_data(db):
    all_users = db.query(User).order_by(User.id).all()
    names = {u.id: u.name for u in all_users}

    sessions_by_user, completed_by_user = Counter(), Counter()
    for user_id, verified in db.query(WakeUpLog.user_id, WakeUpLog.is_verified).all():
        sessions_by_user[user_id] += 1
        if verified:
            completed_by_user[user_id] += 1

    user_rows = []
    for u in all_users:
        s, c = sessions_by_user[u.id], completed_by_user[u.id]
        user_rows.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "coach": names.get(u.coach_id, "") if u.coach_id else "",
            "sessions": s,
            "completion_rate": round(c / s * 100, 1) if s else None,
            "habit_score": calculate_habit_score(db, u.id)["total_score"] if u.role == "user" else None,
        })

    role_counts = db.query(User.role, func.count(User.id)).group_by(User.role).all()

    return {
        "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
        "stats": compute_platform_stats(db),
        "roles": [{"role": r, "count": n} for r, n in role_counts],
        "activity": compute_activity_trend(db, 14),
        "challenge_usage": compute_challenge_usage(db),
        "recommendations": compute_recommendation_monitoring(db),
        "users": user_rows,
        "system": {
            "notifications": db.query(Notification).count(),
            "habit_score_snapshots": db.query(HabitScoreLog).count(),
            "productivity_ratings": db.query(ProductivityLog).count(),
        },
    }