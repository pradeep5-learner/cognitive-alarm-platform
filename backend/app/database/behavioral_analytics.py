from collections import defaultdict
from app.models.wakeup_log import WakeUpLog
from datetime import datetime, timedelta

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


def calculate_behavioral_analytics(db, user_id):
    logs = db.query(WakeUpLog).filter(WakeUpLog.user_id == user_id).order_by(WakeUpLog.started_at.asc()).all()

    day_buckets = defaultdict(lambda: {"snoozes": [], "attempts": [], "sessions": 0})

    for log in logs:
        day_name = DAY_NAMES[log.started_at.weekday()]
        day_buckets[day_name]["snoozes"].append(log.snooze_count)
        day_buckets[day_name]["attempts"].append(log.attempts)
        day_buckets[day_name]["sessions"] += 1

    day_of_week_breakdown = []
    for day in DAY_NAMES:
        bucket = day_buckets.get(day)
        if bucket and bucket["sessions"] > 0:
            avg_snoozes = round(sum(bucket["snoozes"]) / bucket["sessions"], 2)
            avg_attempts = round(sum(bucket["attempts"]) / bucket["sessions"], 2)
            day_of_week_breakdown.append({
                "day": day,
                "avg_snoozes": avg_snoozes,
                "avg_attempts": avg_attempts,
                "sessions": bucket["sessions"]
            })

    if day_of_week_breakdown:
        worst = max(day_of_week_breakdown, key=lambda d: d["avg_snoozes"])
        best = min(day_of_week_breakdown, key=lambda d: d["avg_snoozes"])
        worst_day = worst["day"]
        best_day = best["day"]
    else:
        worst_day = "Not enough data"
        best_day = "Not enough data"

    wake_time_trend = []
    for log in logs:
        if log.is_verified and log.verified_at:
            date_str = log.verified_at.strftime("%Y-%m-%d")
            minutes = log.verified_at.hour * 60 + log.verified_at.minute
            wake_time_trend.append({"date": date_str, "actual_wake_time_minutes": minutes})

    def make_naive(dt):
        return dt.replace(tzinfo=None) if dt.tzinfo is not None else dt

    verified_logs = [log for log in logs if log.is_verified and log.verified_at]
    if verified_logs:
        response_times = []
        for log in verified_logs:
            started_naive = make_naive(log.started_at)
            verified_naive = make_naive(log.verified_at)
            delta_seconds = (verified_naive - started_naive).total_seconds()
            if delta_seconds >= 0:
                response_times.append(delta_seconds / 60)
        avg_response_time = round(sum(response_times) / len(response_times), 2) if response_times else 0.0
    else:
        avg_response_time = 0.0

    return {
        "day_of_week_breakdown": day_of_week_breakdown,
        "wake_time_trend": wake_time_trend,
        "worst_day": worst_day,
        "best_day": best_day,
        "avg_response_time_minutes": avg_response_time
    }

from app.models.user import User

def analyze_sleep_patterns(db, user_id):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.sleep_duration_hours:
        return {
            "sleep_duration_hours": None,
            "category": "not_set",
            "avg_attempts_on_this_schedule": None,
            "insight": "Set your intended sleep duration in Profile to see how it relates to your performance."
        }

    hours = user.sleep_duration_hours
    if hours < 6:
        category = "short"
    elif hours <= 8:
        category = "adequate"
    else:
        category = "long"

    logs = db.query(WakeUpLog).filter(
        WakeUpLog.user_id == user_id,
        WakeUpLog.is_verified == True
    ).order_by(WakeUpLog.verified_at.desc()).limit(20).all()

    if not logs:
        avg_attempts = None
        insight = f"You've set a {category} sleep duration ({hours}h). Complete some alarms to see how it relates to your performance."
    else:
        avg_attempts = round(sum(l.attempts for l in logs) / len(logs), 2)
        if category == "short" and avg_attempts > 1.5:
            insight = f"With {hours}h of planned sleep, your average attempts are higher ({avg_attempts}). Getting more sleep may improve your mornings."
        elif category == "adequate" and avg_attempts <= 1.5:
            insight = f"Your {hours}h sleep schedule is paired with strong performance ({avg_attempts} avg attempts). This duration seems to work well for you."
        else:
            insight = f"With {hours}h of planned sleep, your average attempts are {avg_attempts}."

    return {
        "sleep_duration_hours": hours,
        "category": category,
        "avg_attempts_on_this_schedule": avg_attempts,
        "insight": insight
    }

from app.models.alarm import Alarm

def suggest_smart_schedule(db, user_id, alarm_id):
    alarm = db.query(Alarm).filter(Alarm.id == alarm_id, Alarm.user_id == user_id).first()
    if not alarm:
        return None

    cutoff = alarm.updated_at.replace(tzinfo=None) if alarm.updated_at and alarm.updated_at.tzinfo else alarm.updated_at
    logs_query = db.query(WakeUpLog).filter(
        WakeUpLog.alarm_id == alarm_id, WakeUpLog.user_id == user_id, WakeUpLog.is_verified == True
    )
    if cutoff:
        logs_query = logs_query.filter(WakeUpLog.verified_at >= cutoff)
    logs = logs_query.order_by(WakeUpLog.verified_at.desc()).limit(10).all()

    if len(logs) < 5:
        return {
            "has_suggestion": False,
            "current_time": alarm.time.strftime("%H:%M"),
            "suggested_time": None,
            "reason": "Need at least 5 completed wake-ups on this alarm to suggest a schedule change."
        }

    avg_snoozes = sum(l.snooze_count for l in logs) / len(logs)
    response_minutes = []
    for l in logs:
        started = l.started_at.replace(tzinfo=None) if l.started_at.tzinfo else l.started_at
        verified = l.verified_at.replace(tzinfo=None) if l.verified_at.tzinfo else l.verified_at
        delta = (verified - started).total_seconds() / 60
        if delta >= 0:
            response_minutes.append(delta)
    avg_response = sum(response_minutes) / len(response_minutes) if response_minutes else 0

    shift_minutes = 0
    reasons = []
    if avg_snoozes >= 1.5:
        shift_minutes += int(avg_snoozes * 5)
        reasons.append(f"averaging {round(avg_snoozes, 1)} snoozes")
    if avg_response >= 3:
        shift_minutes += int(avg_response)
        reasons.append(f"averaging {round(avg_response, 1)} minutes to fully wake up")

    shift_minutes = min(shift_minutes, 30)

    if shift_minutes < 5:
        return {
            "has_suggestion": False,
            "current_time": alarm.time.strftime("%H:%M"),
            "suggested_time": None,
            "reason": "Your wake-up pattern looks consistent. No schedule change needed."
        }

    current_dt = datetime.combine(datetime.today(), alarm.time)
    suggested_dt = current_dt - timedelta(minutes=shift_minutes)

    return {
        "has_suggestion": True,
        "current_time": alarm.time.strftime("%H:%M"),
        "suggested_time": suggested_dt.strftime("%H:%M"),
        "reason": f"Based on {', '.join(reasons)}, ringing {shift_minutes} min earlier may help you be ready on time."
    }