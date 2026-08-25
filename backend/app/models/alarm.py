from sqlalchemy import Column, Integer, String, Time, Boolean, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database.connection import Base

class Alarm(Base):
    __tablename__ = "alarms"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    label = Column(String, default="Alarm")
    time = Column(Time, nullable=False)
    alarm_type = Column(String, default="daily")  # daily, weekday, weekend, one_time, smart_adaptive
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())