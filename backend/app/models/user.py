from sqlalchemy import Column, Integer, String, DateTime, Time, Float
from sqlalchemy.sql import func
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")

    # Profile fields
    preferred_wake_time = Column(Time, nullable=True)
    sleep_duration_hours = Column(Float, nullable=True)
    timezone = Column(String, default="Asia/Kolkata")
    productivity_goal = Column(String, nullable=True)
    difficulty_preference = Column(String, default="medium")  # beginner, easy, medium, hard, expert
    habit_preferences = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())