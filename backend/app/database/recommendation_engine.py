from app.database.behavioral_analytics import calculate_behavioral_analytics
from app.database.habit_scoring import calculate_habit_score
from app.models.user import User
from app.models.wakeup_log import WakeUpLog


def generate_recommendations(db, user_id):
    recommendations = []

    user = db.query(User).filter(User.id == user_id).first()
    analytics = calculate_behavioral_analytics(db, user_id)
    scores = calculate_habit_score(db, user_id)

    logs = db.query(WakeUpLog).filter(WakeUpLog.user_id == user_id).all()

    if len(logs) < 3:
        recommendations.append({
            "category": "getting_started",
            "title": "Keep building your history",
            "message": "Ring a few more alarms so we can start spotting real patterns in your wake-up habits.",
            "priority": "low"
        })
        return recommendations

    if analytics["day_of_week_breakdown"]:
        worst = max(analytics["day_of_week_breakdown"], key=lambda d: d["avg_snoozes"])
        if worst["avg_snoozes"] >= 1.5:
            recommendations.append({
                "category": "snoozing",
                "title": f"You snooze most on {worst['day']}s",
                "message": f"Average of {worst['avg_snoozes']} snoozes on {worst['day']}s. Try setting an earlier bedtime the night before.",
                "priority": "high"
            })

    if scores["snooze_reduction_score"] < 50:
        recommendations.append({
            "category": "snoozing",
            "title": "Snoozing is affecting your habit score",
            "message": "Your snooze reduction score is below average. Consider placing your phone farther from your bed.",
            "priority": "high"
        })

    if scores["challenge_completion_score"] < 60:
        recommendations.append({
            "category": "difficulty",
            "title": "Consider adjusting your difficulty",
            "message": "Your challenge completion rate is low. A slightly easier difficulty might help you build consistency first.",
            "priority": "medium"
        })
    elif scores["challenge_completion_score"] > 90 and user.difficulty_preference in ["beginner", "easy"]:
        recommendations.append({
            "category": "difficulty",
            "title": "You might be ready for a challenge",
            "message": "You're completing almost everything successfully. Try a harder difficulty for a better cognitive workout.",
            "priority": "low"
        })

    if analytics["avg_response_time_minutes"] > 5:
        recommendations.append({
            "category": "response_time",
            "title": "Long time to fully wake up",
            "message": f"It takes you an average of {analytics['avg_response_time_minutes']} minutes to dismiss alarms. A multi-step challenge might help you stay engaged sooner.",
            "priority": "medium"
        })

    if scores["sleep_adherence_score"] < 50 and user.preferred_wake_time:
        recommendations.append({
            "category": "sleep_schedule",
            "title": "Wake-up time drifting from your goal",
            "message": "Your actual wake-up times are often far from your preferred wake-up time in your profile. Consider adjusting your alarm or your goal to be more realistic.",
            "priority": "medium"
        })

    if scores["total_score"] >= 80:
        recommendations.append({
            "category": "positive",
            "title": "Great habit consistency!",
            "message": f"Your habit score is {scores['total_score']}/100 — keep up the strong routine.",
            "priority": "low"
        })

    if not recommendations:
        recommendations.append({
            "category": "general",
            "title": "You're doing okay",
            "message": "No major issues detected yet. Keep using the app consistently for more personalized insights.",
            "priority": "low"
        })

    return recommendations