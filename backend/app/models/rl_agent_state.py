from sqlalchemy import Column, Integer, String, Float, ForeignKey, UniqueConstraint
from app.database.connection import Base

class RLAgentState(Base):
    __tablename__ = "rl_agent_states"
    __table_args__ = (UniqueConstraint("user_id", "action", name="uq_user_action"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String, nullable=False)  # increase, decrease, stay
    q_value = Column(Float, default=0.0)
    pulls = Column(Integer, default=0)