from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database.connection import Base

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(Integer, primary_key=True, index=True)
    challenge_type = Column(String, nullable=False)  # math, riddle, logic, memory, word_game
    difficulty = Column(String, default="medium")  # beginner, easy, medium, hard, expert
    question = Column(String, nullable=False)
    correct_answer = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())