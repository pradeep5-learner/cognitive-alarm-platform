import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { getAlarms } from "../services/alarmService";

function Dashboard() {
  const { user } = useAuth();
  const [totalAlarms, setTotalAlarms] = useState(0);
  const [activeAlarms, setActiveAlarms] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      const res = await getAlarms();
      setTotalAlarms(res.data.length);
      setActiveAlarms(res.data.filter((a) => a.is_active).length);
    };
    loadStats();
  }, []);

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome, {user?.name} 👋</h1>
          <p className="dashboard-subtitle">Here's your account overview</p>
        </div>

        <div className="card-grid">
          <div className="info-card">
            <div className="info-card-label">Total Alarms</div>
            <div className="info-card-value">{totalAlarms}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">Active Alarms</div>
            <div className="info-card-value">{activeAlarms}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">Role</div>
            <div className="info-card-value">{user?.role}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">Difficulty Preference</div>
            <div className="info-card-value">{user?.difficulty_preference || "Not set"}</div>
          </div>
        </div>

        {user?.role === "admin" && (
          <div className="admin-panel">
            <div className="admin-panel-title">🔐 Admin Panel</div>
            <p className="admin-panel-text">
              You're viewing this because your account role is "admin". Regular users never see this section.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;