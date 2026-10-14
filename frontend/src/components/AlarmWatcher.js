import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getAlarms } from "../services/alarmService";
import { startRinging } from "../utils/ringtones";
import { ringsOnDay } from "../utils/alarmSchedule";
import { getRingingAlarm, setRingingAlarm } from "../utils/ringingState";

function AlarmWatcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const firedRef = useRef(new Set());
  const locationRef = useRef(location);

  useEffect(() => {
    locationRef.current = location;
    const ringing = getRingingAlarm();
    if (ringing && localStorage.getItem("token") && !location.pathname.startsWith("/alarm-ring")) {
      navigate(`/alarm-ring/${ringing.id}`, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const checkAlarms = async () => {
      if (!localStorage.getItem("token")) return;
      if (getRingingAlarm()) return;

      try {
        const res = await getAlarms();
        const now = new Date();
        const currentKey = `${now.getHours()}:${now.getMinutes()}`;

        for (const alarm of res.data) {
          if (!alarm.is_active) continue;
          if (!ringsOnDay(alarm.alarm_type, now.getDay())) continue;

          const [h, m] = alarm.time.split(":").map(Number);
          if (h === now.getHours() && m === now.getMinutes()) {
            const fireKey = `${alarm.id}_${currentKey}`;
            if (firedRef.current.has(fireKey)) continue;
            if (locationRef.current.pathname.startsWith("/alarm-ring")) continue;

            firedRef.current.add(fireKey);
            const ringtone = alarm.ringtone || "classic";
            startRinging(ringtone);
            setRingingAlarm(alarm.id, ringtone);
            navigate(`/alarm-ring/${alarm.id}`);
            break;
          }
        }
      } catch (err) {
        // silent, a failed check should never disturb the app
      }
    };

    checkAlarms();
    const interval = setInterval(checkAlarms, 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

export default AlarmWatcher;