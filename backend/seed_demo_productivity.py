import random
from datetime import datetime, timedelta, date
from app.database.connection import SessionLocal
from app.models import user, alarm, challenge, wakeup_log, productivity_log  # noqa: registers all tables
from app.models.challenge import Challenge
from app.models.wakeup_log import WakeUpLog
from app.models.productivity_log import ProductivityLog

USER_ID = 7   # change to your test account's id
ALARM_ID = 13  # an alarm that belongs to that account
DAYS = 14

db = SessionLocal()
for i in range(DAYS, 0, -1):
    day = date.today() - timedelta(days=i)
    snoozes = random.choice([0, 0, 1, 2, 3])
    attempts = random.choice([1, 1, 2, 3])

    ch = Challenge(challenge_type="math", difficulty="medium", question="demo", correct_answer="0")
    db.add(ch)
    db.commit()
    db.refresh(ch)

    start = datetime.combine(day, datetime.min.time()) + timedelta(hours=6)
    db.add(WakeUpLog(
        user_id=USER_ID, alarm_id=ALARM_ID, challenge_id=ch.id,
        is_verified=True, attempts=attempts, snooze_count=snoozes,
        correct_streak=1, required_streak=1,
        started_at=start, verified_at=start + timedelta(minutes=random.randint(1, 4)),
    ))

    quality = 100 - snoozes * 25 - (attempts - 1) * 10
    rating = round(1 + (quality / 100) * 4 + random.uniform(-0.7, 0.7))
    db.add(ProductivityLog(user_id=USER_ID, log_date=day, rating=max(1, min(5, rating))))
    db.commit()

db.close()
print("Demo data created.")