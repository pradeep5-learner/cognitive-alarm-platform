from pydantic import BaseModel
from typing import List

class UserListItem(BaseModel):
    id: int
    name: str
    email: str
    role: str

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