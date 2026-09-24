from datetime import datetime, time
from app.models.wakeup_log import WakeUpLog
from app.models.alarm import Alarm
from app.models.user import User


def calculate_wake_consistency(db, user_id):
    logs = db.query(WakeUpLog).filter(WakeUpLog.user_id == user_id, WakeUpLog.is_verified == True).all()
    if not logs:
        return 50.0  # neutral score for no history yet

    deltas = []
    for log in logs:
        alarm = db.query(Alarm).filter(Alarm.id == log.alarm_id).first()
        if not alarm or not log.verified_at:
            continue
        alarm_minutes = alarm.time.hour * 60 + alarm.time.minute
        verified_local = log.verified_at
        verified_minutes = verified_local.hour * 60 + verified_local.minute
        delta = abs(verified_minutes - alarm_minutes)
        delta = min(delta, 1440 - delta)  # handle wraparound near midnight
        deltas.append(delta)

    if not deltas:
        return 50.0

    avg_delta = sum(deltas) / len(deltas)
    score = max(0, 100 - (avg_delta * 2))  # lose 2 points per minute of average delay
    return round(min(score, 100), 1)


def calculate_challenge_completion(db, user_id):
    logs = db.query(WakeUpLog).filter(WakeUpLog.user_id == user_id).all()
    if not logs:
        return 50.0

    verified = len([log for log in logs if log.is_verified])
    rate = (verified / len(logs)) * 100
    return round(rate, 1)


def calculate_snooze_reduction(db, user_id):
    logs = db.query(WakeUpLog).filter(WakeUpLog.user_id == user_id).all()
    if not logs:
        return 50.0

    avg_snoozes = sum(log.snooze_count for log in logs) / len(logs)
    score = max(0, 100 - (avg_snoozes * 25))
    return round(min(score, 100), 1)


def calculate_sleep_adherence(db, user_id):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.preferred_wake_time:
        return 50.0

    logs = db.query(WakeUpLog).filter(WakeUpLog.user_id == user_id, WakeUpLog.is_verified == True).all()
    if not logs:
        return 50.0

    preferred_minutes = user.preferred_wake_time.hour * 60 + user.preferred_wake_time.minute
    deltas = []
    for log in logs:
        if not log.verified_at:
            continue
        actual_minutes = log.verified_at.hour * 60 + log.verified_at.minute
        delta = abs(actual_minutes - preferred_minutes)
        delta = min(delta, 1440 - delta)
        deltas.append(delta)

    if not deltas:
        return 50.0

    avg_delta = sum(deltas) / len(deltas)
    score = max(0, 100 - (avg_delta * 1.5))
    return round(min(score, 100), 1)


def calculate_habit_score(db, user_id):
    wake_consistency = calculate_wake_consistency(db, user_id)
    challenge_completion = calculate_challenge_completion(db, user_id)
    snooze_reduction = calculate_snooze_reduction(db, user_id)
    sleep_adherence = calculate_sleep_adherence(db, user_id)

    total = (
        wake_consistency * 0.35 +
        challenge_completion * 0.25 +
        snooze_reduction * 0.20 +
        sleep_adherence * 0.20
    )

    return {
        "wake_consistency_score": wake_consistency,
        "challenge_completion_score": challenge_completion,
        "snooze_reduction_score": snooze_reduction,
        "sleep_adherence_score": sleep_adherence,
        "total_score": round(total, 1)
    }