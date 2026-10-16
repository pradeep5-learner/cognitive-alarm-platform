from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import SessionLocal
from app.database.auth_dependency import get_current_user
from app.models.alarm import Alarm
from app.models.user import User
from app.schemas.alarm_schema import AlarmCreate, AlarmResponse, AlarmUpdate
from app.models.wakeup_log import WakeUpLog
from app.models.challenge import Challenge
from app.database.alarm_challenges import encode_challenge_types

router = APIRouter(prefix="/alarms", tags=["Alarms"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/", response_model=AlarmResponse)
def create_alarm(alarm: AlarmCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_alarm = Alarm(
        user_id=current_user.id,
        label=alarm.label,
        time=alarm.time,
        alarm_type=alarm.alarm_type,
        ringtone=alarm.ringtone or "classic",
        challenge_types=encode_challenge_types(alarm.challenge_types),
    )
    db.add(new_alarm)
    db.commit()
    db.refresh(new_alarm)
    return new_alarm

@router.get("/", response_model=List[AlarmResponse])
def get_my_alarms(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alarms = db.query(Alarm).filter(Alarm.user_id == current_user.id).all()
    return alarms

@router.get("/{alarm_id}", response_model=AlarmResponse)
def get_alarm(alarm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id, Alarm.user_id == current_user.id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")
    return alarm

@router.put("/{alarm_id}", response_model=AlarmResponse)
def update_alarm(alarm_id: int, alarm_update: AlarmUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id, Alarm.user_id == current_user.id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")

    update_data = alarm_update.dict(exclude_unset=True)
    if "challenge_types" in update_data:
        update_data["challenge_types"] = encode_challenge_types(update_data["challenge_types"])
    for key, value in update_data.items():
        setattr(alarm, key, value)

    db.commit()
    db.refresh(alarm)
    return alarm

@router.delete("/{alarm_id}")
def delete_alarm(alarm_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id, Alarm.user_id == current_user.id).first()
    if not alarm:
        raise HTTPException(status_code=404, detail="Alarm not found")

    logs = db.query(WakeUpLog).filter(WakeUpLog.alarm_id == alarm_id).all()
    challenge_ids = [log.challenge_id for log in logs]

    db.query(WakeUpLog).filter(WakeUpLog.alarm_id == alarm_id).delete(synchronize_session=False)
    if challenge_ids:
        db.query(Challenge).filter(Challenge.id.in_(challenge_ids)).delete(synchronize_session=False)

    db.delete(alarm)
    db.commit()
    return {"message": "Alarm deleted successfully"}