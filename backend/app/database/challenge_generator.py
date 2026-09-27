import random

def generate_math_challenge(difficulty="medium"):
    if difficulty == "beginner":
        a, b = random.randint(1, 5), random.randint(1, 5)
        op = "+"
    elif difficulty == "easy":
        a, b = random.randint(1, 15), random.randint(1, 10)
        op = random.choice(["+", "-"])
    elif difficulty == "medium":
        a, b = random.randint(10, 50), random.randint(1, 20)
        op = random.choice(["+", "-", "*"])
    elif difficulty == "hard":
        a, b = random.randint(20, 80), random.randint(5, 25)
        op = random.choice(["+", "-", "*"])
    else:  # expert
        a, b = random.randint(30, 120), random.randint(8, 30)
        op = random.choice(["+", "-", "*"])

    if op == "+":
        answer = a + b
    elif op == "-":
        answer = a - b
    else:
        answer = a * b

    question = f"What is {a} {op} {b}?"
    return question, str(answer)


RIDDLES_BY_DIFFICULTY = {
    "beginner": [
        ("What has a face and two hands but no arms or legs?", "clock"),
        ("What gets wetter as it dries?", "towel"),
        ("What has a neck but no head?", "bottle"),
    ],
    "easy": [
        ("What has hands but cannot clap?", "clock"),
        ("What has one eye but cannot see?", "needle"),
        ("What comes down but never goes up?", "rain"),
        ("What has legs but doesn't walk?", "table"),
    ],
    "medium": [
        ("I speak without a mouth and hear without ears. What am I?", "echo"),
        ("The more you take, the more you leave behind. What am I?", "footsteps"),
        ("What has keys but no locks, space but no room, and you can enter but not go in?", "keyboard"),
        ("What has many teeth but cannot bite?", "comb"),
        ("What can you catch but not throw?", "cold"),
    ],
    "hard": [
        ("What can travel around the world while staying in a corner?", "stamp"),
        ("What is full of holes but still holds water?", "sponge"),
        ("What runs but never walks, has a mouth but never talks?", "river"),
        ("What has a bed but never sleeps?", "river"),
    ],
    "expert": [
        ("What can you break without touching it?", "promise"),
        ("What goes up but never comes down?", "age"),
        ("What kind of room has no doors or windows?", "mushroom"),
        ("What has words but never speaks?", "book"),
    ],
}

def generate_riddle_challenge(difficulty="medium"):
    bank = RIDDLES_BY_DIFFICULTY.get(difficulty, RIDDLES_BY_DIFFICULTY["medium"])
    return random.choice(bank)


WORD_GAMES_BY_DIFFICULTY = {
    "beginner": [
        ("Unscramble this word: NUS", "sun"),
        ("Unscramble this word: KOWA", "wake"),
        ("Fill in the missing letters: S_ E_P", "sleep"),
    ],
    "easy": [
        ("Unscramble this word: TIGHN", "night"),
        ("Unscramble this word: YRALE", "early"),
        ("Fill in the missing letters: W_ K_ UP", "wake up"),
        ("What word means the opposite of 'asleep'?", "awake"),
    ],
    "medium": [
        ("Unscramble this word: TELAR", "alert"),
        ("Unscramble this word: OCFEEF", "coffee"),
        ("Unscramble this word: MRAAL", "alarm"),
        ("Unscramble this word: MERAD", "dream"),
        ("What is the first meal of the day called?", "breakfast"),
    ],
    "hard": [
        ("Unscramble this word: RNGMIO", "morning"),
        ("Unscramble this word: LOWLIP", "pillow"),
        ("Fill in the missing letters: BR_ AK_ AST", "breakfast"),
        ("Fill in the missing letters: EN_RGY", "energy"),
    ],
    "expert": [
        ("Unscramble this word: TENKALB", "blanket"),
        ("Fill in the missing letters: SN_ OZ_", "snooze"),
    ],
}

def generate_word_game_challenge(difficulty="medium"):
    bank = WORD_GAMES_BY_DIFFICULTY.get(difficulty, WORD_GAMES_BY_DIFFICULTY["medium"])
    return random.choice(bank)


PATTERNS_BY_DIFFICULTY = {
    "beginner": [
        ("What comes next in the sequence: 2, 4, 6, 8, ?", "10"),
        ("What comes next in the sequence: 1, 2, 3, 4, ?", "5"),
        ("What comes next in the sequence: 5, 10, 15, 20, ?", "25"),
    ],
    "easy": [
        ("What comes next in the sequence: 1, 3, 5, 7, ?", "9"),
        ("What comes next in the sequence: 3, 6, 9, 12, ?", "15"),
        ("What comes next in the sequence: 0, 5, 10, 15, ?", "20"),
    ],
    "medium": [
        ("What comes next in the sequence: 1, 2, 4, 8, ?", "16"),
        ("What comes next in the sequence: 100, 90, 80, 70, ?", "60"),
        ("What comes next in the sequence: 7, 14, 21, 28, ?", "35"),
        ("What comes next in the sequence: 4, 8, 12, 16, ?", "20"),
    ],
    "hard": [
        ("What comes next in the sequence: 1, 4, 9, 16, ?", "25"),
        ("What comes next in the sequence: 20, 17, 14, 11, ?", "8"),
        ("What comes next in the sequence: 11, 22, 33, 44, ?", "55"),
    ],
    "expert": [
        ("What comes next in the sequence: 2, 6, 18, 54, ?", "162"),
        ("What comes next in the sequence: 1, 1, 2, 3, 5, ?", "8"),
        ("What comes next in the sequence: 81, 27, 9, 3, ?", "1"),
    ],
}

def generate_pattern_challenge(difficulty="medium"):
    bank = PATTERNS_BY_DIFFICULTY.get(difficulty, PATTERNS_BY_DIFFICULTY["medium"])
    return random.choice(bank)


LOGIC_BY_DIFFICULTY = {
    "beginner": [
        ("If today is Monday, what day will it be in 3 days?", "thursday"),
        ("If you have 3 apples and take away 2, how many do you have?", "2"),
        ("If yesterday was Wednesday, what day is tomorrow?", "friday"),
    ],
    "easy": [
        ("A farmer has 17 sheep, all but 9 run away. How many are left?", "9"),
        ("How many months have 28 days?", "12"),
        ("If there are 6 apples and you take away 4, how many do you have?", "4"),
    ],
    "medium": [
        ("If a red house is made of red bricks and a blue house is made of blue bricks, what is a greenhouse made of?", "glass"),
        ("What is heavier: a kilogram of feathers or a kilogram of steel?", "same"),
        ("What number, when added to itself, gives the same result as when multiplied by itself?", "2"),
    ],
    "hard": [
        ("If it takes 5 machines 5 minutes to make 5 widgets, how many minutes would it take 100 machines to make 100 widgets?", "5"),
        ("A clock shows 3:15. What is the angle between the hour and minute hands closest to?", "0"),
        ("Two fathers and two sons go fishing. They catch 3 fish and share equally. How many does each get?", "1"),
    ],
    "expert": [
        ("If a plane crashes exactly on the border of two countries, where do survivors get buried?", "nowhere"),
        ("A woman had 4 daughters, and each daughter had a brother. How many children did she have?", "5"),
        ("If you multiply this number by any other number, the answer will always remain the same. What number is this?", "0"),
    ],
}

def generate_logic_challenge(difficulty="medium"):
    bank = LOGIC_BY_DIFFICULTY.get(difficulty, LOGIC_BY_DIFFICULTY["medium"])
    return random.choice(bank)


QUIZ_BY_DIFFICULTY = {
    "beginner": [
        ("What is the capital of France?", "paris"),
        ("How many continents are there on Earth?", "7"),
        ("How many hours are there in a day?", "24"),
        ("What organ pumps blood through the body?", "heart"),
    ],
    "easy": [
        ("What planet is known as the Red Planet?", "mars"),
        ("How many colors are in a rainbow?", "7"),
        ("What is the capital of Japan?", "tokyo"),
        ("How many legs does a spider have?", "8"),
    ],
    "medium": [
        ("What is the chemical symbol for water?", "h2o"),
        ("How many days are there in a leap year?", "366"),
        ("What is the largest ocean on Earth?", "pacific"),
        ("What is the capital of India?", "new delhi"),
    ],
    "hard": [
        ("What is the smallest prime number?", "2"),
        ("What gas do plants absorb from the atmosphere?", "carbon dioxide"),
        ("What is the largest planet in our solar system?", "jupiter"),
        ("How many players are on a football (soccer) team?", "11"),
    ],
    "expert": [
        ("What is the freezing point of water in Celsius?", "0"),
        ("What is the tallest mountain in the world?", "everest"),
        ("How many bones are in the adult human body?", "206"),
    ],
}

def generate_quiz_challenge(difficulty="medium"):
    bank = QUIZ_BY_DIFFICULTY.get(difficulty, QUIZ_BY_DIFFICULTY["medium"])
    return random.choice(bank)


def generate_memory_challenge(difficulty="medium"):
    length_map = {"beginner": 3, "easy": 4, "medium": 5, "hard": 6, "expert": 7}
    length = length_map.get(difficulty, 5)
    sequence = [str(random.randint(0, 9)) for _ in range(length)]
    sequence_str = "-".join(sequence)
    question = f"Memorize this sequence, then type it back exactly: {sequence_str}"
    answer = "-".join(sequence)
    return question, answer


def generate_challenge(challenge_type="math", difficulty="medium"):
    if challenge_type == "math":
        return generate_math_challenge(difficulty)
    elif challenge_type == "riddle":
        return generate_riddle_challenge(difficulty)
    elif challenge_type == "logic":
        return generate_logic_challenge(difficulty)
    elif challenge_type == "memory":
        return generate_memory_challenge(difficulty)
    elif challenge_type == "word_game":
        return generate_word_game_challenge(difficulty)
    elif challenge_type == "pattern":
        return generate_pattern_challenge(difficulty)
    elif challenge_type == "quiz":
        return generate_quiz_challenge(difficulty)
    else:
        return generate_math_challenge(difficulty)