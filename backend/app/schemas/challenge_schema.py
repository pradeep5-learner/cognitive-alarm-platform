from pydantic import BaseModel

class ChallengeResponse(BaseModel):
    id: int
    challenge_type: str
    difficulty: str
    question: str

    class Config:
        from_attributes = True

class ChallengeAnswerSubmit(BaseModel):
    challenge_id: int
    submitted_answer: str