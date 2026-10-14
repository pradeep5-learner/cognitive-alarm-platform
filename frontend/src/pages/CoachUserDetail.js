import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, FileText, FileSpreadsheet } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { getAssignedUserDetails, downloadUserPdfReport, downloadUserExcelReport } from "../services/coachService";
import { triggerDownload } from "../utils/downloadFile";

const fmtMin = (m) => {
  const h = Math.floor(m / 60) % 24;
  const mm = Math.round(m % 60);
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
};

const shortDate = (d) => d.slice(5);

function CoachUserDetail() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getAssignedUserDetails(userId);
        setData(res.data);
      } catch (err) {
        toast.error(err.response?.data?.detail || "Could not load user details");
        navigate("/coach-dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId, navigate]);

  const handleReport = async (fetcher, filename) => {
    try {
      const res = await fetcher(userId);
      triggerDownload(res.data, filename);
      toast.success("Report downloaded");
    } catch (err) {
      toast.error("Could not download report");
    }
  };

  if (loading || !data) {
    return (
      <AppLayout>
        <div className="dashboard-content"><p>Loading user details...</p></div>
      </AppLayout>
    );
  }

  const { profile, habit_scores: hs, streak, adherence, daily_trend, wake_time_trend, behavior, sleep, productivity, challenge_perf, difficulty, recommendations, recent_sessions } = data;

  const bars = [
    ["Wake-Up Consistency", hs.wake_consistency_score],
    ["Challenge Completion", hs.challenge_completion_score],
    ["Snooze Reduction", hs.snooze_reduction_score],
    ["Sleep Schedule Adherence", hs.sleep_adherence_score],
    ["Productivity", hs.productivity_score],
  ];

  return (
    <AppLayout>
      <div className="dashboard-content">
        <button className="back-link" onClick={() => navigate("/coach-dashboard")}>
          <ArrowLeft size={15} /> My Users
        </button>

        <div className="dashboard-header">
          <h1 className="dashboard-title">{profile.name}</h1>
          <p className="dashboard-subtitle">{profile.email}</p>
          <div className="detail-meta">
            {profile.preferred_wake_time && <span className="detail-chip">Target wake-up {profile.preferred_wake_time}</span>}
            {profile.sleep_duration_hours && <span className="detail-chip">Plans {profile.sleep_duration_hours}h sleep</span>}
            {profile.difficulty_preference && <span className="detail-chip">Prefers {profile.difficulty_preference}</span>}
            {profile.productivity_goal && <span className="detail-chip">Goal: {profile.productivity_goal}</span>}
            {profile.habit_preferences && <span className="detail-chip">{profile.habit_preferences}</span>}
          </div>
        </div>

        <div className="report-download-bar" style={{ marginBottom: 24 }}>
          <span className="report-download-label">Export this user's full report</span>
          <div className="report-download-buttons">
            <button className="btn-report" onClick={() => handleReport(downloadUserPdfReport, `user_${userId}_report.pdf`)}>
              <FileText size={15} /> PDF
            </button>
            <button className="btn-report" onClick={() => handleReport(downloadUserExcelReport, `user_${userId}_report.xlsx`)}>
              <FileSpreadsheet size={15} /> Excel
            </button>
          </div>
        </div>

        <div className="habit-score-hero">
          <div className="habit-score-ring" style={{ "--pct": hs.total_score }}>
            <div className="habit-score-number">{Math.round(hs.total_score)}</div>
            <div className="habit-score-label">Habit Score</div>
          </div>
          <div className="habit-score-breakdown">
            {bars.map(([label, value]) => (
              <div className="habit-score-bar-row" key={label}>
                <span>{label}</span>
                <div className="habit-score-bar-track">
                  <div className="habit-score-bar-fill" style={{ width: `${value}%` }} />
                </div>
                <span>{value}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card-grid">
          <div className="info-card">
            <div className="info-card-label">Current streak</div>
            <div className="info-card-value">{streak.current_streak} {streak.current_streak === 1 ? "day" : "days"}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">Longest streak</div>
            <div className="info-card-value">{streak.longest_streak} days</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">Active days (last {adherence.window_days})</div>
            <div className="info-card-value">{adherence.active_days} ({adherence.rate}%)</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">Sessions completed</div>
            <div className="info-card-value">{data.verified_sessions} / {data.total_sessions}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">AI difficulty</div>
            <div className="info-card-value" style={{ textTransform: "capitalize" }}>
              {difficulty.recommended}
              {difficulty.is_ml && (
                <span style={{ fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--mist)", marginLeft: 6 }}>
                  ({difficulty.confidence}%)
                </span>
              )}
            </div>
          </div>
        </div>

        <h2 className="section-heading">Habit adherence</h2>
        <div className="chart-card">
          <p className="insight-note">
            Completed a wake-up on {adherence.active_days} of the last {adherence.window_days} days.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={daily_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="sessions" name="Sessions started" fill="#C9C0F5" radius={[5, 5, 0, 0]} />
              <Bar dataKey="verified" name="Completed" fill="#6C56E8" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <h2 className="section-heading">Progress monitoring</h2>
        {difficulty.trend !== "insufficient_data" && (
          <div className={`trend-badge trend-${difficulty.trend}`} style={{ marginBottom: 14 }}>
            <span className="trend-icon" style={{ display: "inline-flex" }}>
              {difficulty.trend === "improving" ? <TrendingUp size={16} /> : difficulty.trend === "declining" ? <TrendingDown size={16} /> : <Minus size={16} />}
            </span>
            <span>{difficulty.trend_message}</span>
          </div>
        )}
        <div className="chart-card">
          <p className="insight-note">Average attempts and snoozes per session, by day.</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={daily_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
              <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="avg_attempts" name="Avg attempts" stroke="#6C56E8" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="avg_snoozes" name="Avg snoozes" stroke="#FF6F5E" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <h2 className="section-heading">Sleep trends</h2>
        <div className="chart-card">
          <p className="insight-note">{sleep.insight}</p>
          {wake_time_trend.points.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={wake_time_trend.points}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtMin} domain={["auto", "auto"]} tick={{ fontSize: 11 }} width={50} />
                <Tooltip formatter={(v) => fmtMin(v)} />
                {wake_time_trend.target_minutes !== null && (
                  <ReferenceLine y={wake_time_trend.target_minutes} stroke="#2F9E8F" strokeDasharray="5 4" label={{ value: "Target", fontSize: 11, fill: "#2F9E8F" }} />
                )}
                <Line type="monotone" dataKey="wake_minutes" name="Actual wake-up" stroke="#6C56E8" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="insight-note">No completed wake-ups in the last 14 days yet.</p>
          )}
        </div>

        <h2 className="section-heading">Behavior insights</h2>
        <div className="chart-card">
          <p className="insight-note">
            Best day: <strong>{behavior.best_day}</strong>. Hardest day: <strong>{behavior.worst_day}</strong>.
            Takes about {behavior.avg_response_time_minutes} min on average to dismiss an alarm.
          </p>
          {behavior.day_of_week_breakdown.length > 0 && (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={behavior.day_of_week_breakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="avg_snoozes" name="Avg snoozes" fill="#FF9A52" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <h2 className="section-heading">Productivity</h2>
        <div className="chart-card">
          {productivity.correlation !== null && (
            <div className="correlation-summary">
              <span className="correlation-value">{productivity.correlation}</span>
              <span className="correlation-strength">{productivity.strength} correlation across {productivity.days_analyzed} days</span>
            </div>
          )}
          <p className="correlation-insight" style={{ marginTop: 0 }}>{productivity.insight}</p>
        </div>

        <h2 className="section-heading">Challenge performance</h2>
        <div className="perf-grid">
          {Object.entries(challenge_perf).map(([type, stats]) => (
            <div className="perf-card" key={type}>
              <div className="perf-type">{type.replace("_", " ")}</div>
              {stats.count > 0 ? (
                <>
                  <div className="perf-stat">{stats.avg_attempts} avg attempts</div>
                  <div className="perf-count">{stats.count} completed</div>
                </>
              ) : (
                <div className="perf-untested">Not tried yet</div>
              )}
            </div>
          ))}
        </div>

        <h2 className="section-heading">Recommendations for this user</h2>
        <div className="recs-list" style={{ marginBottom: 28 }}>
          {recommendations.map((rec, i) => (
            <div className={`rec-card rec-${rec.priority}`} key={i}>
              <div className="rec-title">{rec.title}</div>
              <div className="rec-message">{rec.message}</div>
            </div>
          ))}
        </div>

        <h2 className="section-heading">Recent wake-up sessions</h2>
        <div className="session-table">
          <div className="session-row session-head">
            <div>When</div><div>Alarm</div><div>Challenge</div><div>Attempts</div><div>Snoozes</div><div>Status</div>
          </div>
          {recent_sessions.length === 0 && <div className="session-row"><div>No sessions yet.</div></div>}
          {recent_sessions.map((s, i) => (
            <div className="session-row" key={i}>
              <div>{new Date(s.started_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
              <div>{s.alarm_label}</div>
              <div style={{ textTransform: "capitalize" }}>{s.challenge_type.replace("_", " ")}</div>
              <div>{s.attempts}</div>
              <div>{s.snooze_count}</div>
              <div><span className={`status-pill ${s.verified ? "status-done" : "status-open"}`}>{s.verified ? "Completed" : "Incomplete"}</span></div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default CoachUserDetail;