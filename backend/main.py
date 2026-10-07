from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import Base, engine
from app.routes import auth_routes, alarm_routes, challenge_routes, wakeup_routes, admin_routes, coach_routes, habit_routes, behavior_routes, difficulty_routes, recommendation_routes, productivity_routes, notification_routes, report_routes
from app.models import user, alarm, challenge, wakeup_log, habit_score
from app.models import user, alarm, challenge, wakeup_log, habit_score, productivity_log, rl_agent_state, notification
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from app.database.rate_limiter import limiter


Base.metadata.create_all(bind=engine)

app = FastAPI()

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_routes.router)
app.include_router(alarm_routes.router)
app.include_router(challenge_routes.router)
app.include_router(wakeup_routes.router)
app.include_router(admin_routes.router)
app.include_router(coach_routes.router)
app.include_router(habit_routes.router)
app.include_router(behavior_routes.router)
app.include_router(difficulty_routes.router)
app.include_router(recommendation_routes.router)
app.include_router(productivity_routes.router)
app.include_router(notification_routes.router)
app.include_router(report_routes.router)

@app.get("/")
def read_root():
    return {"message": "Cognitive Alarm Platform is running!"}