import numpy as np
from collections import defaultdict
from app.models.wakeup_log import WakeUpLog
from app.models.productivity_log import ProductivityLog


def daily_wake_quality(db, user_id):
    logs = db.query(WakeUpLog).filter(
        WakeUpLog.user_id == user_id,
        WakeUpLog.is_verified == True
    ).all()

    by_day = defaultdict(list)
    for log in logs:
        if log.verified_at:
            by_day[log.verified_at.date()].append(log)

    quality = {}
    for day, day_logs in by_day.items():
        avg_snoozes = sum(l.snooze_count for l in day_logs) / len(day_logs)
        avg_attempts = sum(l.attempts for l in day_logs) / len(day_logs)
        score = 100 - (avg_snoozes * 25) - (max(0, avg_attempts - 1) * 10)
        quality[day] = round(max(0, min(100, score)), 1)
    return quality


def calculate_productivity_correlation(db, user_id):
    quality = daily_wake_quality(db, user_id)
    ratings = db.query(ProductivityLog).filter(ProductivityLog.user_id == user_id).all()

    points = []
    for r in ratings:
        if r.log_date in quality:
            points.append({
                "date": r.log_date.isoformat(),
                "wake_quality": quality[r.log_date],
                "productivity": r.rating,
            })
    points.sort(key=lambda p: p["date"])
    n = len(points)

    if n < 3:
        return {
            "days_analyzed": n,
            "correlation": None,
            "strength": "insufficient data",
            "insight": "Log your productivity on at least 3 days that also have a completed wake-up to see how the two relate.",
            "daily_points": points,
        }

    x = np.array([p["wake_quality"] for p in points])
    y = np.array([p["productivity"] for p in points])

    if np.std(x) == 0 or np.std(y) == 0:
        return {
            "days_analyzed": n,
            "correlation": None,
            "strength": "no variation",
            "insight": "Your wake-ups or ratings have been identical every day, so there's nothing to compare yet.",
            "daily_points": points,
        }

    corr = float(np.corrcoef(x, y)[0, 1])
    magnitude = abs(corr)
    if magnitude >= 0.7:
        strength = "strong"
    elif magnitude >= 0.4:
        strength = "moderate"
    elif magnitude >= 0.2:
        strength = "weak"
    else:
        strength = "negligible"

    if corr >= 0.4:
        insight = "On days you wake up cleanly (fewer snoozes and retries), you tend to rate your productivity higher."
    elif corr <= -0.4:
        insight = "Surprisingly, your smoother wake-ups aren't matching your more productive days. Other factors may matter more for you."
    else:
        insight = "No clear relationship between how you wake up and how productive you feel yet. More days of data will sharpen this."

    return {
        "days_analyzed": n,
        "correlation": round(corr, 2),
        "strength": strength,
        "insight": insight,
        "daily_points": points,
    }