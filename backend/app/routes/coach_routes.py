from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import SessionLocal
from app.database.auth_dependency import require_role
from app.models.user import User
from app.models.alarm import Alarm
from app.models.wakeup_log import WakeUpLog
from app.schemas.admin_schema import CoachUserSummary
from app.database.habit_scoring import calculate_habit_score
from app.database.ml_difficulty_model import analyze_learning_trend

router = APIRouter(prefix="/coach", tags=["Wellness Coach"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/my-users", response_model=List[CoachUserSummary])
def get_my_assigned_users(db: Session = Depends(get_db), current_user: User = Depends(require_role(["wellness_coach"]))):
    assigned_users = db.query(User).filter(User.coach_id == current_user.id).all()

    summaries = []
    for u in assigned_users:
        total_alarms = db.query(Alarm).filter(Alarm.user_id == u.id).count()

        logs = db.query(WakeUpLog).filter(WakeUpLog.user_id == u.id).all()
        total_sessions = len(logs)
        verified = len([log for log in logs if log.is_verified])
        completion_rate = (verified / total_sessions * 100) if total_sessions > 0 else 0.0

        habit_scores = calculate_habit_score(db, u.id)
        trend_data = analyze_learning_trend(db, u.id)

        summaries.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "difficulty_preference": u.difficulty_preference,
            "total_alarms": total_alarms,
            "total_wakeup_sessions": total_sessions,
            "completion_rate": round(completion_rate, 1),
            "habit_score": habit_scores["total_score"],
            "trend": trend_data["trend"]
        })

    return summaries