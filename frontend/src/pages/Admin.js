import { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Megaphone, FileText, FileSpreadsheet, Download } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { getAdminOverview, updateUserRole, assignCoach, getRecommendationMonitor } from "../services/adminService";
import { createAnnouncement } from "../services/notificationService";
import { downloadSystemPdfReport, downloadSystemExcelReport } from "../services/reportService";
import { triggerDownload } from "../utils/downloadFile";

const PALETTE = ["#6C56E8", "#FF6F5E", "#FFB648", "#2F9E8F", "#9B6FE8"];
const TABS = [
  ["overview", "Overview"],
  ["users", "Users"],
  ["recommendations", "Recommendations"],
  ["tools", "Announcements & reports"],
];
const SYSTEM_REPORTS = [
  { key: "pdf", title: "System report (PDF)", icon: FileText, tint: "#FF6F5E", file: "system_report.pdf", fetcher: downloadSystemPdfReport,
    desc: "Platform overview, activity, challenge usage, recommendation monitoring and every account." },
  { key: "excel", title: "System report (Excel)", icon: FileSpreadsheet, tint: "#FFB648", file: "system_report.xlsx", fetcher: downloadSystemExcelReport,
    desc: "The same platform data as workbook sheets: users, activity, challenges and recommendations." },
];

const hourLabel = (h) => `${h % 12 || 12}${h >= 12 ? "PM" : "AM"}`;
const when = (iso) =>
  iso ? new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }) : "Never";
const scoreClass = (s) => (s >= 60 ? "score-good" : s >= 35 ? "score-mid" : "score-low");

function ChartCard({ title, note, wide, children }) {
  return (
    <div className={`chart-card ${wide ? "span-2" : ""}`}>
      <h3 className="chart-title">{title}</h3>
      {note && <p className="insight-note" style={{ marginTop: -4 }}>{note}</p>}
      {children}
    </div>
  );
}

function SimpleBar({ data, xKey, bars, height = 220, interval = 0 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} interval={interval} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={34} />
        <Tooltip cursor={{ fill: "rgba(108,86,232,0.06)" }} />
        {bars.length > 1 && <Legend />}
        {bars.map((b) => (
          <Bar key={b.key} dataKey={b.key} name={b.name} fill={b.color} radius={[5, 5, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

function Admin() {
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [monitor, setMonitor] = useState(null);
  const [monitorState, setMonitorState] = useState("idle");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceMessage, setAnnounceMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [busyKey, setBusyKey] = useState("");

  const loadOverview = useCallback(async () => {
    try {
      const res = await getAdminOverview();
      setOverview(res.data);
    } catch (err) {
      toast.error("Could not load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (tab !== "recommendations" || monitorState !== "idle") return;
    setMonitorState("loading");
    getRecommendationMonitor()
      .then((res) => {
        setMonitor(res.data);
        setMonitorState("done");
      })
      .catch(() => {
        toast.error("Could not load recommendation monitoring");
        setMonitorState("error");
      });
  }, [tab, monitorState]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success("Role updated");
      loadOverview();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not update role");
    }
  };

  const handleAssignCoach = async (userId, coachId) => {
    if (!coachId) return;
    try {
      await assignCoach(userId, parseInt(coachId));
      toast.success("Coach assigned");
      loadOverview();
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

  const handleReport = async (report) => {
    setBusyKey(report.key);
    try {
      const res = await report.fetcher();
      triggerDownload(res.data, report.file);
      toast.success("Report downloaded");
    } catch (err) {
      toast.error("Could not download report");
    } finally {
      setBusyKey("");
    }
  };

  if (loading || !overview) {
    return (
      <AppLayout>
        <div className="dashboard-content"><p>Loading admin panel...</p></div>
      </AppLayout>
    );
  }

  const o = overview;
  const s = o.summary;
  const coaches = o.users.filter((u) => u.role === "wellness_coach");
  const query = search.trim().toLowerCase();
  const filteredUsers = o.users.filter((u) => {
    const matches = !query || u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
    return matches && (roleFilter === "all" || u.role === roleFilter);
  });

  return (
    <AppLayout>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Admin Panel</h1>
          <p className="dashboard-subtitle">Platform-wide analytics, user management and reports</p>
        </div>

        <div className="tabs">
          {TABS.map(([key, text]) => (
            <button key={key} className={`tab-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{text}</button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="tab-panel">
            <div className="card-grid">
              <div className="info-card"><div className="info-card-label">Accounts</div><div className="info-card-value">{s.total_users}</div></div>
              <div className="info-card"><div className="info-card-label">Alarms (active / total)</div><div className="info-card-value">{s.active_alarms} / {s.total_alarms}</div></div>
              <div className="info-card"><div className="info-card-label">Wake-up sessions</div><div className="info-card-value">{s.total_sessions}</div></div>
              <div className="info-card"><div className="info-card-label">Completion rate</div><div className="info-card-value">{s.completion_rate}%</div></div>
              <div className="info-card"><div className="info-card-label">Avg. habit score</div><div className="info-card-value">{s.avg_habit_score}</div></div>
            </div>

            <div className="admin-chart-grid">
              <ChartCard wide title="Platform activity" note="Sessions started, completed, and distinct active users over the last 14 days">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={o.activity.map((a) => ({ ...a, label: a.date.slice(5) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={34} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#6C56E8" strokeWidth={2.5} dot={{ r: 2.5 }} />
                    <Line type="monotone" dataKey="completed" name="Completed" stroke="#2F9E8F" strokeWidth={2.5} dot={{ r: 2.5 }} />
                    <Line type="monotone" dataKey="active_users" name="Active users" stroke="#FF6F5E" strokeWidth={2.5} dot={{ r: 2.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Accounts by role">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={o.roles} dataKey="value" nameKey="name" innerRadius={54} outerRadius={84} paddingAngle={3}>
                      {o.roles.map((r, i) => <Cell key={r.name} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="New sign-ups" note="Last 14 days">
                <SimpleBar data={o.signups.map((x) => ({ ...x, label: x.date.slice(5) }))} xKey="label" bars={[{ key: "count", name: "Sign-ups", color: "#6C56E8" }]} interval={1} />
              </ChartCard>

              <ChartCard title="Habit score distribution" note="How many users fall into each score band">
                <SimpleBar data={o.habit_distribution} xKey="range" bars={[{ key: "users", name: "Users", color: "#6C56E8" }]} />
              </ChartCard>

              <ChartCard title="Top users by habit score">
                {o.top_users.length === 0 ? (
                  <p className="insight-note">No user data yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={Math.max(200, o.top_users.length * 32)}>
                    <BarChart data={o.top_users} layout="vertical" margin={{ left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                      <Tooltip cursor={{ fill: "rgba(108,86,232,0.06)" }} />
                      <Bar dataKey="habit_score" name="Habit score" fill="#FF6F5E" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>

              <ChartCard title="Difficulty preference" note="What users chose in their profile">
                <SimpleBar data={o.difficulty} xKey="level" bars={[{ key: "users", name: "Users", color: "#FFB648" }]} />
              </ChartCard>

              <ChartCard title="Challenge type usage" note="Sessions and completions across all users">
                {o.challenge_usage.length === 0 ? (
                  <p className="insight-note">No challenges recorded yet.</p>
                ) : (
                  <SimpleBar
                    data={o.challenge_usage.map((c) => ({ ...c, name: c.challenge_type.replace("_", " ") }))}
                    xKey="name"
                    bars={[
                      { key: "sessions", name: "Sessions", color: "#C9C0F5" },
                      { key: "completed", name: "Completed", color: "#6C56E8" },
                    ]}
                  />
                )}
              </ChartCard>

              <ChartCard wide title="When people wake up" note="Completed wake-ups by hour of day">
                <SimpleBar
                  data={o.wake_hours.map((h) => ({ ...h, label: hourLabel(h.hour) }))}
                  xKey="label"
                  bars={[{ key: "wakeups", name: "Wake-ups", color: "#2F9E8F" }]}
                  interval={1}
                />
              </ChartCard>

              <ChartCard title="Snoozes by day of week" note="Average snoozes per session, all users">
                <SimpleBar data={o.weekday_snoozes.map((d) => ({ ...d, label: d.day.slice(0, 3) }))} xKey="label" bars={[{ key: "avg_snoozes", name: "Avg snoozes", color: "#FF9A52" }]} />
              </ChartCard>

              <ChartCard title="Planned sleep duration" note="From user profiles">
                <SimpleBar data={o.sleep_distribution} xKey="range" bars={[{ key: "users", name: "Users", color: "#9B6FE8" }]} />
              </ChartCard>
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="tab-panel">
            <div className="admin-toolbar">
              <input className="form-input" type="text" placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} />
              <select className="form-input" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="all">All roles</option>
                <option value="user">Users</option>
                <option value="wellness_coach">Coaches</option>
                <option value="admin">Admins</option>
              </select>
              <span className="insight-note" style={{ margin: 0, alignSelf: "center" }}>
                Showing {filteredUsers.length} of {o.users.length} accounts
              </span>
            </div>

            <div className="admin-table admin-users-scroll">
              <div className="admin-users-inner">
                <div className="admin-users-head">
                  <div>Account</div><div>Role</div><div>Coach</div><div>Score</div><div>Sessions</div><div>Done</div><div>Streak</div><div>Last active</div>
                </div>
                {filteredUsers.map((u) => (
                  <div className="admin-users-row" key={u.id}>
                    <div>
                      <div className="user-name">{u.name}</div>
                      <div className="user-email">{u.email}</div>
                    </div>
                    <div>
                      {u.id === currentUser?.id ? (
                        <span className="role-badge" style={{ marginLeft: 0 }}>{u.role} (you)</span>
                      ) : (
                        <select className="form-input admin-role-select" value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}>
                          <option value="user">User</option>
                          <option value="wellness_coach">Wellness Coach</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </div>
                    <div>
                      {u.role === "user" ? (
                        <select className="form-input admin-role-select" value={u.coach_id || ""} onChange={(e) => handleAssignCoach(u.id, e.target.value)}>
                          <option value="">No coach</option>
                          {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <span style={{ color: "var(--mist)" }}>-</span>
                      )}
                    </div>
                    <div>{u.habit_score === null ? "-" : <span className={`score-pill ${scoreClass(u.habit_score)}`}>{Math.round(u.habit_score)}</span>}</div>
                    <div>{u.role === "user" ? u.sessions : "-"}</div>
                    <div>{u.completion_rate === null ? "-" : `${u.completion_rate}%`}</div>
                    <div>{u.streak === null ? "-" : `${u.streak}d`}</div>
                    <div className="user-email">{u.role === "user" ? when(u.last_active) : "-"}</div>
                  </div>
                ))}
                {filteredUsers.length === 0 && <div className="admin-users-row"><div>No accounts match.</div></div>}
              </div>
            </div>
          </div>
        )}

        {tab === "recommendations" && (
          <div className="tab-panel">
            {monitorState === "loading" && <p className="insight-note">Analyzing recommendations for every user...</p>}
            {monitor && (
              <>
                <div className="card-grid">
                  <div className="info-card"><div className="info-card-label">Users analyzed</div><div className="info-card-value">{monitor.users_analyzed}</div></div>
                  <div className="info-card"><div className="info-card-label">Recommendations</div><div className="info-card-value">{monitor.total_recommendations}</div></div>
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
                      <div className="monitor-top-row" key={r.title}><span>{r.title}</span><strong>{r.count}</strong></div>
                    ))}
                  </div>
                </div>

                <h3 className="chart-title" style={{ margin: "6px 0 10px" }}>Users needing attention first</h3>
                <div className="session-table">
                  <div className="monitor-row session-head">
                    <div>User</div><div>Email</div><div>Priority</div><div>Count</div><div>Recommendations</div>
                  </div>
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
          </div>
        )}

        {tab === "tools" && (
          <div className="tab-panel">
            <h2 className="section-heading" style={{ marginTop: 0 }}>Send platform announcement</h2>
            <form className="alarm-form" onSubmit={handleSendAnnouncement} style={{ marginBottom: 28 }}>
              <input className="form-input" type="text" placeholder="Announcement title" value={announceTitle} onChange={(e) => setAnnounceTitle(e.target.value)} required style={{ flex: "0 0 240px" }} />
              <input className="form-input" type="text" placeholder="Message" value={announceMessage} onChange={(e) => setAnnounceMessage(e.target.value)} required />
              <button className="btn-primary" type="submit" disabled={sending} style={{ width: "auto", padding: "11px 22px", display: "flex", alignItems: "center", gap: 7 }}>
                <Megaphone size={15} /> {sending ? "Sending..." : "Send to all users"}
              </button>
            </form>

            <h2 className="section-heading">System reports</h2>
            <div className="report-grid">
              {SYSTEM_REPORTS.map((r) => {
                const Icon = r.icon;
                return (
                  <div className="report-card" key={r.key} style={{ "--rc": r.tint }}>
                    <div className="report-icon"><Icon size={26} /></div>
                    <h3 className="report-title">{r.title}</h3>
                    <p className="report-desc">{r.desc}</p>
                    <button className="report-btn" onClick={() => handleReport(r)} disabled={busyKey === r.key}>
                      <Download size={16} /> {busyKey === r.key ? "Preparing..." : "Download"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Admin;