def get_auth_headers(client, email="alarmtest@pytest.com", password="testpass123"):
    client.post("/auth/register", json={"name": "Alarm Tester", "email": email, "password": password})
    response = client.post("/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_create_alarm(client):
    headers = get_auth_headers(client)
    response = client.post("/alarms/", json={"label": "Gym", "time": "06:30:00", "alarm_type": "daily"}, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["label"] == "Gym"
    assert data["time"] == "06:30:00"


def test_get_alarms_returns_only_own(client):
    headers_a = get_auth_headers(client, "usera@pytest.com", "pass12345")
    headers_b = get_auth_headers(client, "userb@pytest.com", "pass12345")

    client.post("/alarms/", json={"label": "A's Alarm", "time": "07:00:00", "alarm_type": "daily"}, headers=headers_a)
    client.post("/alarms/", json={"label": "B's Alarm", "time": "08:00:00", "alarm_type": "daily"}, headers=headers_b)

    response_a = client.get("/alarms/", headers=headers_a)
    labels_a = [a["label"] for a in response_a.json()]
    assert "A's Alarm" in labels_a
    assert "B's Alarm" not in labels_a


def test_update_alarm_partial(client):
    headers = get_auth_headers(client, "updatetest@pytest.com", "pass12345")
    create_res = client.post("/alarms/", json={"label": "Original", "time": "06:00:00", "alarm_type": "daily"}, headers=headers)
    alarm_id = create_res.json()["id"]

    update_res = client.put(f"/alarms/{alarm_id}", json={"time": "07:00:00"}, headers=headers)
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["time"] == "07:00:00"
    assert data["label"] == "Original"


def test_delete_alarm(client):
    headers = get_auth_headers(client, "deletetest@pytest.com", "pass12345")
    create_res = client.post("/alarms/", json={"label": "To Delete", "time": "09:00:00", "alarm_type": "daily"}, headers=headers)
    alarm_id = create_res.json()["id"]

    delete_res = client.delete(f"/alarms/{alarm_id}", headers=headers)
    assert delete_res.status_code == 200

    get_res = client.get("/alarms/", headers=headers)
    ids = [a["id"] for a in get_res.json()]
    assert alarm_id not in ids


def test_cannot_access_without_token(client):
    response = client.get("/alarms/")
    assert response.status_code in (401, 403)