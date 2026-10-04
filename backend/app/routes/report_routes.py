from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.database.auth_dependency import get_current_user
from app.database.report_generator import gather_report_data
from app.database.pdf_report import generate_pdf_report
from app.models.user import User
from app.database.excel_report import generate_excel_report

router = APIRouter(prefix="/reports", tags=["Reports"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/pdf")
def download_pdf_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = gather_report_data(db, current_user.id)
    buffer = generate_pdf_report(data)
    filename = f"habit_report_{current_user.id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/excel")
def download_excel_report(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = gather_report_data(db, current_user.id)
    buffer = generate_excel_report(data)
    filename = f"habit_report_{current_user.id}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )