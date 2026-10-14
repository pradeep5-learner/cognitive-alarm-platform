const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const SCHEDULE_LABELS = {
  daily: "Every day",
  weekday: "Weekdays",
  weekend: "Weekends",
  one_time: "One time",
  smart_adaptive: "Smart adaptive",
};

// jsDay follows Date.getDay(): 0 = Sunday ... 6 = Saturday
export function ringsOnDay(alarmType, jsDay) {
  if (alarmType === "weekday") return jsDay >= 1 && jsDay <= 5;
  if (alarmType === "weekend") return jsDay === 0 || jsDay === 6;
  return true;
}

export function nextRingLabel(alarm, now = new Date()) {
  if (!alarm.is_active) return "Off";
  const [h, m] = alarm.time.split(":").map(Number);

  for (let offset = 0; offset < 8; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (!ringsOnDay(alarm.alarm_type, day.getDay())) continue;

    const ringAt = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m);
    if (ringAt <= now) continue;

    if (offset === 0) return "Rings today";
    if (offset === 1) return "Rings tomorrow";
    return `Rings ${DAY_NAMES[day.getDay()]}`;
  }
  return "Off";
}