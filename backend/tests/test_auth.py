def test_register_new_user(client):
    response = client.post("/auth/register", json={
        "name": "Test Runner",
        "email": "testrunner@pytest.com",
        "password": "testpass123"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "testrunner@pytest.com"
    assert "password" not in data
    assert "hashed_password" not in data


def test_register_duplicate_email_fails(client):
    client.post("/auth/register", json={
        "name": "First",
        "email": "dupe@pytest.com",
        "password": "testpass123"
    })
    response = client.post("/auth/register", json={
        "name": "Second",
        "email": "dupe@pytest.com",
        "password": "testpass123"
    })
    assert response.status_code == 400


def test_login_with_correct_credentials(client):
    client.post("/auth/register", json={
        "name": "Login Test",
        "email": "logintest@pytest.com",
        "password": "testpass123"
    })
    response = client.post("/auth/login", json={
        "email": "logintest@pytest.com",
        "password": "testpass123"
    })
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_with_wrong_password_fails(client):
    client.post("/auth/register", json={
        "name": "Wrong Pass Test",
        "email": "wrongpass@pytest.com",
        "password": "correctpass"
    })
    response = client.post("/auth/login", json={
        "email": "wrongpass@pytest.com",
        "password": "wrongpass"
    })
    assert response.status_code == 401


def test_protected_route_requires_token(client):
    response = client.get("/auth/profile")
    assert response.status_code in (401, 403)