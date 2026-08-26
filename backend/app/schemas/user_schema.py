from pydantic import BaseModel, EmailStr
import datetime
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    preferred_wake_time: Optional[datetime.time] = None
    sleep_duration_hours: Optional[float] = None
    timezone: Optional[str] = None
    productivity_goal: Optional[str] = None
    difficulty_preference: Optional[str] = None
    habit_preferences: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    preferred_wake_time: Optional[datetime.time] = None
    sleep_duration_hours: Optional[float] = None
    timezone: Optional[str] = None
    productivity_goal: Optional[str] = None
    difficulty_preference: Optional[str] = None
    habit_preferences: Optional[str] = None

    class Config:
        from_attributes = True