def test_complete_user_journey(client):
    register_res = client.post("/auth/register", json={
        "name": "Journey User", "email": "journey@pytest.com", "password": "journeypass123"
    })
    assert register_res.status_code == 200

    login_res = client.post("/auth/login", json={"email": "journey@pytest.com", "password": "journeypass123"})
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    profile_res = client.put("/auth/profile", json={
        "preferred_wake_time": "06:30:00",
        "sleep_duration_hours": 7.5,
        "difficulty_preference": "easy"
    }, headers=headers)
    assert profile_res.status_code == 200

    alarm_res = client.post("/alarms/", json={"label": "Journey Alarm", "time": "06:30:00", "alarm_type": "daily"}, headers=headers)
    alarm_id = alarm_res.json()["id"]
    assert alarm_res.status_code == 200

    start_res = client.post(f"/wakeup/start/{alarm_id}", headers=headers)
    session = start_res.json()
    required_streak = session["required_streak"]

    streak_so_far = 0
    log_id = session["wakeup_log_id"]
    while streak_so_far < required_streak:
        challenge = client.get(f"/challenges/generate?challenge_type=math&difficulty=easy", headers=headers)

        from app.database.connection import SessionLocal
        from app.models.wakeup_log import WakeUpLog
        from app.models.challenge import Challenge
        db = SessionLocal()
        wlog = db.query(WakeUpLog).filter(WakeUpLog.id == log_id).first()
        real_challenge = db.query(Challenge).filter(Challenge.id == wlog.challenge_id).first()
        correct_answer = real_challenge.correct_answer
        db.close()

        submit_res = client.post("/wakeup/submit", json={
            "wakeup_log_id": log_id, "submitted_answer": correct_answer
        }, headers=headers)
        result = submit_res.json()
        streak_so_far = result["correct_streak"]

        if not result["alarm_dismissed"]:
            new_start = client.post(f"/wakeup/start/{alarm_id}", headers=headers)
            log_id = new_start.json()["wakeup_log_id"]
        else:
            break

    assert result["alarm_dismissed"] is True

    habit_res = client.get("/habits/score", headers=headers)
    assert habit_res.status_code == 200
    assert habit_res.json()["challenge_completion_score"] > 0

    notif_res = client.get("/notifications/", headers=headers)
    assert notif_res.status_code == 200

    report_res = client.get("/reports/pdf", headers=headers)
    assert report_res.status_code == 200
    assert report_res.headers["content-type"] == "application/pdf"