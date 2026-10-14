from app.models.wakeup_log import WakeUpLog
from app.models.alarm import Alarm
from app.models.challenge import Challenge


def get_recent_sessions(db, user_id, limit=10):
    rows = (
        db.query(WakeUpLog, Alarm, Challenge)
        .join(Alarm, WakeUpLog.alarm_id == Alarm.id)
        .join(Challenge, WakeUpLog.challenge_id == Challenge.id)
        .filter(WakeUpLog.user_id == user_id)
        .order_by(WakeUpLog.started_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "started_at": log.started_at.isoformat(),
            "alarm_label": alarm.label,
            "challenge_type": challenge.challenge_type,
            "difficulty": challenge.difficulty,
            "attempts": log.attempts,
            "snooze_count": log.snooze_count,
            "verified": log.is_verified,
        }
        for log, alarm, challenge in rows
    ]