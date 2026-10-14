import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Hand, AlarmClock, CheckCircle2, Star, Brain, Flame, Sparkles, ShieldCheck } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { getAlarms } from "../services/alarmService";
import { getAnalytics, getWakeUpHistory } from "../services/wakeupService";
import {
  getHabitScore, getHabitScoreHistory, getRecommendations, getDifficultyPrediction,
  getEngagementStatus, getDailyStreak, getChallengePerformance,
} from "../services/habitService";
import { logProductivity, getProductivityHistory, getProductivityCorrelation } from "../services/productivityService";

const localDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function Dashboard() {
  const { user } = useAuth();
  const [alarms, setAlarms] = useState([]);
  const [stats, setStats] = useState(null);
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState(null);
  const [aiDifficulty, setAiDifficulty] = useState(null);
  const [engagement, setEngagement] = useState(null);
  const [challengePerf, setChallengePerf] = useState(null);
  const [recs, setRecs] = useState([]);
  const [productivity, setProductivity] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [rating, setRating] = useState(null);
  const [savingRating, setSavingRating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled([
        getAlarms(),                // 0
        getAnalytics(),             // 1
        getHabitScore(),            // 2
        getHabitScoreHistory(),     // 3
        getDailyStreak(),           // 4
        getDifficultyPrediction(),  // 5
        getEngagementStatus(),      // 6
        getChallengePerformance(),  // 7
        getRecommendations(),       // 8
        getProductivityCorrelation(), // 9
        getProductivityHistory(),   // 10
        getWakeUpHistory(10),       // 11
      ]);
      const val = (i) => (results[i].status === "fulfilled" ? results[i].value.data : null);

      setAlarms(val(0) || []);
      setStats(val(1));
      setScore(val(2));
      setHistory(
        (val(3) || []).slice(-30).map((h, i) => ({
          index: i + 1,
          score: h.total_score,
          date: new Date(h.calculated_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
        }))
      );
      setStreak(val(4));
      setAiDifficulty(val(5));
      setEngagement(val(6));
      setChallengePerf(val(7)?.performance || null);
      setRecs(val(8)?.recommendations || []);
      setProductivity(val(9));
      setSessions(val(11) || []);

      const todayEntry = (val(10) || []).find((h) => h.log_date === localDateString());
      if (todayEntry) setRating(todayEntry.rating);

      setLoading(false);
    };
    load();
  }, []);

  const handleRate = async (n) => {
    setSavingRating(true);
    try {
      await logProductivity(n);
      setRating(n);
      toast.success("Thanks! Today's productivity logged.");
    } catch (err) {
      toast.error("Could not save rating");
    } finally {
      setSavingRating(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="dashboard-content"><p>Loading your dashboard...</p></div>
      </AppLayout>
    );
  }

  const bars = score
    ? [
        ["Wake-Up Consistency", score.wake_consistency_score],
        ["Challenge Completion", score.challenge_completion_score],
        ["Snooze Reduction", score.snooze_reduction_score],
        ["Sleep Schedule Adherence", score.sleep_adherence_score],
        ["Productivity", score.productivity_score],
      ]
    : [];

  return (
    <AppLayout>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            Welcome, {user?.name} <Hand size={26} color="#FFB648" strokeWidth={2} />
          </h1>
          <p className="dashboard-subtitle">Here's how your mornings are going</p>
        </div>

        {engagement && engagement.disengaging && (
          <div className="engagement-banner">
            <span className="engagement-icon">
              <Sparkles size={22} color="#FF9E5E" fill="#FF9E5E" strokeWidth={1} />
            </span>
            <div>
              <div className="engagement-title">We've eased things up for you</div>
              <div className="engagement-text">
                Your recent completion rate is {engagement.recent_completion_rate}%. Your next alarms will be a bit easier to help you build momentum.
              </div>
            </div>
          </div>
        )}

        {score && (
          <div className="dash-split">
            <div className="habit-score-hero">
              <div className="habit-score-ring" style={{ "--pct": score.total_score }}>
                <div className="habit-score-number">{Math.round(score.total_score)}</div>
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

            <div className="chart-card">
              <h3 className="chart-title">Habit score trend</h3>
              {history.length > 1 ? (
                <ResponsiveContainer width="100%" height={190}>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
                    <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={34} />
                    <Tooltip labelFormatter={(i) => history[i - 1]?.date} />
                    <Line type="monotone" dataKey="score" name="Habit score" stroke="#6C56E8" strokeWidth={2.5} dot={{ r: 2.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="insight-note">Your trend will appear here once you've opened your dashboard a few times.</p>
              )}
            </div>
          </div>
        )}

        <div className="card-grid">
          <div className="info-card">
            <div className="info-card-icon"><AlarmClock size={17} /></div>
            <div className="info-card-label">Total Alarms</div>
            <div className="info-card-value">{alarms.length}</div>
          </div>
          <div className="info-card">
            <div className="info-card-icon"><CheckCircle2 size={17} /></div>
            <div className="info-card-label">Active Alarms</div>
            <div className="info-card-value">{alarms.filter((a) => a.is_active).length}</div>
          </div>
          {streak && (
            <div className="info-card">
              <div className="info-card-icon"><span className="streak-flame" style={{ display: "inline-flex" }}><Flame size={17} /></span></div>
              <div className="info-card-label">Daily Streak</div>
              <div className="info-card-value">{streak.current_streak} {streak.current_streak === 1 ? "day" : "days"}</div>
            </div>
          )}
          <div className="info-card">
            <div className="info-card-icon"><Star size={17} /></div>
            <div className="info-card-label">Profile Setting</div>
            <div className="info-card-value" style={{ textTransform: "capitalize" }}>{user?.difficulty_preference || "Not set"}</div>
          </div>
          {aiDifficulty && (
            <div className="info-card">
              <div className="info-card-icon"><Brain size={17} /></div>
              <div className="info-card-label">{aiDifficulty.is_ml_prediction ? "AI-Adjusted Difficulty" : "AI (needs more data)"}</div>
              <div className="info-card-value" style={{ textTransform: "capitalize" }}>
                {aiDifficulty.recommended_difficulty}
                {aiDifficulty.is_ml_prediction && (
                  <span style={{ fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--mist)", fontWeight: 500, marginLeft: 6 }}>
                    ({aiDifficulty.confidence}%)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {stats && stats.total_sessions > 0 && (
          <>
            <h2 className="section-heading">Wake-up statistics</h2>
            <div className="card-grid">
              <div className="info-card">
                <div className="info-card-label">Completion Rate</div>
                <div className="info-card-value">{stats.completion_rate}%</div>
              </div>
              <div className="info-card">
                <div className="info-card-label">First-Try Accuracy</div>
                <div className="info-card-value">{stats.first_try_accuracy}%</div>
              </div>
              <div className="info-card">
                <div className="info-card-label">Avg. Attempts</div>
                <div className="info-card-value">{stats.average_attempts}</div>
              </div>
              <div className="info-card">
                <div className="info-card-label">Total Snoozes</div>
                <div className="info-card-value">{stats.total_snoozes}</div>
              </div>
            </div>
          </>
        )}

        {challengePerf && (
          <>
            <h2 className="section-heading">Challenge performance</h2>
            <div className="perf-grid">
              {Object.entries(challengePerf).map(([type, data]) => (
                <div className="perf-card" key={type}>
                  <div className="perf-type">{type.replace("_", " ")}</div>
                  {data.count > 0 ? (
                    <>
                      <div className="perf-stat">{data.avg_attempts} avg attempts</div>
                      <div className="perf-bar-track">
                        <div className="perf-bar-fill" style={{ width: `${Math.min(100, (data.skill_weight / 3) * 100)}%` }} />
                      </div>
                      <div className="perf-count">{data.count} completed</div>
                    </>
                  ) : (
                    <div className="perf-untested">Not tried yet</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="section-heading">Productivity</h2>
        <div className="productivity-widget" style={{ marginTop: 0 }}>
          <div className="productivity-widget-label">How productive was your day?</div>
          <div className="productivity-scale">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`productivity-btn ${rating === n ? "productivity-btn-active" : ""}`}
                onClick={() => handleRate(n)}
                disabled={savingRating}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="productivity-scale-labels">
            <span>Low</span>
            <span>High</span>
          </div>
          {productivity && (
            <p className="insight-note" style={{ marginTop: 18, marginBottom: 0 }}>
              {productivity.correlation !== null && (
                <strong>{productivity.correlation} ({productivity.strength} correlation). </strong>
              )}
              {productivity.insight}
            </p>
          )}
        </div>

        {recs.length > 0 && (
          <>
            <h2 className="section-heading">Recommendations</h2>
            <div className="recs-list">
              {recs.map((rec, i) => (
                <div className={`rec-card rec-${rec.priority}`} key={i}>
                  <div className="rec-title">{rec.title}</div>
                  <div className="rec-message">{rec.message}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 className="section-heading">Alarm history</h2>
        <div className="session-table">
          <div className="session-row session-head">
            <div>When</div><div>Alarm</div><div>Challenge</div><div>Attempts</div><div>Snoozes</div><div>Status</div>
          </div>
          {sessions.length === 0 && <div className="session-row"><div>No alarms rung yet.</div></div>}
          {sessions.map((s, i) => (
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

        {user?.role === "admin" && (
          <div className="admin-panel">
            <div className="admin-panel-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ShieldCheck size={18} color="#6C56E8" /> Admin Panel
            </div>
            <p className="admin-panel-text">
              You're viewing this because your account role is "admin". Regular users never see this section.
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Dashboard;