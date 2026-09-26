from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database.connection import SessionLocal
from app.database.auth_dependency import get_current_user
from app.database.challenge_generator import generate_challenge
from app.models.challenge import Challenge
from app.models.wakeup_log import WakeUpLog
from app.models.alarm import Alarm
from app.models.user import User
from app.schemas.wakeup_schema import WakeUpStartResponse, WakeUpSubmitRequest, WakeUpSnoozeRequest
from app.database.ml_difficulty_model import get_recommended_difficulty
import random

router = APIRouter(prefix="/wakeup", tags=["Wake-Up Verification"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

DIFFICULTY_TIME_LIMITS = {
    "beginner": 60,
    "easy": 45,
    "medium": 30,
    "hard": 20,
    "expert": 15,
}

@router.post("/start/{alarm_id}", response_model=WakeUpStartResponse)
def start_wakeup_verification(alarm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id, Alarm.user_id == current_user.id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")

    from datetime import timedelta

    recent_cutoff = datetime.utcnow() - timedelta(minutes=2)

    existing_log = db.query(WakeUpLog).filter(
        WakeUpLog.alarm_id == alarm_id,
        WakeUpLog.user_id == current_user.id,
        WakeUpLog.is_verified == False,
        WakeUpLog.correct_streak > 0,
        WakeUpLog.started_at >= recent_cutoff
    ).order_by(WakeUpLog.started_at.desc()).first()
    
    correct_streak = existing_log.correct_streak if existing_log else 0
    required_streak = existing_log.required_streak if existing_log else random.choice([1, 2])

    fallback = current_user.difficulty_preference or "medium"
    difficulty, confidence, is_ml = get_recommended_difficulty(db, current_user.id, fallback)
    challenge_type = random.choice(["math", "riddle", "logic", "memory", "word_game", "pattern", "quiz"])
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

    new_log = WakeUpLog(
        user_id=current_user.id,
        alarm_id=alarm.id,
        challenge_id=new_challenge.id,
        correct_streak=correct_streak,
        required_streak=required_streak
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return {
        "wakeup_log_id": new_log.id,
        "challenge_id": new_challenge.id,
        "question": new_challenge.question,
        "challenge_type": new_challenge.challenge_type,
        "difficulty": new_challenge.difficulty,
        "correct_streak": new_log.correct_streak,
        "required_streak": new_log.required_streak,
        "time_limit_seconds": DIFFICULTY_TIME_LIMITS.get(difficulty, 30)
    }


@router.post("/submit")
def submit_wakeup_answer(submission: WakeUpSubmitRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(WakeUpLog).filter(WakeUpLog.id == submission.wakeup_log_id, WakeUpLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Verification session not found")

    if log.is_verified:
        return {"is_correct": True, "already_verified": True, "message": "Alarm already dismissed"}

    challenge = db.query(Challenge).filter(Challenge.id == log.challenge_id).first()

    log.attempts += 1
    is_correct = submission.submitted_answer.strip().lower() == challenge.correct_answer.strip().lower()

    if is_correct:
        log.correct_streak += 1
    else:
        log.correct_streak = 0

    fully_dismissed = log.correct_streak >= log.required_streak

    if fully_dismissed:
        log.is_verified = True
        log.verified_at = datetime.now()

    db.commit()

    return {
        "is_correct": is_correct,
        "attempts": log.attempts,
        "correct_streak": log.correct_streak,
        "required_streak": log.required_streak,
        "alarm_dismissed": fully_dismissed
    }

@router.post("/snooze")
def snooze_wakeup(request: WakeUpSnoozeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(WakeUpLog).filter(WakeUpLog.id == request.wakeup_log_id, WakeUpLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Verification session not found")

    log.snooze_count += 1
    db.commit()

    return {"snooze_count": log.snooze_count, "message": "Snoozed"}

from app.schemas.analytics_schema import ChallengeAnalytics

@router.get("/analytics", response_model=ChallengeAnalytics)
def get_challenge_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(WakeUpLog).filter(WakeUpLog.user_id == current_user.id).all()

    total_sessions = len(logs)
    verified_logs = [log for log in logs if log.is_verified]
    verified_sessions = len(verified_logs)

    completion_rate = (verified_sessions / total_sessions * 100) if total_sessions > 0 else 0.0

    first_try_correct = len([log for log in verified_logs if log.attempts == 1])
    first_try_accuracy = (first_try_correct / verified_sessions * 100) if verified_sessions > 0 else 0.0

    average_attempts = (sum(log.attempts for log in verified_logs) / verified_sessions) if verified_sessions > 0 else 0.0

    total_snoozes = sum(log.snooze_count for log in logs)

    return {
        "total_sessions": total_sessions,
        "verified_sessions": verified_sessions,
        "completion_rate": round(completion_rate, 1),
        "first_try_accuracy": round(first_try_accuracy, 1),
        "average_attempts": round(average_attempts, 2),
        "total_snoozes": total_snoozes
    }

@router.post("/timeout")
def timeout_wakeup(request: WakeUpSnoozeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(WakeUpLog).filter(WakeUpLog.id == request.wakeup_log_id, WakeUpLog.user_id == current_user.id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Verification session not found")

    log.attempts += 1
    log.correct_streak = 0
    db.commit()

    return {"message": "Time's up — streak reset", "correct_streak": log.correct_streak}