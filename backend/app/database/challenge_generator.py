import random

def generate_math_challenge(difficulty="medium"):
    if difficulty in ["beginner", "easy"]:
        a, b = random.randint(1, 10), random.randint(1, 10)
        op = random.choice(["+", "-"])
    elif difficulty == "medium":
        a, b = random.randint(10, 50), random.randint(1, 20)
        op = random.choice(["+", "-", "*"])
    else:  # hard, expert
        a, b = random.randint(20, 100), random.randint(2, 15)
        op = random.choice(["+", "-", "*"])

    if op == "+":
        answer = a + b
    elif op == "-":
        answer = a - b
    else:
        answer = a * b

    question = f"What is {a} {op} {b}?"
    return question, str(answer)

RIDDLES = [
    ("I speak without a mouth and hear without ears. What am I?", "echo"),
    ("The more you take, the more you leave behind. What am I?", "footsteps"),
    ("What has hands but cannot clap?", "clock"),
    ("What has a face and two hands but no arms or legs?", "clock"),
    ("What gets wetter as it dries?", "towel"),
]

LOGIC_PUZZLES = [
    ("If today is Monday, what day will it be in 3 days?", "thursday"),
    ("A farmer has 17 sheep, all but 9 run away. How many are left?", "9"),
    ("If a red house is made of red bricks and a blue house is made of blue bricks, what is a greenhouse made of?", "glass"),
    ("How many months have 28 days?", "12"),
]

def generate_riddle_challenge():
    question, answer = random.choice(RIDDLES)
    return question, answer

def generate_logic_challenge():
    question, answer = random.choice(LOGIC_PUZZLES)
    return question, answer

def generate_challenge(challenge_type="math", difficulty="medium"):
    if challenge_type == "math":
        return generate_math_challenge(difficulty)
    elif challenge_type == "riddle":
        return generate_riddle_challenge()
    elif challenge_type == "logic":
        return generate_logic_challenge()
    else:
        return generate_math_challenge(difficulty)