import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getMyAssignedUsers } from "../services/coachService";

function CoachDashboard() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await getMyAssignedUsers();
        setUsers(res.data);
      } catch (err) {
        toast.error("Could not load your assigned users");
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  if (currentUser && currentUser.role !== "wellness_coach") {
    return <Navigate to="/dashboard" />;
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-content"><p>Loading your users...</p></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Coach Dashboard 🧑‍⚕️</h1>
          <p className="dashboard-subtitle">Track your assigned users' wake-up habits</p>
        </div>

        {users.length === 0 ? (
          <div className="info-card">
            <p style={{ margin: 0, color: "var(--text-muted)" }}>
              No users assigned to you yet. Ask an admin to assign users from the Admin Dashboard.
            </p>
          </div>
        ) : (
          <div className="coach-grid">
            {users.map((u) => (
              <div className="coach-user-card" key={u.id}>
                <div className="coach-user-header">
                  <div className="coach-user-name">{u.name}</div>
                  <div className="coach-user-email">{u.email}</div>
                </div>
                <div className="coach-user-stats">
                  <div className="coach-stat">
                    <div className="coach-stat-label">Alarms</div>
                    <div className="coach-stat-value">{u.total_alarms}</div>
                  </div>
                  <div className="coach-stat">
                    <div className="coach-stat-label">Sessions</div>
                    <div className="coach-stat-value">{u.total_wakeup_sessions}</div>
                  </div>
                  <div className="coach-stat">
                    <div className="coach-stat-label">Completion</div>
                    <div className="coach-stat-value">{u.completion_rate}%</div>
                  </div>
                </div>
                <div className="coach-user-difficulty">
                  Difficulty: <strong>{u.difficulty_preference || "Not set"}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CoachDashboard;