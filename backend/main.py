from fastapi import FastAPI
from app.database.connection import Base, engine
from app.models import user, alarm
from app.routes import auth_routes, alarm_routes

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth_routes.router)
app.include_router(alarm_routes.router)

@app.get("/")
def read_root():
    return {"message": "Cognitive Alarm Platform is running!"}