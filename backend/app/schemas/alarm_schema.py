from pydantic import BaseModel
import datetime
from typing import Optional

class AlarmCreate(BaseModel):
    label: Optional[str] = "Alarm"
    time: datetime.time
    alarm_type: Optional[str] = "daily"

class AlarmResponse(BaseModel):
    id: int
    label: str
    time: datetime.time
    alarm_type: str
    is_active: bool

    class Config:
        from_attributes = True

class AlarmUpdate(BaseModel):
    label: Optional[str] = None
    time: Optional[datetime.time] = None
    alarm_type: Optional[str] = None
    is_active: Optional[bool] = None