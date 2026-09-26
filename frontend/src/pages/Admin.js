import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, updateUserRole, getPlatformStats, assignCoach } from "../services/adminService";

function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, statsRes] = await Promise.all([getAllUsers(), getPlatformStats()]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error("Could not load admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (currentUser && currentUser.role !== "admin") {
  return <Navigate to="/dashboard" />;
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success("Role updated");
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not update role");
    }
  };

  const handleAssignCoach = async (userId, coachId) => {
  if (!coachId) return;
  try {
    await assignCoach(userId, parseInt(coachId));
    toast.success("Coach assigned");
    loadData();
  } catch (err) {
    toast.error(err.response?.data?.detail || "Could not assign coach");
  }
};

  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-content"><p>Loading admin panel...</p></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Admin Panel 🔐</h1>
          <p className="dashboard-subtitle">Platform-wide management and stats</p>
        </div>

        {stats && (
          <div className="card-grid">
            <div className="info-card">
              <div className="info-card-label">Total Users</div>
              <div className="info-card-value">{stats.total_users}</div>
            </div>
            <div className="info-card">
              <div className="info-card-label">Total Alarms</div>
              <div className="info-card-value">{stats.total_alarms}</div>
            </div>
            <div className="info-card">
              <div className="info-card-label">Active Alarms</div>
              <div className="info-card-value">{stats.active_alarms}</div>
            </div>
            <div className="info-card">
              <div className="info-card-label">Platform Completion Rate</div>
              <div className="info-card-value">{stats.platform_completion_rate}%</div>
            </div>
          </div>
        )}

        <h2 className="section-heading">All Users</h2>
        <div className="admin-table">
          <div className="admin-table-header">
            <div>Name</div>
            <div>Email</div>
            <div>Role</div>
            <div>Coach</div>
          </div>
          {users.map((u) => (
            <div className="admin-table-row" key={u.id}>
              <div>{u.name}</div>
              <div className="admin-table-email">{u.email}</div>
              <div>
                {u.id === currentUser?.id ? (
                  <span className="role-badge">{u.role} (you)</span>
                ) : (
                  <select
                    className="form-input admin-role-select"
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="wellness_coach">Wellness Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>
              <div>
        {u.role === "wellness_coach" || u.id === currentUser?.id ? (
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
        ) : (
          <select
            className="form-input admin-role-select"
            value={u.coach_id || ""}
            onChange={(e) => handleAssignCoach(u.id, e.target.value)}
          >
            <option value="">No coach</option>
            {users.filter((coach) => coach.role === "wellness_coach").map((coach) => (
              <option key={coach.id} value={coach.id}>{coach.name}</option>
            ))}
          </select>
        )}
      </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Admin;