import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

function Dashboard() {
  const { user } = useAuth();

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
            <div className="info-card-label">Email</div>
            <div className="info-card-value" style={{ fontSize: 15 }}>{user?.email}</div>
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