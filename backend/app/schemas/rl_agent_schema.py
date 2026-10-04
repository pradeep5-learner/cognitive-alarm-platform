from pydantic import BaseModel
from typing import Dict

class RLAgentStatus(BaseModel):
    q_values: Dict[str, float]
    pulls: Dict[str, int]
    current_best_action: str