def test_week_overview_and_goal_flag(client):
    client.post("/auth/register", json={"name": "Week Tester", "email": "weektest@pytest.com", "password": "testpass123"})
    res = client.post("/auth/login", json={"email": "weektest@pytest.com", "password": "testpass123"})
    headers = {"Authorization": f"Bearer {res.json()['access_token']}"}

    data = client.get("/habits/week", headers=headers).json()
    assert len(data["days"]) == 7
    assert data["days"][-1]["is_today"] is True
    assert data["goal"]["has_goal"] is False

    client.put("/auth/profile", json={"preferred_wake_time": "06:30:00"}, headers=headers)
    data = client.get("/habits/week", headers=headers).json()
    assert data["goal"]["has_goal"] is True
    assert data["goal"]["target_label"] == "6:30 AM"