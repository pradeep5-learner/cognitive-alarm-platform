from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.database.auth_dependency import get_current_user
from app.database.behavioral_analytics import calculate_behavioral_analytics, analyze_sleep_patterns, suggest_smart_schedule
from app.models.user import User
from app.schemas.behavior_schema import BehavioralAnalytics, SleepPatternAnalysis, SmartScheduleSuggestion

router = APIRouter(prefix="/behavior", tags=["Behavioral Analytics"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/analytics", response_model=BehavioralAnalytics)
def get_behavioral_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return calculate_behavioral_analytics(db, current_user.id)

@router.get("/sleep-patterns", response_model=SleepPatternAnalysis)
def get_sleep_patterns(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analyze_sleep_patterns(db, current_user.id)

@router.get("/smart-schedule/{alarm_id}", response_model=SmartScheduleSuggestion)
def get_smart_schedule_suggestion(alarm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = suggest_smart_schedule(db, current_user.id, alarm_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Alarm not found")
    return result