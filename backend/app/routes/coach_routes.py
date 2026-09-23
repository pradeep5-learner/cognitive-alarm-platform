from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import SessionLocal
from app.database.auth_dependency import require_role
from app.models.user import User
from app.models.alarm import Alarm
from app.models.wakeup_log import WakeUpLog
from app.schemas.admin_schema import CoachUserSummary

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

        summaries.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "difficulty_preference": u.difficulty_preference,
            "total_alarms": total_alarms,
            "total_wakeup_sessions": total_sessions,
            "completion_rate": round(completion_rate, 1)
        })

    return summaries