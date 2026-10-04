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

from app.database.ml_difficulty_model import calculate_engagement_status

@router.get("/engagement")
def get_engagement_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return calculate_engagement_status(db, current_user.id)

from app.database.rl_difficulty_agent import get_or_create_state, ACTIONS
from app.schemas.rl_agent_schema import RLAgentStatus

@router.get("/rl-agent", response_model=RLAgentStatus)
def get_rl_agent_status(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    states = {a: get_or_create_state(db, current_user.id, a) for a in ACTIONS}
    best = max(states, key=lambda a: states[a].q_value)
    return {
        "q_values": {a: round(s.q_value, 3) for a, s in states.items()},
        "pulls": {a: s.pulls for a, s in states.items()},
        "current_best_action": best
    }