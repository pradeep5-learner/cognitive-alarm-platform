import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { user, login } = useAuth();
  const [form, setForm] = useState({
    preferred_wake_time: "",
    sleep_duration_hours: "",
    timezone: "",
    productivity_goal: "",
    difficulty_preference: "medium",
    habit_preferences: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const res = await api.get("/auth/profile");
      const data = res.data;
      setForm({
        preferred_wake_time: data.preferred_wake_time ? data.preferred_wake_time.slice(0, 5) : "",
        sleep_duration_hours: data.sleep_duration_hours || "",
        timezone: data.timezone || "",
        productivity_goal: data.productivity_goal || "",
        difficulty_preference: data.difficulty_preference || "medium",
        habit_preferences: data.habit_preferences || "",
      });
    };
    loadProfile();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const payload = {
        ...form,
        preferred_wake_time: form.preferred_wake_time ? form.preferred_wake_time + ":00" : null,
        sleep_duration_hours: form.sleep_duration_hours ? parseFloat(form.sleep_duration_hours) : null,
      };
      const res = await api.put("/auth/profile", payload);
      login(res.data, localStorage.getItem("token"));
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Update failed");
    }
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Your Profile ⚙️</h1>
          <p className="dashboard-subtitle">Update your wake-up and habit preferences</p>
        </div>

        {message && <div className="success-box">{message}</div>}
        {error && <div className="error-box">{error}</div>}

        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Preferred Wake-up Time</label>
            <input
              className="form-input"
              type="time"
              name="preferred_wake_time"
              value={form.preferred_wake_time}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sleep Duration (hours)</label>
            <input
              className="form-input"
              type="number"
              step="0.5"
              name="sleep_duration_hours"
              value={form.sleep_duration_hours}
              onChange={handleChange}
              placeholder="e.g. 7.5"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Timezone</label>
            <input
              className="form-input"
              type="text"
              name="timezone"
              value={form.timezone}
              onChange={handleChange}
              placeholder="e.g. Asia/Kolkata"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Productivity Goal</label>
            <input
              className="form-input"
              type="text"
              name="productivity_goal"
              value={form.productivity_goal}
              onChange={handleChange}
              placeholder="e.g. Study 2 hours before college"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Difficulty Preference</label>
            <select
              className="form-input"
              name="difficulty_preference"
              value={form.difficulty_preference}
              onChange={handleChange}
            >
              <option value="beginner">Beginner</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="expert">Expert</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Habit Preferences</label>
            <input
              className="form-input"
              type="text"
              name="habit_preferences"
              value={form.habit_preferences}
              onChange={handleChange}
              placeholder="e.g. no_snooze, early_riser"
            />
          </div>

          <button className="btn-primary" type="submit" style={{ width: "auto", padding: "11px 30px" }}>
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;