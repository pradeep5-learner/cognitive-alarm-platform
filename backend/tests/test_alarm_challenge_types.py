def get_headers(client, email):
    client.post("/auth/register", json={"name": "Types Tester", "email": email, "password": "testpass123"})
    res = client.post("/auth/login", json={"email": email, "password": "testpass123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def make_alarm(client, headers, **extra):
    body = {"label": "Typed", "time": "06:00:00", "alarm_type": "daily"}
    body.update(extra)
    return client.post("/alarms/", json=body, headers=headers)


def test_alarm_saves_chosen_challenge_types(client):
    headers = get_headers(client, "typesave@pytest.com")
    res = make_alarm(client, headers, challenge_types=["math", "riddle"])
    assert res.status_code == 200
    assert res.json()["challenge_types"] == ["math", "riddle"]


def test_alarm_defaults_to_all_challenge_types(client):
    headers = get_headers(client, "typedefault@pytest.com")
    res = make_alarm(client, headers)
    assert len(res.json()["challenge_types"]) == 7


def test_invalid_challenge_type_is_rejected(client):
    headers = get_headers(client, "typebad@pytest.com")
    res = make_alarm(client, headers, challenge_types=["math", "karate"])
    assert res.status_code == 422


def test_update_changes_challenge_types(client):
    headers = get_headers(client, "typeupdate@pytest.com")
    alarm_id = make_alarm(client, headers).json()["id"]
    res = client.put(f"/alarms/{alarm_id}", json={"challenge_types": ["logic"]}, headers=headers)
    assert res.json()["challenge_types"] == ["logic"]


def test_ringtone_is_saved_on_create(client):
    headers = get_headers(client, "typering@pytest.com")
    res = make_alarm(client, headers, ringtone="urgent")
    assert res.json()["ringtone"] == "urgent"


def test_wakeup_only_serves_the_alarms_chosen_types(client):
    headers = get_headers(client, "typewake@pytest.com")
    alarm_id = make_alarm(client, headers, challenge_types=["riddle", "quiz"]).json()["id"]
    for _ in range(12):
        res = client.post(f"/wakeup/start/{alarm_id}", headers=headers)
        assert res.json()["challenge_type"] in ("riddle", "quiz")