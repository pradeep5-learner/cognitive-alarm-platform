from pydantic import BaseModel
from typing import List
from typing import Optional

class DayOfWeekStat(BaseModel):
    day: str
    avg_snoozes: float
    avg_attempts: float
    sessions: int

class WakeTimeTrendPoint(BaseModel):
    date: str
    actual_wake_time_minutes: int

class BehavioralAnalytics(BaseModel):
    day_of_week_breakdown: List[DayOfWeekStat]
    wake_time_trend: List[WakeTimeTrendPoint]
    worst_day: str
    best_day: str
    avg_response_time_minutes: float

class SleepPatternAnalysis(BaseModel):
    sleep_duration_hours: Optional[float] = None
    category: str
    avg_attempts_on_this_schedule: Optional[float] = None
    insight: str