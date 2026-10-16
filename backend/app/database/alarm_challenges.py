ALL_TYPES = ["math", "riddle", "logic", "memory", "word_game", "pattern", "quiz"]


def encode_challenge_types(types):
    cleaned = [t for t in dict.fromkeys(types or []) if t in ALL_TYPES]
    if not cleaned or len(cleaned) == len(ALL_TYPES):
        return "all"
    return ",".join(cleaned)


def decode_challenge_types(value):
    if not value or value == "all":
        return list(ALL_TYPES)
    selected = [t for t in value.split(",") if t in ALL_TYPES]
    return selected or list(ALL_TYPES)