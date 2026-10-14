const KEY = "ringing_alarm";

export function setRingingAlarm(id, ringtone) {
  sessionStorage.setItem(KEY, JSON.stringify({ id, ringtone }));
}

export function getRingingAlarm() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY));
  } catch (err) {
    return null;
  }
}

export function clearRingingAlarm() {
  sessionStorage.removeItem(KEY);
}