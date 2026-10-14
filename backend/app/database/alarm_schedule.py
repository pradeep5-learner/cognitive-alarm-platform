def rings_on_weekday(alarm_type, weekday):
    """weekday uses Python numbering: Monday = 0 ... Sunday = 6."""
    if alarm_type == "weekday":
        return weekday <= 4
    if alarm_type == "weekend":
        return weekday >= 5
    return True  # daily, one_time, smart_adaptive, and anything unexpected