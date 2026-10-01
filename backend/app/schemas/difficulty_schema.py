from pydantic import BaseModel
from typing import Optional

class DifficultyPrediction(BaseModel):
    recommended_difficulty: str
    confidence: float
    is_ml_prediction: bool
    trend: str
    trend_message: str