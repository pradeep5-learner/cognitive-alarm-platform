import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  alarms: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2" /><path d="M5 3 2 6M19 3l3 3" />
    </svg>
  ),
  insights: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" /><path d="M7 15l4-5 3 3 5-7" />
    </svg>
  ),
  profile: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  ),
  coach: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="3.2" /><path d="M2.5 19c0-3.6 2.9-5.8 6.5-5.8s6.5 2.2 6.5 5.8" /><circle cx="18" cy="7" r="2.3" /><path d="M15.8 13.6c2.6.3 4.2 2.1 4.2 5.4" />
    </svg>
  ),
  admin: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6z" />
    </svg>
  ),
  logout: (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
    </svg>
  ),
};

function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { to: "/alarms", label: "Alarms", icon: "alarms" },
    { to: "/insights", label: "Insights", icon: "insights" },
    { to: "/profile", label: "Profile", icon: "profile" },
  ];
  if (user?.role === "wellness_coach") links.push({ to: "/coach-dashboard", label: "My Users", icon: "coach" });
  if (user?.role === "admin") links.push({ to: "/admin", label: "Admin", icon: "admin" });

  const initials = (user?.name || "?").trim().split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark" />
        <span className="font-display">Dawn</span>
      </div>

      <div className="sidebar-nav">
        {links.map((l) => (
          <Link key={l.to} to={l.to} className={`sidebar-link ${location.pathname === l.to ? "active" : ""}`}>
            {icons[l.icon]}
            <span className="link-label">{l.label}</span>
          </Link>
        ))}
      </div>

      <div className="sidebar-footer">
  <NotificationBell />
  <div className="sidebar-user">
          <span className="sidebar-avatar">{initials}</span>
          <span className="sidebar-user-info link-label">
            <span className="sidebar-user-name">{user?.name}</span>
            <span className="sidebar-user-role">{user?.role}</span>
          </span>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Log out">
          {icons.logout}
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;