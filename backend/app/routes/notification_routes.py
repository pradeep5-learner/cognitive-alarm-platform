from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import SessionLocal
from app.database.auth_dependency import get_current_user, require_role
from app.database.notification_engine import run_notification_checks
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification_schema import NotificationResponse, AnnouncementCreate

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=List[NotificationResponse])
def get_my_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    run_notification_checks(db, current_user.id)

    personal = db.query(Notification).filter(Notification.user_id == current_user.id)
    announcements = db.query(Notification).filter(Notification.user_id.is_(None))
    all_notifs = personal.union(announcements).order_by(Notification.created_at.desc()).limit(30).all()
    return all_notifs


@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    personal_unread = db.query(Notification).filter(
        Notification.user_id == current_user.id, Notification.is_read == False
    ).count()
    announcement_unread = db.query(Notification).filter(
        Notification.user_id.is_(None), Notification.is_read == False
    ).count()
    return {"unread_count": personal_unread + announcement_unread}


@router.put("/{notif_id}/read")
def mark_as_read(notif_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(Notification.id == notif_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notif.user_id is not None and notif.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your notification")
    notif.is_read = True
    db.commit()
    return {"message": "Marked as read"}


@router.put("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"message": "All marked as read"}


@router.post("/announcement", response_model=NotificationResponse)
def create_announcement(data: AnnouncementCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    notif = Notification(user_id=None, notif_type="announcement", title=data.title, message=data.message)
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif