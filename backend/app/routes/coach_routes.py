from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.connection import SessionLocal
from app.database.auth_dependency import require_role
from app.models.user import User
from app.models.alarm import Alarm
from app.models.wakeup_log import WakeUpLog
from app.schemas.admin_schema import CoachUserSummary
from app.database.habit_scoring import calculate_habit_score
from app.database.ml_difficulty_model import analyze_learning_trend
from app.database.coach_detail import build_user_detail
from fastapi.responses import StreamingResponse
from app.database.report_generator import gather_report_data
from app.database.pdf_report import generate_pdf_report
from app.database.excel_report import generate_excel_report


router = APIRouter(prefix="/coach", tags=["Wellness Coach"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/my-users", response_model=List[CoachUserSummary])
def get_my_assigned_users(db: Session = Depends(get_db), current_user: User = Depends(require_role(["wellness_coach"]))):
    assigned_users = db.query(User).filter(User.coach_id == current_user.id).all()

    summaries = []
    for u in assigned_users:
        total_alarms = db.query(Alarm).filter(Alarm.user_id == u.id).count()

        logs = db.query(WakeUpLog).filter(WakeUpLog.user_id == u.id).all()
        total_sessions = len(logs)
        verified = len([log for log in logs if log.is_verified])
        completion_rate = (verified / total_sessions * 100) if total_sessions > 0 else 0.0

        habit_scores = calculate_habit_score(db, u.id)
        trend_data = analyze_learning_trend(db, u.id)

        summaries.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "difficulty_preference": u.difficulty_preference,
            "total_alarms": total_alarms,
            "total_wakeup_sessions": total_sessions,
            "completion_rate": round(completion_rate, 1),
            "habit_score": habit_scores["total_score"],
            "trend": trend_data["trend"]
        })

    return summaries

@router.get("/users/{user_id}/details")
def get_assigned_user_details(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["wellness_coach"]))):
    target = db.query(User).filter(User.id == user_id, User.coach_id == current_user.id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found or not assigned to you")
    return build_user_detail(db, target)

def _get_assigned_user(db, coach, user_id):
    target = db.query(User).filter(User.id == user_id, User.coach_id == coach.id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found or not assigned to you")
    return target


@router.get("/users/{user_id}/report/pdf")
def coach_download_user_pdf(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["wellness_coach"]))):
    target = _get_assigned_user(db, current_user, user_id)
    buffer = generate_pdf_report(gather_report_data(db, target.id))
    return StreamingResponse(buffer, media_type="application/pdf",
                             headers={"Content-Disposition": f"attachment; filename=user_{target.id}_report.pdf"})


@router.get("/users/{user_id}/report/excel")
def coach_download_user_excel(user_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["wellness_coach"]))):
    target = _get_assigned_user(db, current_user, user_id)
    buffer = generate_excel_report(gather_report_data(db, target.id))
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=user_{target.id}_report.xlsx"})