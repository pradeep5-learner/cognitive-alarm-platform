import datetime
from typing import List, Optional
from pydantic import BaseModel, field_validator
from app.database.alarm_challenges import ALL_TYPES, decode_challenge_types


class AlarmCreate(BaseModel):
    label: Optional[str] = "Alarm"
    time: datetime.time
    alarm_type: Optional[str] = "daily"
    ringtone: Optional[str] = "classic"
    challenge_types: Optional[List[str]] = None

    @field_validator("challenge_types")
    @classmethod
    def check_types(cls, value):
        bad = [t for t in (value or []) if t not in ALL_TYPES]
        if bad:
            raise ValueError(f"Unknown challenge type: {bad[0]}")
        return value


class AlarmResponse(BaseModel):
    id: int
    label: str
    time: datetime.time
    alarm_type: str
    ringtone: str
    challenge_types: List[str]
    is_active: bool

    @field_validator("challenge_types", mode="before")
    @classmethod
    def decode_types(cls, value):
        if value is None or isinstance(value, str):
            return decode_challenge_types(value)
        return value

    class Config:
        from_attributes = True


class AlarmUpdate(BaseModel):
    label: Optional[str] = None
    time: Optional[datetime.time] = None
    alarm_type: Optional[str] = None
    ringtone: Optional[str] = None
    challenge_types: Optional[List[str]] = None
    is_active: Optional[bool] = None

    @field_validator("challenge_types")
    @classmethod
    def check_types(cls, value):
        bad = [t for t in (value or []) if t not in ALL_TYPES]
        if bad:
            raise ValueError(f"Unknown challenge type: {bad[0]}")
        return value