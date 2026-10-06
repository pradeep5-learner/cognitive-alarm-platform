def get_auth_headers(client, email, password="testpass123"):
    client.post("/auth/register", json={"name": "Role Tester", "email": email, "password": password})
    response = client.post("/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_regular_user_cannot_access_admin_routes(client):
    headers = get_auth_headers(client, "regularuser@pytest.com")
    response = client.get("/admin/users", headers=headers)
    assert response.status_code == 403


def test_regular_user_cannot_access_coach_routes(client):
    headers = get_auth_headers(client, "regularuser2@pytest.com")
    response = client.get("/coach/my-users", headers=headers)
    assert response.status_code == 403


def test_admin_cannot_change_own_role(client):
    from app.database.connection import SessionLocal
    from app.models.user import User

    headers = get_auth_headers(client, "selfadmin@pytest.com")
    db = SessionLocal()
    user = db.query(User).filter(User.email == "selfadmin@pytest.com").first()
    user.role = "admin"
    db.commit()
    user_id = user.id
    db.close()

    response = client.put(f"/admin/users/{user_id}/role", json={"role": "user"}, headers=headers)
    assert response.status_code == 400


def test_invalid_role_rejected(client):
    from app.database.connection import SessionLocal
    from app.models.user import User

    headers = get_auth_headers(client, "adminrole@pytest.com")
    other_headers = get_auth_headers(client, "targetuser@pytest.com")

    db = SessionLocal()
    admin_user = db.query(User).filter(User.email == "adminrole@pytest.com").first()
    admin_user.role = "admin"
    target_user = db.query(User).filter(User.email == "targetuser@pytest.com").first()
    target_id = target_user.id
    db.commit()
    db.close()

    response = client.put(f"/admin/users/{target_id}/role", json={"role": "superuser"}, headers=headers)
    assert response.status_code == 400