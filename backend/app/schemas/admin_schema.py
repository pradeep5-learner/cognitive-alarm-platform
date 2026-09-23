from pydantic import BaseModel
from typing import List

class UserListItem(BaseModel):
    id: int
    name: str
    email: str
    role: str
    coach_id: int | None = None

    class Config:
        from_attributes = True

class PlatformStats(BaseModel):
    total_users: int
    total_alarms: int
    active_alarms: int
    total_wakeup_sessions: int
    platform_completion_rate: float

class RoleUpdateRequest(BaseModel):
    role: str

class CoachAssignRequest(BaseModel):
    coach_id: int

class CoachUserSummary(BaseModel):
    id: int
    name: str
    email: str
    difficulty_preference: str | None = None
    total_alarms: int
    total_wakeup_sessions: int
    completion_rate: float