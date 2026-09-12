import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getAlarms, createAlarm, updateAlarm, deleteAlarm } from "../services/alarmService";
import { formatTime } from "../utils/formatTime";
import { toast } from "react-toastify";

function Alarms() {
  const [alarms, setAlarms] = useState([]);
  const [label, setLabel] = useState("");
  const [time, setTime] = useState("");
  const [alarmType, setAlarmType] = useState("daily");
  const [editingId, setEditingId] = useState(null);

  const loadAlarms = async () => {
  try {
    const res = await getAlarms();
    setAlarms(res.data);
  } catch (err) {
    toast.error("Could not load alarms");
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
  try {
    const payload = { label, time: time + ":00", alarm_type: alarmType };
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
    toast.error(err.response?.data?.detail || "Something went wrong");
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


        <div className="alarm-list">
          {alarms.length === 0 && (
            <p className="dashboard-subtitle">No alarms yet — add your first one above.</p>
          )}
          {alarms.map((alarm) => (
  <div className={`alarm-item ${!alarm.is_active ? "alarm-inactive" : ""}`} key={alarm.id}>
    <div className="alarm-item-left">
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={alarm.is_active}
          onChange={() => handleToggleActive(alarm)}
        />
        <span className="toggle-slider"></span>
      </label>
      <div>
        <div className="alarm-time">{formatTime(alarm.time)}</div>
        <div className="alarm-meta">
          {alarm.label} · <span className="alarm-type-badge">{alarm.alarm_type}</span>
        </div>
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