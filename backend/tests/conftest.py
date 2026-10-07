import os
import sys
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env.test")
load_dotenv(env_path, override=True)

import pytest
from fastapi.testclient import TestClient
from main import app
from app.database.connection import Base, engine


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    return TestClient(app)

from app.database.rate_limiter import limiter

@pytest.fixture(autouse=True)
def reset_rate_limiter():
    limiter.reset()
    yield