from pydantic import BaseModel

class ChallengeAnalytics(BaseModel):
    total_sessions: int
    verified_sessions: int
    completion_rate: float
    first_try_accuracy: float
    average_attempts: float
    total_snoozes: int