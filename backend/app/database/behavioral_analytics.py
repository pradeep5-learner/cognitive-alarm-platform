from collections import defaultdict
from app.models.wakeup_log import WakeUpLog

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