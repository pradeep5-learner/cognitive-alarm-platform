import os


def make_headers(client, email, role="user", admin_code=None):
    body = {"name": "Tester", "email": email, "password": "testpass123", "role": role}
    if admin_code:
        body["admin_code"] = admin_code
    client.post("/auth/register", json=body)
    res = client.post("/auth/login", json={"email": email, "password": "testpass123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def admin_headers(client, email):
    return make_headers(client, email, "admin", os.environ["ADMIN_SIGNUP_CODE"])


def test_recommendation_monitor_is_admin_only(client):
    user_h = make_headers(client, "monitoruser@pytest.com")
    assert client.get("/admin/recommendations/monitor", headers=user_h).status_code == 403

    admin_h = admin_headers(client, "monitoradmin@pytest.com")
    res = client.get("/admin/recommendations/monitor", headers=admin_h)
    assert res.status_code == 200
    data = res.json()
    assert data["users_analyzed"] >= 1
    assert set(data["by_priority"].keys()) == {"high", "medium", "low"}


def test_system_reports_are_admin_only_and_generate(client):
    user_h = make_headers(client, "reportuser@pytest.com")
    assert client.get("/reports/system/pdf", headers=user_h).status_code == 403
    assert client.get("/reports/system/excel", headers=user_h).status_code == 403

    admin_h = admin_headers(client, "reportadmin@pytest.com")
    pdf = client.get("/reports/system/pdf", headers=admin_h)
    assert pdf.status_code == 200
    assert pdf.content[:4] == b"%PDF"

    xlsx = client.get("/reports/system/excel", headers=admin_h)
    assert xlsx.status_code == 200
    assert xlsx.content[:2] == b"PK"