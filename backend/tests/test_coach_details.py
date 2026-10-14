def register_and_login(client, email, role="user"):
    client.post("/auth/register", json={
        "name": "Tester", "email": email, "password": "testpass123", "role": role
    })
    res = client.post("/auth/login", json={"email": email, "password": "testpass123"})
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def assign_coach(member_email, coach_email):
    from app.database.connection import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    coach = db.query(User).filter(User.email == coach_email).first()
    member = db.query(User).filter(User.email == member_email).first()
    member.coach_id = coach.id
    member_id = member.id
    db.commit()
    db.close()
    return member_id


def test_coach_can_view_assigned_user(client):
    coach_headers = register_and_login(client, "coachdetail@pytest.com", "wellness_coach")
    register_and_login(client, "assigned@pytest.com")
    member_id = assign_coach("assigned@pytest.com", "coachdetail@pytest.com")

    res = client.get(f"/coach/users/{member_id}/details", headers=coach_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["profile"]["email"] == "assigned@pytest.com"
    assert "habit_scores" in data
    assert len(data["daily_trend"]) == 14


def test_coach_cannot_view_unassigned_user(client):
    coach_headers = register_and_login(client, "coachblock@pytest.com", "wellness_coach")
    register_and_login(client, "stranger@pytest.com")
    from app.database.connection import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    stranger_id = db.query(User).filter(User.email == "stranger@pytest.com").first().id
    db.close()

    res = client.get(f"/coach/users/{stranger_id}/details", headers=coach_headers)
    assert res.status_code == 404


def test_regular_user_cannot_use_coach_details(client):
    headers = register_and_login(client, "notacoach@pytest.com")
    res = client.get("/coach/users/1/details", headers=headers)
    assert res.status_code == 403

def test_coach_can_download_assigned_user_report(client):
    coach_headers = register_and_login(client, "coachreport@pytest.com", "wellness_coach")
    register_and_login(client, "reportmember@pytest.com")
    member_id = assign_coach("reportmember@pytest.com", "coachreport@pytest.com")

    pdf = client.get(f"/coach/users/{member_id}/report/pdf", headers=coach_headers)
    assert pdf.status_code == 200
    assert pdf.content[:4] == b"%PDF"

    xlsx = client.get(f"/coach/users/{member_id}/report/excel", headers=coach_headers)
    assert xlsx.status_code == 200
    assert xlsx.content[:2] == b"PK"


def test_coach_cannot_download_unassigned_user_report(client):
    coach_headers = register_and_login(client, "coachreport2@pytest.com", "wellness_coach")
    register_and_login(client, "otherreportmember@pytest.com")
    from app.database.connection import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    other_id = db.query(User).filter(User.email == "otherreportmember@pytest.com").first().id
    db.close()

    res = client.get(f"/coach/users/{other_id}/report/pdf", headers=coach_headers)
    assert res.status_code == 404