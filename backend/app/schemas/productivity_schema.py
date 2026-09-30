import datetime
from pydantic import BaseModel, Field
from typing import Optional, List

class ProductivityCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    note: Optional[str] = None
    log_date: Optional[datetime.date] = None

class ProductivityLogResponse(BaseModel):
    id: int
    log_date: datetime.date
    rating: int
    note: Optional[str] = None

    class Config:
        from_attributes = True

class DailyPoint(BaseModel):
    date: str
    wake_quality: float
    productivity: int

class ProductivityCorrelation(BaseModel):
    days_analyzed: int
    correlation: Optional[float] = None
    strength: str
    insight: str
    daily_points: List[DailyPoint]