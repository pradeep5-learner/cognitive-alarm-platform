import logging
import os
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.database.connection import Base, engine
from app.database.indexes import ensure_indexes
from app.database.rate_limiter import limiter
from app.models import user, alarm, challenge, wakeup_log, habit_score, productivity_log, rl_agent_state, notification
from app.routes import (auth_routes, alarm_routes, challenge_routes, wakeup_routes, admin_routes,
                        coach_routes, habit_routes, behavior_routes, difficulty_routes,
                        recommendation_routes, productivity_routes, notification_routes, report_routes)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
logger = logging.getLogger("alarm_platform")

Base.metadata.create_all(bind=engine)
ensure_indexes(engine)

app = FastAPI(title="Intelligent Cognitive Alarm Platform")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        logger.exception("%s %s failed", request.method, request.url.path)
        raise
    elapsed_ms = (time.perf_counter() - start) * 1000
    logger.info("%s %s -> %s (%.0f ms)", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


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


@app.get("/health")
def health_check():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "ok", "database": "up"}
    except Exception:
        logger.exception("Health check failed")
        return JSONResponse(status_code=503, content={"status": "degraded", "database": "down"})