import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { TrendingUp, TrendingDown, Minus, ChevronRight } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { getMyAssignedUsers } from "../services/coachService";

function CoachDashboard() {
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <AppLayout>
        <div className="dashboard-content"><p>Loading your users...</p></div>
      </AppLayout>
    );
  }

  const open = (id) => navigate(`/coach-dashboard/users/${id}`);

  return (
    <AppLayout>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">My Users</h1>
          <p className="dashboard-subtitle">Track the wake-up habits of the people assigned to you</p>
        </div>

        {users.length === 0 ? (
          <div className="info-card">
            <p style={{ margin: 0, color: "var(--mist)" }}>
              No users assigned to you yet. Ask an admin to assign users from the Admin page.
            </p>
          </div>
        ) : (
          <div className="coach-grid">
            {users.map((u) => (
              <div
                className="coach-user-card"
                key={u.id}
                role="button"
                tabIndex={0}
                onClick={() => open(u.id)}
                onKeyDown={(e) => e.key === "Enter" && open(u.id)}
              >
                <div className="coach-user-header">
                  <div className="coach-user-name">{u.name}</div>
                  <div className="coach-user-email">{u.email}</div>
                </div>
                <div className="coach-user-stats">
                  <div className="coach-stat">
                    <div className="coach-stat-label">Habit Score</div>
                    <div className="coach-stat-value" style={{ color: u.habit_score >= 60 ? "#2F9E8F" : u.habit_score >= 35 ? "#D97706" : "#DC2626" }}>
                      {Math.round(u.habit_score)}
                    </div>
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
                  {u.trend !== "insufficient_data" && (
                    <span className={`coach-trend coach-trend-${u.trend}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {u.trend === "improving" ? <TrendingUp size={12} /> : u.trend === "declining" ? <TrendingDown size={12} /> : <Minus size={12} />}
                      {u.trend === "improving" ? "Improving" : u.trend === "declining" ? "Declining" : "Stable"}
                    </span>
                  )}
                </div>
                <div className="coach-card-cta">
                  View full details <ChevronRight size={15} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default CoachDashboard;