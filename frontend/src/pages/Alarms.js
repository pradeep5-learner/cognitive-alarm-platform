import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Lightbulb, Volume2 } from "lucide-react";
import AppLayout from "../components/AppLayout";
import TimePicker12 from "../components/TimePicker12";
import { getAlarms, createAlarm, updateAlarm, deleteAlarm } from "../services/alarmService";
import { getSmartScheduleSuggestion } from "../services/wakeupService";
import { formatTime } from "../utils/formatTime";
import { RINGTONE_OPTIONS, startRinging, stopRinging, isRinging } from "../utils/ringtones";
import { getRingingAlarm } from "../utils/ringingState";
import { SCHEDULE_LABELS, nextRingLabel, nextRingDate, ringsOnDay } from "../utils/alarmSchedule";

const TYPES = [
  ["daily", "Daily"],
  ["weekday", "Weekday"],
  ["weekend", "Weekend"],
  ["one_time", "One-Time"],
  ["smart_adaptive", "Smart Adaptive"],
];
const WEEK = [["M", 1], ["T", 2], ["W", 3], ["T", 4], ["F", 5], ["S", 6], ["S", 0]];
const ALL_TYPES = ["math", "riddle", "logic", "memory", "word_game", "pattern", "quiz"];
const TYPE_LABELS = {
  math: "Math", riddle: "Riddle", logic: "Logic", memory: "Memory",
  word_game: "Word game", pattern: "Pattern", quiz: "Quiz",
};

const describeTypes = (list) =>
  !list || list.length === ALL_TYPES.length ? "All question types" : list.map((t) => TYPE_LABELS[t] || t).join(", ");

function Alarms() {
  const [alarms, setAlarms] = useState([]);
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("06:00");
  const [alarmType, setAlarmType] = useState("daily");
  const [ringtone, setRingtone] = useState("classic");
  const [challengeTypes, setChallengeTypes] = useState(ALL_TYPES);
  const [editingId, setEditingId] = useState(null);
  const [suggestions, setSuggestions] = useState({});

  const checkSuggestion = useCallback(async (alarmId) => {
    try {
      const res = await getSmartScheduleSuggestion(alarmId);
      if (res.data.has_suggestion) {
        setSuggestions((prev) => ({ ...prev, [alarmId]: res.data }));
      }
    } catch (err) {
      // not critical
    }
  }, []);

  const loadAlarms = useCallback(async () => {
    try {
      const res = await getAlarms();
      setAlarms(res.data);
      res.data.forEach((a) => checkSuggestion(a.id));
    } catch (err) {
      toast.error("Could not load alarms");
    }
  }, [checkSuggestion]);

  useEffect(() => {
    loadAlarms();
  }, [loadAlarms]);

  const resetForm = () => {
    setLabel("");
    setTime("06:00");
    setAlarmType("daily");
    setRingtone("classic");
    setChallengeTypes(ALL_TYPES);
    setEditingId(null);
  };

  const toggleType = (t) =>
    setChallengeTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const allSelected = challengeTypes.length === ALL_TYPES.length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (challengeTypes.length === 0) {
      toast.error("Pick at least one question type");
      return;
    }
    try {
      const payload = { label, time: time + ":00", alarm_type: alarmType, ringtone, challenge_types: challengeTypes };
      if (editingId) {
        await updateAlarm(editingId, payload);
        toast.success("Alarm updated!");
      } else {
        await createAlarm(payload);
        toast.success("Alarm created!");
      }
      resetForm();
      loadAlarms();
    } catch (err) {
      toast.error(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || "Something went wrong");
    }
  };

  const handleEdit = (alarm) => {
    setEditingId(alarm.id);
    setLabel(alarm.label);
    setTime(alarm.time.slice(0, 5));
    setAlarmType(alarm.alarm_type);
    setRingtone(alarm.ringtone || "classic");
    setChallengeTypes(alarm.challenge_types?.length ? alarm.challenge_types : ALL_TYPES);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this alarm?")) return;
    try {
      await deleteAlarm(id);
      toast.success("Alarm deleted");
      loadAlarms();
    } catch (err) {
      toast.error("Could not delete alarm");
    }
  };

  const handleToggleActive = async (alarm) => {
    try {
      await updateAlarm(alarm.id, { is_active: !alarm.is_active });
      toast.success(alarm.is_active ? "Alarm turned off" : "Alarm turned on");
      loadAlarms();
    } catch (err) {
      toast.error("Could not update alarm status");
    }
  };

  const acceptSuggestion = async (alarmId, newTime) => {
    try {
      await updateAlarm(alarmId, { time: newTime + ":00" });
      toast.success("Alarm time updated!");
      setSuggestions((prev) => {
        const copy = { ...prev };
        delete copy[alarmId];
        return copy;
      });
      loadAlarms();
    } catch (err) {
      toast.error("Could not update alarm");
    }
  };

  const previewTone = (name) => {
    if (isRinging() || getRingingAlarm()) return;
    startRinging(name);
    setTimeout(() => {
      if (!getRingingAlarm()) stopRinging();
    }, 1800);
  };

  const sorted = [...alarms].sort((a, b) => a.time.localeCompare(b.time));
  const activeCount = alarms.filter((a) => a.is_active).length;
  const upcoming = alarms
    .map((a) => ({ a, at: nextRingDate(a) }))
    .filter((x) => x.at)
    .sort((x, y) => x.at - y.at)[0];

  return (
    <AppLayout>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Your Alarms</h1>
          <p className="dashboard-subtitle">Create and manage your wake-up alarms</p>
        </div>

        <div className="alarm-summary">
          <div className="alarm-summary-item"><span className="alarm-summary-num">{alarms.length}</span> total</div>
          <div className="alarm-summary-item"><span className="alarm-summary-num">{activeCount}</span> active</div>
          <div className="alarm-summary-next">
            {upcoming ? (
              <>Next: <strong>{formatTime(upcoming.a.time)}</strong> · {upcoming.a.label} · {nextRingLabel(upcoming.a)}</>
            ) : (
              "No upcoming alarms"
            )}
          </div>
        </div>

        <form className="alarm-form-card" onSubmit={handleSubmit}>
          <div className="alarm-form-title">{editingId ? "Edit alarm" : "New alarm"}</div>
          <div className="alarm-form-grid">
            <div className="form-group">
              <label className="form-label">Label</label>
              <input className="form-input" type="text" placeholder="e.g. Gym" value={label} onChange={(e) => setLabel(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Time</label>
              <TimePicker12 value={time} onChange={setTime} />
            </div>
            <div className="form-group">
              <label className="form-label">Repeat</label>
              <select className="form-input" value={alarmType} onChange={(e) => setAlarmType(e.target.value)}>
                {TYPES.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Ringtone</label>
              <div className="ringtone-row">
                <select className="form-input" value={ringtone} onChange={(e) => setRingtone(e.target.value)}>
                  {RINGTONE_OPTIONS.map((r) => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
                <button type="button" className="btn-preview" onClick={() => previewTone(ringtone)} title="Preview sound">
                  <Volume2 size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 18, marginBottom: 0 }}>
            <label className="form-label">Question types for this alarm</label>
            <div className="type-chips">
              <button
                type="button"
                className={`type-chip ${allSelected ? "active" : ""}`}
                onClick={() => setChallengeTypes(allSelected ? [] : ALL_TYPES)}
              >
                All types
              </button>
              {ALL_TYPES.map((t) => (
                <button
                  type="button"
                  key={t}
                  className={`type-chip ${challengeTypes.includes(t) ? "active" : ""}`}
                  onClick={() => toggleType(t)}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="alarm-form-actions">
            <button className="btn-primary" type="submit" style={{ width: "auto", padding: "11px 26px", marginTop: 0 }}>
              {editingId ? "Update Alarm" : "Add Alarm"}
            </button>
            {editingId && (
              <button type="button" className="btn-logout" onClick={resetForm}>Cancel</button>
            )}
          </div>
        </form>

        <div className="alarm-list">
          {sorted.length === 0 && <p className="dashboard-subtitle">No alarms yet. Add your first one above.</p>}
          {sorted.map((alarm) => (
            <div className={`alarm-item ${!alarm.is_active ? "alarm-inactive" : ""}`} key={alarm.id}>
              {suggestions[alarm.id] && (
                <div className="smart-suggestion-banner">
                  <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Lightbulb size={15} color="#6C56E8" /> Suggestion: ring at <strong>{formatTime(suggestions[alarm.id].suggested_time)}</strong> instead. {suggestions[alarm.id].reason}
                  </span>
                  <button className="btn-edit" onClick={() => acceptSuggestion(alarm.id, suggestions[alarm.id].suggested_time)}>
                    Accept
                  </button>
                </div>
              )}
              <div className="alarm-item-row">
                <div className="alarm-item-left">
                  <label className="toggle-switch">
                    <input type="checkbox" checked={alarm.is_active} onChange={() => handleToggleActive(alarm)} />
                    <span className="toggle-slider"></span>
                  </label>
                  <div>
                    <div className="alarm-time">{formatTime(alarm.time)}</div>
                    <div className="alarm-meta">
                      {alarm.label} · <span className="alarm-type-badge">{SCHEDULE_LABELS[alarm.alarm_type] || alarm.alarm_type}</span> · {nextRingLabel(alarm)}
                    </div>
                    <div className="week-dots">
                      {WEEK.map(([letter, day], i) => (
                        <span key={i} className={`wd ${ringsOnDay(alarm.alarm_type, day) ? "on" : ""}`}>{letter}</span>
                      ))}
                    </div>
                    <div className="alarm-types-line">{describeTypes(alarm.challenge_types)}</div>
                  </div>
                </div>
                <div className="alarm-actions">
                  <button className="btn-edit" onClick={() => handleEdit(alarm)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(alarm.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default Alarms;