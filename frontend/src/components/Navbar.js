import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">⏰ Cognitive Alarm</div>
      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/alarms">Alarms</Link>
        <Link to="/profile">Profile</Link>
      </div>
      <div className="navbar-right">
        <span className="navbar-user">
          {user?.name} <span className="role-badge">{user?.role}</span>
        </span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;