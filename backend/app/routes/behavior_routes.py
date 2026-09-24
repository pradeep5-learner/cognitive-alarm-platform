from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.database.auth_dependency import get_current_user
from app.database.behavioral_analytics import calculate_behavioral_analytics
from app.models.user import User
from app.schemas.behavior_schema import BehavioralAnalytics

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