from datetime import date
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.database.auth_dependency import get_current_user
from app.database.productivity_analysis import calculate_productivity_correlation
from app.models.user import User
from app.models.productivity_log import ProductivityLog
from app.schemas.productivity_schema import ProductivityCreate, ProductivityLogResponse, ProductivityCorrelation

router = APIRouter(prefix="/productivity", tags=["Productivity"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/log", response_model=ProductivityLogResponse)
def log_productivity(entry: ProductivityCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_date = entry.log_date or date.today()
    if target_date > date.today():
        raise HTTPException(status_code=400, detail="Cannot log productivity for a future date")

    existing = db.query(ProductivityLog).filter(
        ProductivityLog.user_id == current_user.id,
        ProductivityLog.log_date == target_date
    ).first()

    if existing:
        existing.rating = entry.rating
        existing.note = entry.note
        record = existing
    else:
        record = ProductivityLog(
            user_id=current_user.id,
            log_date=target_date,
            rating=entry.rating,
            note=entry.note
        )
        db.add(record)

    db.commit()
    db.refresh(record)
    return record


@router.get("/history", response_model=List[ProductivityLogResponse])
def get_productivity_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ProductivityLog).filter(
        ProductivityLog.user_id == current_user.id
    ).order_by(ProductivityLog.log_date.asc()).all()


@router.get("/correlation", response_model=ProductivityCorrelation)
def get_productivity_correlation(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return calculate_productivity_correlation(db, current_user.id)