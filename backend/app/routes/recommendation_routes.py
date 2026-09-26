from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.database.auth_dependency import get_current_user
from app.database.recommendation_engine import generate_recommendations
from app.models.user import User
from app.schemas.recommendation_schema import RecommendationList

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=RecommendationList)
def get_my_recommendations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    recs = generate_recommendations(db, current_user.id)
    return {"recommendations": recs}