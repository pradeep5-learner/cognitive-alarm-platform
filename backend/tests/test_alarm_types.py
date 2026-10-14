from datetime import datetime, timedelta
import pytest
from app.database.alarm_schedule import rings_on_weekday


def get_headers(client, email):
    client.post("/auth/register", json={"name": "Type Tester", "email": email, "password": "testpass123"})
    res = client.post("/auth/login", json={"email": email, "password": "testpass123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def create_alarm(client, headers, label, alarm_type, time="06:00:00"):
    res = client.post("/alarms/", json={"label": label, "time": time, "alarm_type": alarm_type}, headers=headers)
    return res.json()["id"]


def test_weekday_alarm_schedule():
    for day in range(0, 5):
        assert rings_on_weekday("weekday", day) is True
    assert rings_on_weekday("weekday", 5) is False
    assert rings_on_weekday("weekday", 6) is False


def test_weekend_alarm_schedule():
    assert rings_on_weekday("weekend", 5) is True
    assert rings_on_weekday("weekend", 6) is True
    for day in range(0, 5):
        assert rings_on_weekday("weekend", day) is False


def test_other_alarm_types_ring_every_day():
    for alarm_type in ("daily", "one_time", "smart_adaptive", "something_unexpected"):
        for day in range(7):
            assert rings_on_weekday(alarm_type, day) is True


def test_one_time_alarm_turns_off_after_it_rings(client):
    headers = get_headers(client, "onetime@pytest.com")
    alarm_id = create_alarm(client, headers, "Once Only", "one_time")
    client.post(f"/wakeup/start/{alarm_id}", headers=headers)

    alarms = client.get("/alarms/", headers=headers).json()
    assert [a for a in alarms if a["id"] == alarm_id][0]["is_active"] is False


def test_daily_alarm_stays_on_after_it_rings(client):
    headers = get_headers(client, "dailystays@pytest.com")
    alarm_id = create_alarm(client, headers, "Every Day", "daily")
    client.post(f"/wakeup/start/{alarm_id}", headers=headers)

    alarms = client.get("/alarms/", headers=headers).json()
    assert [a for a in alarms if a["id"] == alarm_id][0]["is_active"] is True


def test_wakeup_notification_skips_alarms_not_ringing_today(client):
    now = datetime.now()
    soon = now + timedelta(minutes=10)
    if soon.date() != now.date():
        pytest.skip("too close to midnight for this check")

    headers = get_headers(client, "notifytypes@pytest.com")
    time_str = soon.strftime("%H:%M:%S")
    wrong_type = "weekend" if now.weekday() <= 4 else "weekday"
    create_alarm(client, headers, "WrongDayAlarm", wrong_type, time_str)
    create_alarm(client, headers, "ControlDailyAlarm", "daily", time_str)

    notifications = client.get("/notifications/", headers=headers).json()
    messages = " ".join(n["message"] for n in notifications)
    assert "ControlDailyAlarm" in messages
    assert "WrongDayAlarm" not in messages