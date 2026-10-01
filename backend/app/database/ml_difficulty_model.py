import os
import random
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from app.database.ml_training_data import generate_synthetic_dataset


MODEL_DIR = os.path.join(os.path.dirname(__file__), "ml_models")
MODEL_PATH = os.path.join(MODEL_DIR, "difficulty_model.joblib")

FEATURE_COLUMNS = ["avg_attempts", "avg_snoozes", "avg_response_time", "recent_completion_rate"]


def train_and_save_model():
    df = generate_synthetic_dataset(num_samples=6000)

    X = df[FEATURE_COLUMNS]
    y = df["ideal_difficulty"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    model = RandomForestClassifier(n_estimators=200, max_depth=10, min_samples_leaf=5, random_state=42)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)

    return accuracy


def load_model():
    if not os.path.exists(MODEL_PATH):
        train_and_save_model()
    return joblib.load(MODEL_PATH)


def predict_difficulty(avg_attempts, avg_snoozes, avg_response_time, recent_completion_rate):
    model = load_model()
    input_df = pd.DataFrame([{
        "avg_attempts": avg_attempts,
        "avg_snoozes": avg_snoozes,
        "avg_response_time": avg_response_time,
        "recent_completion_rate": recent_completion_rate
    }])
    prediction = model.predict(input_df)[0]
    probabilities = model.predict_proba(input_df)[0]
    confidence = round(max(probabilities) * 100, 1)
    return prediction, confidence

from app.models.wakeup_log import WakeUpLog

def get_recommended_difficulty(db, user_id, fallback_difficulty="medium"):
    recent_logs = (
        db.query(WakeUpLog)
        .filter(WakeUpLog.user_id == user_id, WakeUpLog.is_verified == True)
        .order_by(WakeUpLog.verified_at.desc())
        .limit(10)
        .all()
    )

    if len(recent_logs) < 3:
        return fallback_difficulty, 0.0, False

    avg_attempts = sum(log.attempts for log in recent_logs) / len(recent_logs)
    avg_snoozes = sum(log.snooze_count for log in recent_logs) / len(recent_logs)

    response_times = []
    for log in recent_logs:
        if not log.verified_at or not log.started_at:
            continue
        started_naive = log.started_at.replace(tzinfo=None) if log.started_at.tzinfo else log.started_at
        verified_naive = log.verified_at.replace(tzinfo=None) if log.verified_at.tzinfo else log.verified_at
        delta = (verified_naive - started_naive).total_seconds() / 60
        if delta >= 0:
            response_times.append(delta)
        avg_response_time = sum(response_times) / len(response_times) if response_times else 30

        recent_all_logs = (
            db.query(WakeUpLog)
            .filter(WakeUpLog.user_id == user_id)
            .order_by(WakeUpLog.started_at.desc())
            .limit(20)
            .all()
        )
        recent_verified_count = len([log for log in recent_all_logs if log.is_verified])
        completion_rate = (recent_verified_count / len(recent_all_logs) * 100) if recent_all_logs else 50
    

    predicted_difficulty, confidence = predict_difficulty(
        avg_attempts=avg_attempts,
        avg_snoozes=avg_snoozes,
        avg_response_time=avg_response_time,
        recent_completion_rate=completion_rate
    )

    return predicted_difficulty, confidence, True

from app.models.challenge import Challenge

CHALLENGE_TYPES = ["math", "riddle", "logic", "memory", "word_game", "pattern", "quiz"]

def get_challenge_type_performance(db, user_id, limit=30):
    recent_logs = (
        db.query(WakeUpLog, Challenge)
        .join(Challenge, WakeUpLog.challenge_id == Challenge.id)
        .filter(WakeUpLog.user_id == user_id, WakeUpLog.is_verified == True)
        .order_by(WakeUpLog.verified_at.desc())
        .limit(limit)
        .all()
    )

    type_stats = {t: {"attempts": [], "count": 0} for t in CHALLENGE_TYPES}
    for wakeup_log, challenge in recent_logs:
        if challenge.challenge_type in type_stats:
            type_stats[challenge.challenge_type]["attempts"].append(wakeup_log.attempts)
            type_stats[challenge.challenge_type]["count"] += 1

    performance = {}
    for t, data in type_stats.items():
        if data["count"] == 0:
            performance[t] = {"avg_attempts": None, "count": 0, "skill_weight": 1.0}
        else:
            avg_attempts = sum(data["attempts"]) / data["count"]
            skill_weight = max(0.3, min(3.0, 2.0 / avg_attempts))
            performance[t] = {
                "avg_attempts": round(avg_attempts, 2),
                "count": data["count"],
                "skill_weight": round(skill_weight, 2)
            }

    return performance


def pick_weighted_challenge_type(db, user_id):
    performance = get_challenge_type_performance(db, user_id)

    types = list(performance.keys())
    weights = [performance[t]["skill_weight"] for t in types]

    return random.choices(types, weights=weights, k=1)[0]


def analyze_learning_trend(db, user_id, window_size=5):
    recent_logs = (
        db.query(WakeUpLog)
        .filter(WakeUpLog.user_id == user_id, WakeUpLog.is_verified == True)
        .order_by(WakeUpLog.verified_at.desc())
        .limit(window_size * 2)
        .all()
    )

    if len(recent_logs) < window_size * 2:
        return {
            "trend": "insufficient_data",
            "message": "Complete more alarms to see your learning trend.",
            "recent_avg_attempts": None,
            "older_avg_attempts": None
        }

    recent_logs_ordered = list(reversed(recent_logs))
    older_half = recent_logs_ordered[:window_size]
    newer_half = recent_logs_ordered[window_size:]

    older_avg = sum(log.attempts for log in older_half) / len(older_half)
    newer_avg = sum(log.attempts for log in newer_half) / len(newer_half)

    change = older_avg - newer_avg

    if change > 0.3:
        trend = "improving"
        message = f"You're improving. Average attempts dropped from {round(older_avg, 1)} to {round(newer_avg, 1)}."
    elif change < -0.3:
        trend = "declining"
        message = f"Your attempts are trending up, from {round(older_avg, 1)} to {round(newer_avg, 1)}. Consider an easier difficulty."
    else:
        trend = "stable"
        message = f"Your performance has been steady, around {round(newer_avg, 1)} attempts per session."

    return {
        "trend": trend,
        "message": message,
        "recent_avg_attempts": round(newer_avg, 2),
        "older_avg_attempts": round(older_avg, 2)
    }