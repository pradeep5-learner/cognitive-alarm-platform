from pydantic import BaseModel

class WakeUpStartResponse(BaseModel):
    wakeup_log_id: int
    challenge_id: int
    question: str
    challenge_type: str
    difficulty: str
    correct_streak: int
    required_streak: int
    time_limit_seconds: int

class WakeUpSubmitRequest(BaseModel):
    wakeup_log_id: int
    submitted_answer: str

class WakeUpSnoozeRequest(BaseModel):
    wakeup_log_id: int