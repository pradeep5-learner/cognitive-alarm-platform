from datetime import date, datetime, time, timedelta
from app.models.wakeup_log import WakeUpLog
from app.database.time_format import format_12h

TOLERANCE_MINUTES = 15


def _label(minutes):
    return format_12h(int(minutes // 60) % 24, int(minutes % 60))


def calculate_week_overview(db, user, days=7):
    start = date.today() - timedelta(days=days - 1)
    logs = (
        db.query(WakeUpLog)
        .filter(WakeUpLog.user_id == user.id, WakeUpLog.started_at >= datetime.combine(start, time.min))
        .all()
    )

    per_day = {}
    for log in logs:
        bucket = per_day.setdefault(log.started_at.date(), {"sessions": 0, "verified": 0, "first_wake": None})
        bucket["sessions"] += 1
        if log.is_verified:
            bucket["verified"] += 1
            if log.verified_at:
                minutes = log.verified_at.hour * 60 + log.verified_at.minute
                if bucket["first_wake"] is None or minutes < bucket["first_wake"]:
                    bucket["first_wake"] = minutes

    target = None
    if user.preferred_wake_time:
        target = user.preferred_wake_time.hour * 60 + user.preferred_wake_time.minute

    week, wake_minutes, on_target_days = [], [], 0
    for i in range(days):
        day = start + timedelta(days=i)
        b = per_day.get(day)
        first_wake = b["first_wake"] if b else None
        on_target = None
        if first_wake is not None:
            wake_minutes.append(first_wake)
            if target is not None:
                on_target = abs(first_wake - target) <= TOLERANCE_MINUTES
                if on_target:
                    on_target_days += 1
        week.append({
            "date": day.isoformat(),
            "label": day.strftime("%a"),
            "is_today": day == date.today(),
            "sessions": b["sessions"] if b else 0,
            "verified": b["verified"] if b else 0,
            "wake_label": _label(first_wake) if first_wake is not None else None,
            "on_target": on_target,
        })

    average = sum(wake_minutes) / len(wake_minutes) if wake_minutes else None
    return {
        "days": week,
        "goal": {
            "has_goal": target is not None,
            "target_label": _label(target) if target is not None else None,
            "tolerance_minutes": TOLERANCE_MINUTES,
            "days_with_wakeup": len(wake_minutes),
            "days_on_target": on_target_days,
            "avg_wake_label": _label(average) if average is not None else None,
            "avg_offset_minutes": round(average - target) if average is not None and target is not None else None,
        },
    }