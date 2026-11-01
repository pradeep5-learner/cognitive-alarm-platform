<div align="center">

<img src="docs/images/banner.png" alt="Dawn: Intelligent Cognitive Alarm Platform" width="100%">

# Intelligent Cognitive Alarm Platform

**An alarm that makes you think before you can go back to sleep, and learns from every morning.**

![Python](https://img.shields.io/badge/Python-3.14-4A2C7A?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-backend-2A8F83?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-6C56E8?style=flat-square&logo=react&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-1F1A38?style=flat-square&logo=postgresql&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-F2A93B?style=flat-square&logo=scikitlearn&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-E8604C?style=flat-square&logo=docker&logoColor=white)
![Tests](https://img.shields.io/badge/tests-51%20passing-2A8F83?style=flat-square)

[Live demo](https://YOUR-SITE.onrender.com) &nbsp;|&nbsp; [API docs](https://YOUR-BACKEND.onrender.com/docs) &nbsp;|&nbsp; [Report a bug](https://github.com/pradeep5-learner/cognitive-alarm-platform/issues)

<sub>The demo runs on free hosting, so the first load after a quiet period can take about a minute to wake up.</sub>

</div>

---

## Contents

- [Overview](#overview)
- [Features](#features)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [How an alarm works](#how-an-alarm-works)
- [The intelligence behind it](#the-intelligence-behind-it)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API overview](#api-overview)
- [Testing](#testing)
- [Deployment](#deployment)
- [Limitations and roadmap](#limitations-and-roadmap)
- [About](#about)

---

## Overview

Most alarms are built to be silenced. A tap on snooze is enough, and a half-asleep person will often do exactly that.

**Dawn** turns waking up into an active, measurable moment. The alarm keeps ringing until you solve a short cognitive challenge. How you perform then shapes tomorrow: the difficulty of your next puzzle, your habit score, and the advice you receive.

It was built for the **Infosys Springboard 7.0 virtual internship** as a complete product: 13 modules delivered over four milestones, with a FastAPI and PostgreSQL backend, a React front end, machine learning, role-based access, reports, automated tests and Docker packaging.

## Features

**Cognitive alarms**
- Five alarm types: daily, weekday, weekend, one-time (switches itself off after ringing) and smart adaptive.
- Seven challenge types at five difficulty levels: math, riddle, logic, memory, word game, pattern and quiz.
- Choose which question types each alarm may use, one or several.
- One or two correct answers in a row are required, under a countdown from 60 down to 15 seconds depending on difficulty.
- The sound keeps ringing until the challenge is solved. Pressing Back or refreshing returns you to it.
- Four generated ringtones with a preview button, and a 12-hour time picker.

**Adaptive intelligence**
- A scikit-learn **RandomForest** predicts a suitable difficulty from your recent behaviour.
- A **reinforcement learning bandit** nudges the difficulty up, down or leaves it, and learns from outcomes.
- **Engagement optimisation** eases things when you start to drop off.
- **Smart schedule suggestions** propose a better alarm time when you snooze a lot.

**Habit tracking and insights**
- A weighted habit score from five components, with a trend graph and daily streaks.
- Wake-up goal tracking, a week-at-a-glance strip and productivity correlation using NumPy.
- Rule-based, explainable recommendations, including which challenge types you are strongest at.

**Three roles**

| Role | Experience |
|---|---|
| **User** | Dashboard, alarms, insights, reports, profile |
| **Wellness Coach** | A list of assigned users and a full detail page for each one, with PDF and Excel export |
| **Admin** | The Admin Panel only: ten platform charts, a searchable user table with role and coach management, recommendation monitoring, announcements and system reports |

**Notifications and reports**
- In-app notification bell: bedtime, alarm coming up, habit alert, unfinished challenge, streak milestone and admin announcements.
- PDF reports (ReportLab) and Excel workbooks (openpyxl) for users, coaches and the whole platform.

**Engineering**
- 51 automated tests, a rate-limited login, bcrypt password hashing and JWT authentication.
- Docker Compose with a health check, request logging and database indexes created at start-up.

## Screenshots

> Replace the placeholder images in [`docs/screenshots/`](docs/screenshots) with your own, keeping the same file names. A 1280 x 720 capture works well.

<table>
  <tr>
    <td width="50%"><b>Sign in, with user type</b><br><img src="docs/screenshots/login.png" alt="Login page"></td>
    <td width="50%"><b>User dashboard</b><br><img src="docs/screenshots/user-dashboard.png" alt="User dashboard"></td>
  </tr>
  <tr>
    <td width="50%"><b>Alarms</b><br><img src="docs/screenshots/alarms.png" alt="Alarms page"></td>
    <td width="50%"><b>Challenge screen when an alarm rings</b><br><img src="docs/screenshots/alarm-ring.png" alt="Alarm challenge screen"></td>
  </tr>
  <tr>
    <td width="50%"><b>Insights</b><br><img src="docs/screenshots/insights.png" alt="Insights page"></td>
    <td width="50%"><b>Reports</b><br><img src="docs/screenshots/reports.png" alt="Reports page"></td>
  </tr>
  <tr>
    <td width="50%"><b>Coach: full user detail</b><br><img src="docs/screenshots/coach-user-detail.png" alt="Coach user detail"></td>
    <td width="50%"><b>Admin: platform overview</b><br><img src="docs/screenshots/admin-overview.png" alt="Admin overview charts"></td>
  </tr>
  <tr>
    <td width="50%"><b>Admin: users</b><br><img src="docs/screenshots/admin-users.png" alt="Admin user table"></td>
    <td width="50%"></td>
  </tr>
</table>

## Architecture

The system is a layered modular monolith. The React app talks to a FastAPI service over JSON with a bearer token. The service validates every request, applies role checks and delegates to feature modules, which use PostgreSQL through SQLAlchemy and call the intelligence layer.

<p align="center">
  <img src="docs/images/architecture.png" alt="Layered architecture of the platform" width="90%">
</p>

| Layer | Responsibility | Technologies |
|---|---|---|
| Presentation | Role-based screens, charts, route guards, automatic alarm watching | React 19, React Router, Recharts, axios |
| API | Authentication, validation, rate limiting, CORS, request logging, health check | FastAPI, Pydantic, python-jose, slowapi |
| Services | Alarms, challenges, verification, analytics, notifications, reports | Python modules, SQLAlchemy |
| Intelligence | Difficulty prediction, reinforcement learning, engagement, correlation | scikit-learn, NumPy, pandas, joblib |
| Data | Storage and the trained model file | PostgreSQL |

<details>
<summary><b>Database design (entity-relationship diagram)</b></summary>

```mermaid
erDiagram
    USERS ||--o{ ALARMS : owns
    USERS ||--o{ WAKEUP_LOGS : completes
    ALARMS ||--o{ WAKEUP_LOGS : triggers
    CHALLENGES ||--o{ WAKEUP_LOGS : "is asked in"
    USERS ||--o{ HABIT_SCORE_LOGS : has
    USERS ||--o{ PRODUCTIVITY_LOGS : rates
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ RL_AGENT_STATES : "has agent state"
    USERS |o--o{ USERS : coaches

    USERS {
        int id PK
        string name
        string email UK
        string hashed_password
        string role
        int coach_id FK
        time preferred_wake_time
        float sleep_duration_hours
        string difficulty_preference
    }
    ALARMS {
        int id PK
        int user_id FK
        string label
        time time
        string alarm_type
        string ringtone
        string challenge_types
        bool is_active
    }
    CHALLENGES {
        int id PK
        string challenge_type
        string difficulty
        string question
        string correct_answer
    }
    WAKEUP_LOGS {
        int id PK
        int user_id FK
        int alarm_id FK
        int challenge_id FK
        bool is_verified
        int attempts
        int snooze_count
        int required_streak
        string rl_action
    }
    HABIT_SCORE_LOGS {
        int id PK
        int user_id FK
        float total_score
        datetime calculated_at
    }
    PRODUCTIVITY_LOGS {
        int id PK
        int user_id FK
        date log_date
        int rating
    }
    NOTIFICATIONS {
        int id PK
        int user_id FK
        string notif_type
        bool is_read
    }
    RL_AGENT_STATES {
        int id PK
        int user_id FK
        string action
        float q_value
        int pulls
    }
```

</details>

<details>
<summary><b>Wake-up verification flow</b></summary>

```mermaid
flowchart TD
    A["Start session"] --> B["Choose difficulty: ML prediction, engagement easing, RL nudge"]
    B --> C["Choose question type: weighted by skill, limited to the alarm's types"]
    C --> D["Generate question and start countdown"]
    D --> E{"Answered in time?"}
    E -->|no| R["Timeout: streak resets, new question"]
    R --> D
    E -->|yes| F{"Correct?"}
    F -->|no| W["Streak resets, retry"]
    W --> D
    F -->|yes| G{"Required streak of 1 or 2 reached?"}
    G -->|no| H["Next question, streak kept"]
    H --> D
    G -->|yes| I["Alarm dismissed, reward sent to RL agent, sound stops"]
    D -.->|snooze| S["Snooze: count +1, new challenge"]
    S --> D
```

</details>

<details>
<summary><b>Adaptive difficulty pipeline</b></summary>

```mermaid
flowchart LR
    L["Wake-up logs"] --> X["Features: attempts, snoozes, response time, completion rate"]
    X --> M["RandomForest: 200 trees, 5 levels"]
    M --> P["Predicted level and confidence"]
    P --> E["Engagement check: ease one level if disengaging"]
    E --> B["RL bandit: increase, decrease or stay"]
    B --> F["Final difficulty and time limit"]
    F --> Q["Question served"]
    Q --> O["Session outcome"]
    O -->|reward| B
    O -->|new data| L
```

</details>

<details>
<summary><b>Authentication and role routing</b></summary>

```mermaid
flowchart TD
    R["Register: pick User, Coach or Admin"] --> V{"Admin selected?"}
    V -->|yes| AC{"Admin code correct?"}
    AC -->|no| X1["403 error"]
    AC -->|yes| H["Hash password with bcrypt and save"]
    V -->|no| H
    H --> LG["Login: email, password, Login as"]
    LG --> CK{"Password valid and user type matches role?"}
    CK -->|no| X2["401 or 403 error"]
    CK -->|yes| J["JWT issued, valid 60 minutes"]
    J --> RT{"Role router"}
    RT --> U["User: Dashboard, Alarms, Insights, Reports, Profile"]
    RT --> C["Coach: My Users and user detail"]
    RT --> A["Admin: Admin Panel"]
```

</details>

<details>
<summary><b>Deployment architecture</b></summary>

```mermaid
flowchart LR
    Br["Browser"] -->|pages| FE["frontend: nginx serving the React build, port 3000"]
    Br -->|API calls with JWT| BE["backend: FastAPI on Uvicorn, port 8000"]
    BE -->|SQL| DB[("db: PostgreSQL 16, volume pgdata")]
```

</details>

## How an alarm works

```mermaid
flowchart TD
    A["Create alarm: time, repeat type, ringtone, question types"] --> B[("PostgreSQL")]
    B --> C{"AlarmWatcher checks every 15 s"}
    C -->|not due| C
    C -->|due and rings today| D["Ringtone plays and the challenge screen opens"]
    D --> E["Difficulty: ML prediction, engagement easing, RL nudge"]
    E --> F["Question from the alarm's chosen types, with a countdown"]
    F --> G{"Required streak reached?"}
    G -->|no| F
    G -->|yes| H["Alarm dismissed and session logged"]
    H --> I["Habit score, streak, model and recommendations update"]
```

## The intelligence behind it

### Adaptive difficulty (RandomForest)

A `RandomForestClassifier` with 200 trees predicts one of five levels (beginner, easy, medium, hard, expert) from four features computed over your recent sessions: average attempts, average snoozes, average response time and completion rate. The winning level and its probability (shown as confidence) appear on the dashboard.

- Trained on 6,000 synthetic user profiles generated from a hidden skill value plus noise, which is a standard way to bootstrap a model before real usage data exists. The first training run reached about 67% exact-match accuracy.
- With fewer than three verified sessions the model is not used, and your own difficulty preference applies.
- The trained model is saved with joblib and pre-trained during the Docker build.

### Reinforcement learning

A multi-armed bandit chooses between **increase**, **decrease** and **stay**. It explores a random action 15% of the time and otherwise picks the action with the highest learned value. After a completed session, the reward `1 - 0.3 x (attempts - 1) - 0.2 x snoozes`, limited to the range -1 to 1, updates that action's value with learning rate 0.3.

### Habit score

| Component | Weight | How it is calculated |
|---|---|---|
| Wake-up consistency | 30% | Distance between the alarm time and the completion time |
| Challenge completion | 20% | Verified sessions out of all sessions |
| Snooze reduction | 15% | Fewer average snoozes score higher |
| Sleep schedule adherence | 15% | Closeness to your preferred wake-up time |
| Productivity | 20% | Your average daily self-rating over 14 days |

A component with no data scores a neutral 50, so new users are not punished.

### Recommendations

Plain, explainable rules over the same analytics. Examples: "You snooze most on Sundays", "You're strongest at pattern challenges", or "We've eased things up for you". The admin panel shows how often each rule fires across all users.

## Tech stack

| Area | Technology |
|---|---|
| Backend | Python, FastAPI, Uvicorn, SQLAlchemy, Pydantic |
| Database | PostgreSQL |
| Security | bcrypt (passlib), JWT (python-jose), slowapi rate limiting |
| Machine learning | scikit-learn, pandas, NumPy, joblib |
| Frontend | React 19, React Router, axios, Recharts, react-toastify, lucide-react |
| Reports | ReportLab (PDF), openpyxl (Excel) |
| Testing | pytest, httpx |
| Packaging | Docker, Docker Compose, nginx |

## Project structure

```
cognitive-alarm-platform/
├── backend/
│   ├── main.py                  # app setup, CORS, logging, /health
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── app/
│   │   ├── models/              # SQLAlchemy tables
│   │   ├── schemas/             # Pydantic request and response models
│   │   ├── routes/              # one router per feature
│   │   └── database/            # connection, auth, ML, analytics, reports
│   └── tests/                   # 51 pytest tests
├── frontend/
│   ├── src/
│   │   ├── pages/               # Dashboard, Alarms, Insights, Admin, ...
│   │   ├── components/          # Sidebar, AlarmWatcher, TimePicker12, ...
│   │   ├── context/             # authentication state
│   │   ├── services/            # API calls
│   │   ├── utils/               # ringtones, schedule helpers, formatting
│   │   └── styles/theme.css     # the "Dawn Arc" design system
│   ├── Dockerfile
│   └── nginx.conf
├── docs/
│   ├── images/                  # architecture and flow diagrams
│   └── screenshots/             # app screenshots
├── docker-compose.yml
├── .env.example
└── README.md
```

## Getting started

### Option 1: Docker (recommended)

Requires Docker Desktop.

```bash
cp .env.example .env          # on Windows PowerShell: Copy-Item .env.example .env
docker compose up --build
```

Then open:
- App: http://localhost:3000 (use `localhost`, not `127.0.0.1`)
- API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

The first build takes several minutes. Stop with `docker compose down`, or `docker compose down -v` to also wipe the database.

### Option 2: Run locally

Requires Python 3.12 or newer, Node 20 or newer, and PostgreSQL.

1. Create a PostgreSQL database named `cognitive_alarm_db`.
2. Create `backend/.env` (see [Configuration](#configuration)).
3. Start the backend:

```bash
cd backend
python -m venv venv
venv\Scripts\activate            # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

4. In a second terminal, start the front end:

```bash
cd frontend
npm install
npm start
```

Open http://localhost:3000. The tables are created automatically on first start.

### First accounts

Register from the sign-up page and pick a user type. **User** and **Wellness Coach** are open. **Admin** requires the `ADMIN_SIGNUP_CODE` from your environment. To try the coach flow, register a coach and a user, then sign in as the admin and assign the user to the coach from the Users tab.

## Configuration

| Variable | Used by | Purpose |
|---|---|---|
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `SECRET_KEY` | Backend | Signs the JWT tokens. Use a long random value. |
| `ADMIN_SIGNUP_CODE` | Backend | Required to register an administrator |
| `CORS_ORIGINS` | Backend | Comma-separated browser origins allowed to call the API |
| `REACT_APP_API_URL` | Front-end build | Address of the API |
| `DB_PASSWORD` | Docker Compose | Database password |

Example `backend/.env`:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/cognitive_alarm_db
SECRET_KEY=change-me-to-a-long-random-string
ADMIN_SIGNUP_CODE=choose-a-code
```

Never commit real secrets. `.env` files are ignored by Git.

## API overview

Interactive documentation is served at `/docs`. Every route except registration, login and the system routes needs a bearer token.

| Area | Examples |
|---|---|
| Authentication | `POST /auth/register`, `POST /auth/login`, `GET /auth/profile` |
| Alarms | `POST /alarms/`, `GET /alarms/`, `PUT /alarms/{id}`, `DELETE /alarms/{id}` |
| Wake-up | `POST /wakeup/start/{alarm_id}`, `POST /wakeup/submit`, `POST /wakeup/snooze`, `GET /wakeup/history` |
| Analytics | `GET /habits/score`, `GET /habits/streak`, `GET /behavior/analytics`, `GET /recommendations/` |
| Intelligence | `GET /difficulty/predict`, `GET /difficulty/engagement`, `GET /difficulty/rl-agent` |
| Notifications | `GET /notifications/`, `PUT /notifications/{id}/read` |
| Reports | `GET /reports/pdf`, `GET /reports/excel` |
| Coach | `GET /coach/my-users`, `GET /coach/users/{id}/details` |
| Admin | `GET /admin/overview`, `PUT /admin/users/{id}/role`, `GET /admin/recommendations/monitor` |
| System | `GET /health` |

## Testing

The tests call the real API against a separate PostgreSQL database that is created and dropped for each run.

1. Create a database, for example `cognitive_alarm_test_db`.
2. Create `backend/.env.test`:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/cognitive_alarm_test_db
SECRET_KEY=test-secret-key
ADMIN_SIGNUP_CODE=test-admin-code
```

3. Run:

```bash
cd backend
pytest tests/ -v
```

The 51 tests cover authentication and user types, alarms, the wake-up flow, role and data isolation, rate limiting and token tampering, coach and admin features, reports, and an end-to-end user journey.

## Deployment

The project runs on free hosting with three parts:

| Part | Service |
|---|---|
| Database | Neon (PostgreSQL) |
| Backend | Render Web Service, built from `backend/Dockerfile` |
| Front end | Render Static Site, build command `npm install && CI=false npm run build`, publish directory `build`, with a rewrite from `/*` to `/index.html` |

Set `DATABASE_URL`, `SECRET_KEY`, `ADMIN_SIGNUP_CODE` and `CORS_ORIGINS` on the backend, and `REACT_APP_API_URL` on the front end. Free instances sleep when idle, so the first request after a quiet period is slow.

## Limitations and roadmap

**Known limits**
- Alarms ring only while the browser tab is open. Background alarms need a native mobile app.
- The difficulty model is trained on synthetic data and should be retrained on real usage.
- Sleep analysis uses wake times, not recorded hours of sleep.
- Alarm times follow the browser's time zone.
- Admin analytics are computed live, which suits a small user base.

**Planned**
- [ ] Installable web app (PWA)
- [ ] Native Android app with exact alarms and offline challenges
- [ ] OAuth2 sign-in and password reset
- [ ] Model retraining on real data and an XGBoost comparison
- [ ] Admin audit log and database migrations
- [ ] Continuous integration

## About

Built by **R Pradeep** ([@pradeep5-learner](https://github.com/pradeep5-learner)) as a project for the Infosys Springboard 7.0 virtual internship, with thanks to the mentor whose weekly reviews shaped the coach and admin experiences.

If you find a bug or have an idea, please [open an issue](https://github.com/pradeep5-learner/cognitive-alarm-platform/issues).
