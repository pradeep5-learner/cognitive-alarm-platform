def get_auth_headers(client, email, password="testpass123"):
    client.post("/auth/register", json={"name": "Flow Tester", "email": email, "password": password})
    response = client.post("/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_full_wakeup_cycle(client):
    headers = get_auth_headers(client, "wakeupflow@pytest.com")

    alarm_res = client.post("/alarms/", json={"label": "Test Alarm", "time": "06:00:00", "alarm_type": "daily"}, headers=headers)
    alarm_id = alarm_res.json()["id"]

    start_res = client.post(f"/wakeup/start/{alarm_id}", headers=headers)
    assert start_res.status_code == 200
    session_data = start_res.json()
    assert "wakeup_log_id" in session_data
    assert "question" in session_data
    assert session_data["correct_streak"] == 0

    wrong_submit = client.post("/wakeup/submit", json={
        "wakeup_log_id": session_data["wakeup_log_id"],
        "submitted_answer": "definitely_wrong_answer_xyz"
    }, headers=headers)
    assert wrong_submit.status_code == 200
    assert wrong_submit.json()["is_correct"] is False


def test_snooze_increments_count(client):
    headers = get_auth_headers(client, "snoozetest@pytest.com")
    alarm_res = client.post("/alarms/", json={"label": "Snooze Test", "time": "06:00:00", "alarm_type": "daily"}, headers=headers)
    alarm_id = alarm_res.json()["id"]

    start_res = client.post(f"/wakeup/start/{alarm_id}", headers=headers)
    log_id = start_res.json()["wakeup_log_id"]

    snooze_res = client.post("/wakeup/snooze", json={"wakeup_log_id": log_id}, headers=headers)
    assert snooze_res.status_code == 200
    assert snooze_res.json()["snooze_count"] == 1


def test_cannot_start_wakeup_for_others_alarm(client):
    headers_a = get_auth_headers(client, "ownerA@pytest.com")
    headers_b = get_auth_headers(client, "ownerB@pytest.com")

    alarm_res = client.post("/alarms/", json={"label": "A's Alarm", "time": "06:00:00", "alarm_type": "daily"}, headers=headers_a)
    alarm_id = alarm_res.json()["id"]

    response = client.post(f"/wakeup/start/{alarm_id}", headers=headers_b)
    assert response.status_code == 404