import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { Megaphone, FileText, FileSpreadsheet } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import {
  getAllUsers, updateUserRole, getPlatformStats, assignCoach, getRecommendationMonitor,
} from "../services/adminService";
import { createAnnouncement } from "../services/notificationService";
import { downloadSystemPdfReport, downloadSystemExcelReport } from "../services/reportService";
import { triggerDownload } from "../utils/downloadFile";

function Admin() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monitor, setMonitor] = useState(null);
  const [monitorLoading, setMonitorLoading] = useState(true);
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [usersRes, statsRes] = await Promise.all([getAllUsers(), getPlatformStats()]);
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      toast.error("Could not load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const loadMonitor = async () => {
      try {
        const res = await getRecommendationMonitor();
        setMonitor(res.data);
      } catch (err) {
        toast.error("Could not load recommendation monitoring");
      } finally {
        setMonitorLoading(false);
      }
    };
    loadMonitor();
  }, []);

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

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await createAnnouncement(announceTitle, announceMessage);
      toast.success("Announcement sent to all users");
      setAnnounceTitle("");
      setAnnounceMessage("");
    } catch (err) {
      toast.error("Could not send announcement");
    } finally {
      setSending(false);
    }
  };

  const handleReport = async (fetcher, filename) => {
    try {
      const res = await fetcher();
      triggerDownload(res.data, filename);
      toast.success("Report downloaded");
    } catch (err) {
      toast.error("Could not download report");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="dashboard-content"><p>Loading admin panel...</p></div>
      </AppLayout>
    );
  }

  const coaches = users.filter((u) => u.role === "wellness_coach");

  return (
    <AppLayout>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Admin Panel</h1>
          <p className="dashboard-subtitle">Platform-wide management, monitoring and reports</p>
        </div>

        {stats && (
          <div className="card-grid">
            <div className="info-card"><div className="info-card-label">Total Users</div><div className="info-card-value">{stats.total_users}</div></div>
            <div className="info-card"><div className="info-card-label">Total Alarms</div><div className="info-card-value">{stats.total_alarms}</div></div>
            <div className="info-card"><div className="info-card-label">Active Alarms</div><div className="info-card-value">{stats.active_alarms}</div></div>
            <div className="info-card"><div className="info-card-label">Platform Completion Rate</div><div className="info-card-value">{stats.platform_completion_rate}%</div></div>
            <div className="info-card"><div className="info-card-label">Avg. Habit Score</div><div className="info-card-value">{stats.avg_habit_score}</div></div>
          </div>
        )}

        <div className="report-download-bar" style={{ marginTop: 22 }}>
          <span className="report-download-label">System report: platform stats, activity, challenges, recommendations and every account</span>
          <div className="report-download-buttons">
            <button className="btn-report" onClick={() => handleReport(downloadSystemPdfReport, "system_report.pdf")}>
              <FileText size={15} /> PDF
            </button>
            <button className="btn-report" onClick={() => handleReport(downloadSystemExcelReport, "system_report.xlsx")}>
              <FileSpreadsheet size={15} /> Excel
            </button>
          </div>
        </div>

        <h2 className="section-heading">Send Platform Announcement</h2>
        <form className="alarm-form" onSubmit={handleSendAnnouncement} style={{ marginBottom: 28 }}>
          <input
            className="form-input"
            type="text"
            placeholder="Announcement title"
            value={announceTitle}
            onChange={(e) => setAnnounceTitle(e.target.value)}
            required
            style={{ flex: "0 0 240px" }}
          />
          <input
            className="form-input"
            type="text"
            placeholder="Message"
            value={announceMessage}
            onChange={(e) => setAnnounceMessage(e.target.value)}
            required
          />
          <button className="btn-primary" type="submit" disabled={sending} style={{ width: "auto", padding: "11px 22px", display: "flex", alignItems: "center", gap: 7 }}>
            <Megaphone size={15} /> {sending ? "Sending..." : "Send to All Users"}
          </button>
        </form>

        {stats && (
          <>
            <h2 className="section-heading">Difficulty Distribution</h2>
            <div className="chart-card">
              <div className="diff-dist-row">
                {Object.entries(stats.difficulty_distribution).map(([level, count]) => (
                  <div className="diff-dist-bar" key={level}>
                    <div className="diff-dist-count">{count}</div>
                    <div className="diff-dist-fill" style={{ height: `${Math.max(6, (count / Math.max(1, stats.total_users)) * 100)}px` }} />
                    <div className="diff-dist-label">{level}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <h2 className="section-heading">Recommendation monitoring</h2>
        {monitorLoading && <p className="insight-note">Analyzing recommendations for every user...</p>}
        {monitor && (
          <>
            <div className="card-grid">
              <div className="info-card"><div className="info-card-label">Users analyzed</div><div className="info-card-value">{monitor.users_analyzed}</div></div>
              <div className="info-card"><div className="info-card-label">Recommendations generated</div><div className="info-card-value">{monitor.total_recommendations}</div></div>
              <div className="info-card"><div className="info-card-label">High priority</div><div className="info-card-value">{monitor.by_priority.high}</div></div>
              <div className="info-card"><div className="info-card-label">Medium priority</div><div className="info-card-value">{monitor.by_priority.medium}</div></div>
              <div className="info-card"><div className="info-card-label">Low priority</div><div className="info-card-value">{monitor.by_priority.low}</div></div>
            </div>

            <div className="monitor-split">
              <div className="chart-card">
                <h3 className="chart-title">By category</h3>
                {monitor.by_category.map((c) => (
                  <div className="habit-score-bar-row" key={c.category} style={{ marginBottom: 10 }}>
                    <span style={{ textTransform: "capitalize" }}>{c.category.replace("_", " ")}</span>
                    <div className="habit-score-bar-track">
                      <div className="habit-score-bar-fill" style={{ width: `${(c.count / Math.max(1, monitor.total_recommendations)) * 100}%` }} />
                    </div>
                    <span>{c.count}</span>
                  </div>
                ))}
              </div>
              <div className="chart-card">
                <h3 className="chart-title">Most common recommendations</h3>
                {monitor.top_recommendations.map((r) => (
                  <div className="monitor-top-row" key={r.title}>
                    <span>{r.title}</span>
                    <strong>{r.count}</strong>
                  </div>
                ))}
              </div>
            </div>

            <h3 className="chart-title" style={{ margin: "6px 0 10px" }}>Users needing attention first</h3>
            <div className="session-table">
              <div className="monitor-row session-head">
                <div>User</div><div>Email</div><div>Priority</div><div>Count</div><div>Recommendations</div>
              </div>
              {monitor.users.length === 0 && <div className="monitor-row"><div>No users yet.</div></div>}
              {monitor.users.map((u) => (
                <div className="monitor-row" key={u.user_id}>
                  <div>{u.name}</div>
                  <div className="admin-table-email">{u.email}</div>
                  <div><span className={`prio-pill prio-${u.top_priority}`}>{u.top_priority}</span></div>
                  <div>{u.count}</div>
                  <div className="monitor-titles">{u.titles.join(" · ")}</div>
                </div>
              ))}
            </div>
            {monitor.skipped_users > 0 && (
              <p className="insight-note">{monitor.skipped_users} user(s) were skipped because their data could not be analyzed.</p>
            )}
          </>
        )}

        <h2 className="section-heading">All Users</h2>
        <div className="admin-table">
          <div className="admin-table-header">
            <div>Name</div><div>Email</div><div>Role</div><div>Coach</div>
          </div>
          {users.map((u) => (
            <div className="admin-table-row" key={u.id}>
              <div>{u.name}</div>
              <div className="admin-table-email">{u.email}</div>
              <div>
                {u.id === currentUser?.id ? (
                  <span className="role-badge">{u.role} (you)</span>
                ) : (
                  <select className="form-input admin-role-select" value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                    <option value="user">User</option>
                    <option value="wellness_coach">Wellness Coach</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>
              <div>
                {u.role === "wellness_coach" || u.id === currentUser?.id ? (
                  <span style={{ color: "var(--mist)", fontSize: 13 }}>—</span>
                ) : (
                  <select className="form-input admin-role-select" value={u.coach_id || ""} onChange={(e) => handleAssignCoach(u.id, e.target.value)}>
                    <option value="">No coach</option>
                    {coaches.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default Admin;