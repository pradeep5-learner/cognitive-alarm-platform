from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import SessionLocal
from app.database.auth_dependency import require_role
from app.models.user import User
from app.models.alarm import Alarm
from app.models.wakeup_log import WakeUpLog
from app.schemas.admin_schema import UserListItem, PlatformStats, RoleUpdateRequest
from app.database.habit_scoring import calculate_habit_score

router = APIRouter(prefix="/admin", tags=["Admin"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/users", response_model=List[UserListItem])
def list_all_users(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    return db.query(User).all()


@router.put("/users/{user_id}/role", response_model=UserListItem)
def update_user_role(user_id: int, request: RoleUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    valid_roles = ["user", "wellness_coach", "admin"]
    if request.role not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Role must be one of: {', '.join(valid_roles)}")

    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot change your own role")

    target_user.role = request.role
    db.commit()
    db.refresh(target_user)
    return target_user

@router.get("/stats", response_model=PlatformStats)
def get_platform_stats(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    total_users = db.query(User).count()
    total_alarms = db.query(Alarm).count()
    active_alarms = db.query(Alarm).filter(Alarm.is_active == True).count()

    all_logs = db.query(WakeUpLog).all()
    total_sessions = len(all_logs)
    verified_sessions = len([log for log in all_logs if log.is_verified])
    completion_rate = (verified_sessions / total_sessions * 100) if total_sessions > 0 else 0.0

    all_users = db.query(User).filter(User.role == "user").all()
    habit_scores = [calculate_habit_score(db, u.id)["total_score"] for u in all_users]
    avg_habit_score = round(sum(habit_scores) / len(habit_scores), 1) if habit_scores else 0.0

    difficulty_distribution = {"beginner": 0, "easy": 0, "medium": 0, "hard": 0, "expert": 0}
    for u in all_users:
        pref = u.difficulty_preference or "medium"
        if pref in difficulty_distribution:
            difficulty_distribution[pref] += 1

    return {
        "total_users": total_users,
        "total_alarms": total_alarms,
        "active_alarms": active_alarms,
        "total_wakeup_sessions": total_sessions,
        "platform_completion_rate": round(completion_rate, 1),
        "avg_habit_score": avg_habit_score,
        "difficulty_distribution": difficulty_distribution
    }

from app.schemas.admin_schema import CoachAssignRequest

@router.put("/users/{user_id}/assign-coach", response_model=UserListItem)
def assign_coach(user_id: int, request: CoachAssignRequest, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    coach = db.query(User).filter(User.id == request.coach_id, User.role == "wellness_coach").first()
    if not coach:
        raise HTTPException(status_code=400, detail="Selected user is not a valid wellness coach")

    target_user.coach_id = coach.id
    db.commit()
    db.refresh(target_user)
    return target_user