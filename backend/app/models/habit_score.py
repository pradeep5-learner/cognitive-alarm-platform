from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database.connection import Base

class HabitScoreLog(Base):
    __tablename__ = "habit_score_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    wake_consistency_score = Column(Float, default=0.0)
    challenge_completion_score = Column(Float, default=0.0)
    snooze_reduction_score = Column(Float, default=0.0)
    sleep_adherence_score = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    calculated_at = Column(DateTime(timezone=True), server_default=func.now())