from pydantic import BaseModel
import datetime
from typing import Optional

class AlarmCreate(BaseModel):
    label: Optional[str] = "Alarm"
    time: datetime.time
    alarm_type: Optional[str] = "daily"
    ringtone: Optional[str] = "classic"

class AlarmResponse(BaseModel):
    id: int
    label: str
    time: datetime.time
    alarm_type: str
    ringtone: str
    is_active: bool

    class Config:
        from_attributes = True

class AlarmUpdate(BaseModel):
    label: Optional[str] = None
    time: Optional[datetime.time] = None
    alarm_type: Optional[str] = None
    ringtone: Optional[str] = None
    is_active: Optional[bool] = None