def test_weak_password_rejected(client):
    response = client.post("/auth/register", json={
        "name": "Weak Pass", "email": "weakpass@pytest.com", "password": "123"
    })
    assert response.status_code == 422


def test_tampered_jwt_rejected(client):
    client.post("/auth/register", json={"name": "JWT Test", "email": "jwttest@pytest.com", "password": "validpass123"})
    login_res = client.post("/auth/login", json={"email": "jwttest@pytest.com", "password": "validpass123"})
    token = login_res.json()["access_token"]

    tampered_token = token[:-5] + "XXXXX"
    response = client.get("/auth/profile", headers={"Authorization": f"Bearer {tampered_token}"})
    assert response.status_code == 401


def test_sql_injection_attempt_handled_safely(client):
    response = client.post("/auth/login", json={
        "email": "' OR '1'='1", "password": "' OR '1'='1"
    })
    assert response.status_code in (401, 422)


def test_login_rate_limited(client):
    for i in range(6):
        response = client.post("/auth/login", json={"email": "ratelimit@pytest.com", "password": "wrongpass"})
    assert response.status_code == 429