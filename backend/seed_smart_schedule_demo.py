from datetime import datetime, timedelta
from app.database.connection import SessionLocal
from app.models import user, alarm, challenge, wakeup_log, productivity_log  # noqa
from app.models.challenge import Challenge
from app.models.wakeup_log import WakeUpLog

USER_ID = 7   # demoseed@test.com's id
ALARM_ID = 17  # replace with the "Smart Test" alarm id from Step 2

db = SessionLocal()
for i in range(6, 0, -1):
    ch = Challenge(challenge_type="math", difficulty="medium", question="demo-smart", correct_answer="0")
    db.add(ch)
    db.commit()
    db.refresh(ch)

    start = datetime.now() - timedelta(minutes=(i * 10))
    db.add(WakeUpLog(
        user_id=USER_ID, alarm_id=ALARM_ID, challenge_id=ch.id,
        is_verified=True, attempts=2, snooze_count=3,
        correct_streak=1, required_streak=1,
        started_at=start, verified_at=start + timedelta(minutes=6),
    ))
    db.commit()

db.close()
print("Smart schedule demo data created.")