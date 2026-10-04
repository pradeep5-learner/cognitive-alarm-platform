from datetime import datetime, timedelta, date
from app.models.notification import Notification
from app.models.user import User
from app.models.alarm import Alarm
from app.models.wakeup_log import WakeUpLog
from app.database.habit_scoring import calculate_habit_score, calculate_daily_streak
from app.database.ml_difficulty_model import calculate_engagement_status


def already_notified_today(db, user_id, notif_type):
    today_start = datetime.combine(date.today(), datetime.min.time())
    existing = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.notif_type == notif_type,
        Notification.created_at >= today_start
    ).first()
    return existing is not None


def create_notification(db, user_id, notif_type, title, message):
    notif = Notification(user_id=user_id, notif_type=notif_type, title=title, message=message)
    db.add(notif)
    db.commit()


def check_bedtime_reminder(db, user):
    if already_notified_today(db, user.id, "bedtime"):
        return
    if not user.preferred_wake_time or not user.sleep_duration_hours:
        return

    wake_minutes = user.preferred_wake_time.hour * 60 + user.preferred_wake_time.minute
    bedtime_minutes = (wake_minutes - int(user.sleep_duration_hours * 60)) % (24 * 60)
    now = datetime.now()
    now_minutes = now.hour * 60 + now.minute

    if abs(now_minutes - bedtime_minutes) <= 15:
        h, m = divmod(bedtime_minutes, 60)
        create_notification(
            db, user.id, "bedtime",
            "Bedtime coming up",
            f"To get {user.sleep_duration_hours}h of sleep before your {user.preferred_wake_time.strftime('%H:%M')} wake-up, aim to be in bed around {h:02d}:{m:02d}."
        )


def check_wakeup_reminder(db, user):
    now = datetime.now()
    alarms = db.query(Alarm).filter(Alarm.user_id == user.id, Alarm.is_active == True).all()
    for alarm in alarms:
        alarm_minutes = alarm.time.hour * 60 + alarm.time.minute
        now_minutes = now.hour * 60 + now.minute
        diff = alarm_minutes - now_minutes
        if 0 <= diff <= 30:
            notif_key = f"wakeup_{alarm.id}_{date.today().isoformat()}"
            existing = db.query(Notification).filter(
                Notification.user_id == user.id,
                Notification.notif_type == "wakeup",
                Notification.message.like(f"%{alarm.label}%"),
                Notification.created_at >= datetime.combine(date.today(), datetime.min.time())
            ).first()
            if not existing:
                create_notification(
                    db, user.id, "wakeup",
                    "Alarm coming up",
                    f"Your \"{alarm.label}\" alarm rings at {alarm.time.strftime('%H:%M')} — {diff} minutes from now."
                )


def check_habit_alert(db, user):
    if already_notified_today(db, user.id, "habit_alert"):
        return
    scores = calculate_habit_score(db, user.id)
    if scores["total_score"] < 40 and scores["challenge_completion_score"] is not None:
        logs_count = db.query(WakeUpLog).filter(WakeUpLog.user_id == user.id).count()
        if logs_count >= 5:
            create_notification(
                db, user.id, "habit_alert",
                "Your habit score needs attention",
                f"Your habit score is {scores['total_score']}/100. Check Insights to see what's affecting it most."
            )


def check_challenge_reminder(db, user):
    if already_notified_today(db, user.id, "challenge"):
        return
    cutoff = datetime.utcnow() - timedelta(minutes=10)
    stuck = db.query(WakeUpLog).filter(
        WakeUpLog.user_id == user.id,
        WakeUpLog.is_verified == False,
        WakeUpLog.started_at <= cutoff,
        WakeUpLog.started_at >= cutoff - timedelta(hours=2)
    ).first()
    if stuck:
        create_notification(
            db, user.id, "challenge",
            "You have an unfinished challenge",
            "You started a wake-up challenge but haven't completed it. Head back to finish and dismiss your alarm."
        )


def check_progress_notification(db, user):
    streak_data = calculate_daily_streak(db, user.id)
    current = streak_data["current_streak"]
    if current in [3, 7, 14, 30]:
        notif_key = f"progress_{current}"
        existing = db.query(Notification).filter(
            Notification.user_id == user.id,
            Notification.notif_type == "progress",
            Notification.message.like(f"%{current} day%")
        ).first()
        if not existing:
            create_notification(
                db, user.id, "progress",
                "Streak milestone!",
                f"You've hit a {current}-day wake-up streak. Keep it going."
            )


def run_notification_checks(db, user_id):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return
    check_bedtime_reminder(db, user)
    check_wakeup_reminder(db, user)
    check_habit_alert(db, user)
    check_challenge_reminder(db, user)
    check_progress_notification(db, user)