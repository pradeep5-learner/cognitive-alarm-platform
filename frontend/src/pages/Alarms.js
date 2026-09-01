import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getAlarms, createAlarm, updateAlarm, deleteAlarm } from "../services/alarmService";

function Alarms() {
  const [alarms, setAlarms] = useState([]);
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const [alarmType, setAlarmType] = useState("daily");
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const loadAlarms = async () => {
    try {
      const res = await getAlarms();
      setAlarms(res.data);
    } catch (err) {
      setError("Could not load alarms");
    }
  };

  useEffect(() => {
    loadAlarms();
  }, []);

  const resetForm = () => {
    setLabel("");
    setTime("");
    setAlarmType("daily");
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { label, time: time + ":00", alarm_type: alarmType };
      if (editingId) {
        await updateAlarm(editingId, payload);
      } else {
        await createAlarm(payload);
      }
      resetForm();
      loadAlarms();
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
  };

  const handleEdit = (alarm) => {
    setEditingId(alarm.id);
    setLabel(alarm.label);
    setTime(alarm.time.slice(0, 5));
    setAlarmType(alarm.alarm_type);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this alarm?")) return;
    await deleteAlarm(id);
    loadAlarms();
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Your Alarms ⏰</h1>
          <p className="dashboard-subtitle">Create and manage your wake-up alarms</p>
        </div>

        <form className="alarm-form" onSubmit={handleSubmit}>
          <input
            className="form-input"
            type="text"
            placeholder="Label (e.g. Gym)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
          <input
            className="form-input"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
          <select
            className="form-input"
            value={alarmType}
            onChange={(e) => setAlarmType(e.target.value)}
          >
            <option value="daily">Daily</option>
            <option value="weekday">Weekday</option>
            <option value="weekend">Weekend</option>
            <option value="one_time">One-Time</option>
            <option value="smart_adaptive">Smart Adaptive</option>
          </select>
          <button className="btn-primary" type="submit" style={{ width: "auto", padding: "11px 22px" }}>
            {editingId ? "Update Alarm" : "Add Alarm"}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn-logout"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </form>

        {error && <div className="error-box">{error}</div>}

        <div className="alarm-list">
          {alarms.length === 0 && (
            <p className="dashboard-subtitle">No alarms yet — add your first one above.</p>
          )}
          {alarms.map((alarm) => (
            <div className="alarm-item" key={alarm.id}>
              <div>
                <div className="alarm-time">{alarm.time.slice(0, 5)}</div>
                <div className="alarm-meta">
                  {alarm.label} · <span className="alarm-type-badge">{alarm.alarm_type}</span>
                </div>
              </div>
              <div className="alarm-actions">
                <button className="btn-edit" onClick={() => handleEdit(alarm)}>Edit</button>
                <button className="btn-delete" onClick={() => handleDelete(alarm.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Alarms;