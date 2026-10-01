from pydantic import BaseModel
from typing import Dict, Optional

class TypePerformance(BaseModel):
    avg_attempts: Optional[float] = None
    count: int
    skill_weight: float

class ChallengeTypePerformanceResponse(BaseModel):
    performance: Dict[str, TypePerformance]