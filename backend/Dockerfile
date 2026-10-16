FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train the difficulty model at build time so the first alarm isn't slow
RUN DATABASE_URL=postgresql://build:build@localhost/build \
    python -c "from app.database.ml_difficulty_model import train_and_save_model; print('model accuracy', train_and_save_model())"

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]