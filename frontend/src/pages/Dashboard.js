import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { getAlarms } from "../services/alarmService";
import { getAnalytics } from "../services/wakeupService";

function Dashboard() {
  const { user } = useAuth();
  const [totalAlarms, setTotalAlarms] = useState(0);
  const [activeAlarms, setActiveAlarms] = useState(0);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const alarmsRes = await getAlarms();
      setTotalAlarms(alarmsRes.data.length);
      setActiveAlarms(alarmsRes.data.filter((a) => a.is_active).length);

      try {
        const analyticsRes = await getAnalytics();
        setAnalytics(analyticsRes.data);
      } catch (err) {
        setAnalytics(null);
      }
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

        {analytics && analytics.total_sessions > 0 && (
          <>
            <h2 className="section-heading">Wake-Up Performance</h2>
            <div className="card-grid">
              <div className="info-card">
                <div className="info-card-label">Completion Rate</div>
                <div className="info-card-value">{analytics.completion_rate}%</div>
              </div>
              <div className="info-card">
                <div className="info-card-label">First-Try Accuracy</div>
                <div className="info-card-value">{analytics.first_try_accuracy}%</div>
              </div>
              <div className="info-card">
                <div className="info-card-label">Avg. Attempts</div>
                <div className="info-card-value">{analytics.average_attempts}</div>
              </div>
              <div className="info-card">
                <div className="info-card-label">Total Snoozes</div>
                <div className="info-card-value">{analytics.total_snoozes}</div>
              </div>
            </div>
          </>
        )}

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