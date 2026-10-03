from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import SessionLocal
from app.database.auth_dependency import get_current_user
from app.database.habit_scoring import calculate_habit_score, calculate_daily_streak
from app.models.user import User
from app.models.habit_score import HabitScoreLog
from app.schemas.habit_score_schema import HabitScoreResponse, HabitScoreHistoryItem, DailyStreakResponse

router = APIRouter(prefix="/habits", tags=["Habit Scoring"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/score", response_model=HabitScoreResponse)
def get_habit_score(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    scores = calculate_habit_score(db, current_user.id)

    log_entry = HabitScoreLog(
        user_id=current_user.id,
        wake_consistency_score=scores["wake_consistency_score"],
        challenge_completion_score=scores["challenge_completion_score"],
        snooze_reduction_score=scores["snooze_reduction_score"],
        sleep_adherence_score=scores["sleep_adherence_score"],
        productivity_score=scores["productivity_score"],
        total_score=scores["total_score"]
    )
    db.add(log_entry)
    db.commit()

    return scores


@router.get("/history", response_model=List[HabitScoreHistoryItem])
def get_habit_score_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(HabitScoreLog).filter(HabitScoreLog.user_id == current_user.id).order_by(HabitScoreLog.calculated_at.asc()).all()
    return logs

@router.get("/streak", response_model=DailyStreakResponse)
def get_daily_streak(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return calculate_daily_streak(db, current_user.id)