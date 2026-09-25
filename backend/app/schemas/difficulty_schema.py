from pydantic import BaseModel

class DifficultyPrediction(BaseModel):
    recommended_difficulty: str
    confidence: float
    is_ml_prediction: bool