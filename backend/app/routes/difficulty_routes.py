from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.database.auth_dependency import get_current_user
from app.database.ml_difficulty_model import get_recommended_difficulty, analyze_learning_trend
from app.models.user import User
from app.schemas.difficulty_schema import DifficultyPrediction

router = APIRouter(prefix="/difficulty", tags=["Adaptive Difficulty"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/predict", response_model=DifficultyPrediction)
def predict_my_difficulty(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    fallback = current_user.difficulty_preference or "medium"
    difficulty, confidence, is_ml = get_recommended_difficulty(db, current_user.id, fallback)
    trend_data = analyze_learning_trend(db, current_user.id)

    return {
        "recommended_difficulty": difficulty,
        "confidence": confidence,
        "is_ml_prediction": is_ml,
        "trend": trend_data["trend"],
        "trend_message": trend_data["message"]
    }