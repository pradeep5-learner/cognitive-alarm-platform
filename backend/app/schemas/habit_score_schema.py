from pydantic import BaseModel
from datetime import datetime

class HabitScoreResponse(BaseModel):
    wake_consistency_score: float
    challenge_completion_score: float
    snooze_reduction_score: float
    sleep_adherence_score: float
    productivity_score: float
    total_score: float

class HabitScoreHistoryItem(BaseModel):
    total_score: float
    calculated_at: datetime

    class Config:
        from_attributes = True

from typing import Optional

class DailyStreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_success_date: Optional[str] = None