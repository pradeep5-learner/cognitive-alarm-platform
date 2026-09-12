from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.database.auth_dependency import get_current_user
from app.database.challenge_generator import generate_math_challenge
from app.models.challenge import Challenge
from app.models.user import User
from app.schemas.challenge_schema import ChallengeResponse, ChallengeAnswerSubmit
from app.database.challenge_generator import generate_challenge

router = APIRouter(prefix="/challenges", tags=["Challenges"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/generate", response_model=ChallengeResponse)
def generate_new_challenge(challenge_type: str = "math", difficulty: str = "medium", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    question, answer = generate_challenge(challenge_type, difficulty)

    new_challenge = Challenge(
        challenge_type=challenge_type,
        difficulty=difficulty,
        question=question,
        correct_answer=answer
    )
    db.add(new_challenge)
    db.commit()
    db.refresh(new_challenge)
    return new_challenge

@router.post("/submit")
def submit_answer(submission: ChallengeAnswerSubmit, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    challenge = db.query(Challenge).filter(Challenge.id == submission.challenge_id).first()

    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    is_correct = submission.submitted_answer.strip().lower() == challenge.correct_answer.strip().lower()

    return {
        "is_correct": is_correct,
        "correct_answer": challenge.correct_answer if not is_correct else None
    }