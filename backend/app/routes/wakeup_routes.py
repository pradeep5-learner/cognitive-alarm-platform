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

router = APIRouter(prefix="/wakeup", tags=["Wake-Up Verification"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/start/{alarm_id}", response_model=WakeUpStartResponse)
def start_wakeup_verification(alarm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id, Alarm.user_id == current_user.id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")

    difficulty = current_user.difficulty_preference or "medium"
    question, answer = generate_challenge("math", difficulty)

    new_challenge = Challenge(
        challenge_type="math",
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
        challenge_id=new_challenge.id
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return {
        "wakeup_log_id": new_log.id,
        "challenge_id": new_challenge.id,
        "question": new_challenge.question,
        "challenge_type": new_challenge.challenge_type,
        "difficulty": new_challenge.difficulty
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
        log.is_verified = True
        log.verified_at = datetime.utcnow()

    db.commit()

    return {
        "is_correct": is_correct,
        "attempts": log.attempts,
        "alarm_dismissed": log.is_verified
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