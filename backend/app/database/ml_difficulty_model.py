import os
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

    total_logs = db.query(WakeUpLog).filter(WakeUpLog.user_id == user_id).count()
    verified_count = db.query(WakeUpLog).filter(WakeUpLog.user_id == user_id, WakeUpLog.is_verified == True).count()
    completion_rate = (verified_count / total_logs * 100) if total_logs > 0 else 50

    predicted_difficulty, confidence = predict_difficulty(
        avg_attempts=avg_attempts,
        avg_snoozes=avg_snoozes,
        avg_response_time=avg_response_time,
        recent_completion_rate=completion_rate
    )

    return predicted_difficulty, confidence, True