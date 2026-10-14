import os


def test_register_as_wellness_coach(client):
    res = client.post("/auth/register", json={
        "name": "Coach", "email": "coachreg@pytest.com",
        "password": "coachpass123", "role": "wellness_coach"
    })
    assert res.status_code == 200
    assert res.json()["role"] == "wellness_coach"


def test_register_as_admin_requires_correct_code(client):
    no_code = client.post("/auth/register", json={
        "name": "Sneaky", "email": "sneaky@pytest.com",
        "password": "sneakypass123", "role": "admin"
    })
    assert no_code.status_code == 403

    wrong_code = client.post("/auth/register", json={
        "name": "Sneaky", "email": "sneaky@pytest.com",
        "password": "sneakypass123", "role": "admin", "admin_code": "wrong"
    })
    assert wrong_code.status_code == 403


def test_register_as_admin_with_correct_code(client):
    res = client.post("/auth/register", json={
        "name": "Real Admin", "email": "realadmin@pytest.com",
        "password": "adminpass123", "role": "admin",
        "admin_code": os.environ["ADMIN_SIGNUP_CODE"]
    })
    assert res.status_code == 200
    assert res.json()["role"] == "admin"


def test_login_as_must_match_account_role(client):
    client.post("/auth/register", json={
        "name": "Plain User", "email": "plainuser@pytest.com", "password": "plainpass123"
    })
    wrong = client.post("/auth/login", json={
        "email": "plainuser@pytest.com", "password": "plainpass123", "login_as": "admin"
    })
    assert wrong.status_code == 403

    right = client.post("/auth/login", json={
        "email": "plainuser@pytest.com", "password": "plainpass123", "login_as": "user"
    })
    assert right.status_code == 200