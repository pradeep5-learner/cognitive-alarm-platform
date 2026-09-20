from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database.connection import Base, engine
from app.routes import auth_routes, alarm_routes, challenge_routes, wakeup_routes, admin_routes
from app.models import user, alarm, challenge, wakeup_log

Base.metadata.create_all(bind=engine)

app = FastAPI()

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

@app.get("/")
def read_root():
    return {"message": "Cognitive Alarm Platform is running!"}