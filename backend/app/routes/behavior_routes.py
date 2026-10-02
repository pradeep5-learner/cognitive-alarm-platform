from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.database.auth_dependency import get_current_user
from app.database.behavioral_analytics import calculate_behavioral_analytics, analyze_sleep_patterns
from app.models.user import User
from app.schemas.behavior_schema import BehavioralAnalytics, SleepPatternAnalysis

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