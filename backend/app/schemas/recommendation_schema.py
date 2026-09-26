from pydantic import BaseModel
from typing import List

class Recommendation(BaseModel):
    category: str
    title: str
    message: str
    priority: str  # low, medium, high

class RecommendationList(BaseModel):
    recommendations: List[Recommendation]