from app.database.time_format import format_12h


def test_health_endpoint(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "database": "up"}


def test_format_12h():
    assert format_12h(0, 5) == "12:05 AM"
    assert format_12h(6, 30) == "6:30 AM"
    assert format_12h(12, 0) == "12:00 PM"
    assert format_12h(17, 15) == "5:15 PM"
    assert format_12h(23, 59) == "11:59 PM"