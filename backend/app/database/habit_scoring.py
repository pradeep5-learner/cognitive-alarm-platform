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
    productivity = calculate_productivity_score(db, user_id)

    total = (
        wake_consistency * 0.30 +
        challenge_completion * 0.20 +
        snooze_reduction * 0.15 +
        sleep_adherence * 0.15 +
        productivity * 0.20
    )

    return {
        "wake_consistency_score": wake_consistency,
        "challenge_completion_score": challenge_completion,
        "snooze_reduction_score": snooze_reduction,
        "sleep_adherence_score": sleep_adherence,
        "productivity_score": productivity,
        "total_score": round(total, 1)
    }

from app.models.productivity_log import ProductivityLog

def calculate_productivity_score(db, user_id):
    recent_logs = (
        db.query(ProductivityLog)
        .filter(ProductivityLog.user_id == user_id)
        .order_by(ProductivityLog.log_date.desc())
        .limit(14)
        .all()
    )

    if not recent_logs:
        return 50.0

    avg_rating = sum(log.rating for log in recent_logs) / len(recent_logs)
    score = (avg_rating / 5) * 100
    return round(score, 1)

from datetime import date, timedelta as td

def calculate_daily_streak(db, user_id):
    logs = db.query(WakeUpLog).filter(
        WakeUpLog.user_id == user_id,
        WakeUpLog.is_verified == True
    ).all()

    if not logs:
        return {"current_streak": 0, "longest_streak": 0, "last_success_date": None}

    success_dates = set()
    for log in logs:
        if log.verified_at:
            success_dates.add(log.verified_at.date())

    sorted_dates = sorted(success_dates)

    longest_streak = 1
    current_run = 1
    for i in range(1, len(sorted_dates)):
        if sorted_dates[i] == sorted_dates[i - 1] + td(days=1):
            current_run += 1
        else:
            current_run = 1
        longest_streak = max(longest_streak, current_run)

    today = date.today()
    yesterday = today - td(days=1)
    last_success = sorted_dates[-1]

    if last_success == today or last_success == yesterday:
        current_streak = 1
        check_date = last_success
        while (check_date - td(days=1)) in success_dates:
            current_streak += 1
            check_date -= td(days=1)
    else:
        current_streak = 0

    return {
        "current_streak": current_streak,
        "longest_streak": longest_streak,
        "last_success_date": last_success.isoformat()
    }