from sqlalchemy import text

INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_wakeup_logs_user_id ON wakeup_logs(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_wakeup_logs_alarm_id ON wakeup_logs(alarm_id)",
    "CREATE INDEX IF NOT EXISTS idx_wakeup_logs_verified_at ON wakeup_logs(verified_at)",
    "CREATE INDEX IF NOT EXISTS idx_alarms_user_id ON alarms(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_habit_score_logs_user_id ON habit_score_logs(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_productivity_logs_user_id ON productivity_logs(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)",
]


def ensure_indexes(engine):
    with engine.begin() as conn:
        for statement in INDEXES:
            conn.execute(text(statement))