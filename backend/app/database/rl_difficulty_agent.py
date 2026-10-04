import random
from app.models.rl_agent_state import RLAgentState

ACTIONS = ["increase", "decrease", "stay"]
DIFFICULTY_ORDER = ["beginner", "easy", "medium", "hard", "expert"]


def get_or_create_state(db, user_id, action):
    state = db.query(RLAgentState).filter(
        RLAgentState.user_id == user_id, RLAgentState.action == action
    ).first()
    if not state:
        state = RLAgentState(user_id=user_id, action=action, q_value=0.0, pulls=0)
        db.add(state)
        db.commit()
        db.refresh(state)
    return state


def choose_action(db, user_id, epsilon=0.15):
    states = {a: get_or_create_state(db, user_id, a) for a in ACTIONS}

    if random.random() < epsilon:
        action = random.choice(ACTIONS)
    else:
        action = max(states, key=lambda a: states[a].q_value)

    return action, {a: round(s.q_value, 3) for a, s in states.items()}


def apply_action(base_difficulty, action):
    if base_difficulty not in DIFFICULTY_ORDER:
        base_difficulty = "medium"
    idx = DIFFICULTY_ORDER.index(base_difficulty)
    if action == "increase":
        idx = min(idx + 1, len(DIFFICULTY_ORDER) - 1)
    elif action == "decrease":
        idx = max(idx - 1, 0)
    return DIFFICULTY_ORDER[idx]


def compute_reward(attempts, snooze_count, verified):
    if not verified:
        return -1.0
    reward = 1.0 - (attempts - 1) * 0.3 - snooze_count * 0.2
    return max(-1.0, min(1.0, reward))


def update_q(db, user_id, action, reward, alpha=0.3):
    state = get_or_create_state(db, user_id, action)
    state.q_value = state.q_value + alpha * (reward - state.q_value)
    state.pulls += 1
    db.commit()
    return state.q_value