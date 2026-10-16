# Intelligent Cognitive Alarm Platform

An alarm platform that makes you solve a puzzle before you can dismiss it, then learns from how you wake up.
Built for the Infosys Springboard 7.0 virtual internship.

## Features
- **Cognitive alarms:** 7 challenge types (math, riddle, logic, memory, word game, pattern, quiz) with five difficulty levels, a countdown timer and multi-step verification.
- **Alarm types:** daily, weekday, weekend, one-time and smart adaptive, with a sound that keeps ringing until the challenge is solved.
- **Adaptive intelligence:** a RandomForest model predicts the right difficulty, a reinforcement learning agent nudges it, and engagement optimization eases things when a user disengages.
- **Habit tracking:** weighted habit score, daily streaks, wake-up goal tracking, behavioral analytics, productivity correlation and personalized recommendations.
- **Three roles:** User, Wellness Coach (assigned users and full per-user detail) and Admin (user management, recommendation monitoring, announcements, system reports).
- **Notifications and reports:** an in-app notification center, and PDF and Excel exports for users and for the whole platform.

## Tech stack
FastAPI, SQLAlchemy and PostgreSQL on the backend; React, Recharts and lucide-react on the frontend; scikit-learn, pandas and NumPy for the intelligence; ReportLab and openpyxl for reports; pytest for tests; Docker and Docker Compose for packaging.

## Run with Docker
```
Copy-Item .env.example .env
docker compose up --build
```
Stop any locally running backend or frontend first, because Docker uses the same ports.
Open http://localhost:3000. The API health check is http://localhost:8000/health and the API docs are at http://localhost:8000/docs.
View logs with `docker compose logs -f backend`.

## Run locally
Backend: create a `.env` in `backend/` with `DATABASE_URL`, `SECRET_KEY` and `ADMIN_SIGNUP_CODE`, then
`pip install -r requirements.txt` and `uvicorn main:app --reload`.
Frontend: `npm install` then `npm start` inside `frontend/`.

## Tests
Create a separate test database and a `backend/.env.test` pointing at it, then run `pytest tests/ -v` inside `backend/`.

## User guide
- **User:** register as User, create alarms on the Alarms page, solve the challenge when an alarm rings (keep the tab open), and follow your progress on Dashboard, Insights and Reports.
- **Wellness Coach:** register as Wellness Coach. An admin assigns users to you, and My Users shows each person's full detail with downloadable reports.
- **Admin:** register with the admin code. Manage roles and coach assignments, send announcements, monitor recommendations and download system reports.

## Known limits
- Alarms ring only while the browser tab is open. Background and mobile alarms need a native app (Firebase Cloud Messaging, Android AlarmManager, iOS local notifications).
- Alarm times follow the browser's time zone.
- The difficulty model is trained on synthetic data and should be retrained on real usage data over time.