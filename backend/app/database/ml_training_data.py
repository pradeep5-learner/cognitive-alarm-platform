import random
import pandas as pd

DIFFICULTY_LEVELS = ["beginner", "easy", "medium", "hard", "expert"]

def generate_synthetic_dataset(num_samples=2000):
    rows = []

    for _ in range(num_samples):
        true_skill = random.uniform(0, 1)

        avg_attempts = max(1, round(random.gauss(1 + (1 - true_skill) * 4, 0.8), 1))
        avg_snoozes = max(0, round(random.gauss((1 - true_skill) * 3, 0.7), 1))
        avg_response_time = max(5, round(random.gauss(15 + (1 - true_skill) * 60, 15), 1))
        recent_completion_rate = max(0, min(100, round(random.gauss(true_skill * 100, 15), 1)))

        if true_skill < 0.2:
            ideal_difficulty = "beginner"
        elif true_skill < 0.4:
            ideal_difficulty = "easy"
        elif true_skill < 0.65:
            ideal_difficulty = "medium"
        elif true_skill < 0.85:
            ideal_difficulty = "hard"
        else:
            ideal_difficulty = "expert"

        rows.append({
            "avg_attempts": avg_attempts,
            "avg_snoozes": avg_snoozes,
            "avg_response_time": avg_response_time,
            "recent_completion_rate": recent_completion_rate,
            "ideal_difficulty": ideal_difficulty
        })

    return pd.DataFrame(rows)