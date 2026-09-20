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
    elif challenge_type == "memory":
        return generate_memory_challenge()
    elif challenge_type == "word_game":
        return generate_word_game_challenge()
    elif challenge_type == "pattern":
        return generate_pattern_challenge()
    elif challenge_type == "quiz":
        return generate_quiz_challenge()
    else:
        return generate_math_challenge(difficulty)

def generate_memory_challenge():
    length = random.choice([4, 5, 6])
    sequence = [str(random.randint(0, 9)) for _ in range(length)]
    sequence_str = "-".join(sequence)
    question = f"Memorize this sequence, then type it back exactly: {sequence_str}"
    answer = "-".join(sequence)
    return question, answer


WORD_GAMES = [
    ("Unscramble this word: TELAR", "alert"),
    ("Unscramble this word: OCFEEF", "coffee"),
    ("Unscramble this word: RNGMIO", "morning"),
    ("Fill in the missing letters: S_ E_P", "sleep"),
    ("Fill in the missing letters: W_ K_ UP", "wake up"),
]

def generate_word_game_challenge():
    question, answer = random.choice(WORD_GAMES)
    return question, answer


PATTERNS = [
    ("What comes next in the sequence: 2, 4, 6, 8, ?", "10"),
    ("What comes next in the sequence: 1, 3, 5, 7, ?", "9"),
    ("What comes next in the sequence: 5, 10, 15, 20, ?", "25"),
    ("What comes next in the sequence: 1, 2, 4, 8, ?", "16"),
    ("What comes next in the sequence: 3, 6, 9, 12, ?", "15"),
]

def generate_pattern_challenge():
    question, answer = random.choice(PATTERNS)
    return question, answer


QUIZ_QUESTIONS = [
    ("What is the capital of France?", "paris"),
    ("How many continents are there on Earth?", "7"),
    ("What planet is known as the Red Planet?", "mars"),
    ("What is the chemical symbol for water?", "h2o"),
    ("How many days are there in a leap year?", "366"),
]

def generate_quiz_challenge():
    question, answer = random.choice(QUIZ_QUESTIONS)
    return question, answer