from pydantic import BaseModel
from datetime import datetime

class HabitScoreResponse(BaseModel):
    wake_consistency_score: float
    challenge_completion_score: float
    snooze_reduction_score: float
    sleep_adherence_score: float
    total_score: float

class HabitScoreHistoryItem(BaseModel):
    total_score: float
    calculated_at: datetime

    class Config:
        from_attributes = True