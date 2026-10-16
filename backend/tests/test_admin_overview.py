import os


def make_headers(client, email, role="user", admin_code=None):
    body = {"name": "Tester", "email": email, "password": "testpass123", "role": role}
    if admin_code:
        body["admin_code"] = admin_code
    client.post("/auth/register", json=body)
    res = client.post("/auth/login", json={"email": email, "password": "testpass123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def test_admin_overview_is_admin_only_and_complete(client):
    user_h = make_headers(client, "overviewuser@pytest.com")
    assert client.get("/admin/overview", headers=user_h).status_code == 403

    admin_h = make_headers(client, "overviewadmin@pytest.com", "admin", os.environ["ADMIN_SIGNUP_CODE"])
    res = client.get("/admin/overview", headers=admin_h)
    assert res.status_code == 200
    data = res.json()

    for key in ["summary", "roles", "signups", "activity", "habit_distribution", "difficulty",
                "challenge_usage", "wake_hours", "weekday_snoozes", "sleep_distribution", "top_users", "users"]:
        assert key in data
    assert len(data["wake_hours"]) == 24
    assert len(data["activity"]) == 14
    assert any(u["email"] == "overviewuser@pytest.com" for u in data["users"])