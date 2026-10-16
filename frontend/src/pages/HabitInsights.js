import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";
import AppLayout from "../components/AppLayout";
import {
  getHabitScore, getHabitScoreHistory, getBehavioralAnalytics, getDifficultyPrediction,
  getChallengePerformance, getSleepPatterns, getDailyStreak, getRLAgentStatus,
} from "../services/habitService";
import { getProductivityCorrelation } from "../services/productivityService";

const TABS = [["performance", "Performance"], ["behavior", "Behavior"], ["ai", "AI engine"]];
const KEYS = ["score", "history", "behavior", "difficulty", "perf", "sleep", "streak", "rl", "productivity"];
const TREND_ICON = { improving: TrendingUp, declining: TrendingDown, stable: Minus };

function HabitInsights() {
  const [tab, setTab] = useState("performance");
  const [d, setD] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled([
        getHabitScore(), getHabitScoreHistory(), getBehavioralAnalytics(), getDifficultyPrediction(),
        getChallengePerformance(), getSleepPatterns(), getDailyStreak(), getRLAgentStatus(), getProductivityCorrelation(),
      ]);
      const next = {};
      results.forEach((r, i) => {
        next[KEYS[i]] = r.status === "fulfilled" ? r.value.data : null;
      });
      if (results.every((r) => r.status === "rejected")) toast.error("Could not load insights");
      setD(next);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="dashboard-content"><p>Loading your insights...</p></div>
      </AppLayout>
    );
  }

  const { score, streak, behavior, difficulty, perf, sleep, rl, productivity } = d;
  const history = (d.history || []).map((h, i) => ({
    index: i + 1,
    score: h.total_score,
    date: new Date(h.calculated_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }),
  }));
  const bars = score
    ? [
        ["Wake-Up Consistency", score.wake_consistency_score],
        ["Challenge Completion", score.challenge_completion_score],
        ["Snooze Reduction", score.snooze_reduction_score],
        ["Sleep Schedule Adherence", score.sleep_adherence_score],
        ["Productivity", score.productivity_score],
      ]
    : [];
  const TrendIcon = difficulty ? TREND_ICON[difficulty.trend] || Minus : Minus;

  return (
    <AppLayout>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Habit Insights</h1>
          <p className="dashboard-subtitle">Your wake-up performance, powered by real behavioral data</p>
        </div>

        <div className="tabs">
          {TABS.map(([key, text]) => (
            <button key={key} className={`tab-btn ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>{text}</button>
          ))}
        </div>

        {tab === "performance" && (
          <div className="tab-panel">
            {streak && (
              <div className="streak-hero">
                <div className="streak-hero-main">
                  <span className="streak-hero-fire"><Flame size={30} color="#FF9E5E" fill="#FF9E5E" strokeWidth={1.5} /></span>
                  <div>
                    <div className="streak-hero-number">{streak.current_streak}</div>
                    <div className="streak-hero-label">day streak</div>
                  </div>
                </div>
                <div className="streak-hero-best">Longest streak: <strong>{streak.longest_streak} days</strong></div>
              </div>
            )}

            {score && (
              <div className="habit-score-hero">
                <div className="habit-score-ring" style={{ "--pct": score.total_score }}>
                  <div className="habit-score-number">{Math.round(score.total_score)}</div>
                  <div className="habit-score-label">Habit Score</div>
                </div>
                <div className="habit-score-breakdown">
                  {bars.map(([label, value]) => (
                    <div className="habit-score-bar-row" key={label}>
                      <span>{label}</span>
                      <div className="habit-score-bar-track"><div className="habit-score-bar-fill" style={{ width: `${value}%` }} /></div>
                      <span>{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {history.length > 1 && (
              <>
                <h2 className="section-heading">Habit score trend</h2>
                <div className="chart-card">
                  <ResponsiveContainer width="100%" height={230}>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
                      <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip labelFormatter={(i) => history[i - 1]?.date} />
                      <Line type="monotone" dataKey="score" name="Habit score" stroke="#6C56E8" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {sleep && sleep.category !== "not_set" && (
              <>
                <h2 className="section-heading">Sleep pattern</h2>
                <div className="info-card" style={{ marginBottom: 28 }}>
                  <div className="info-card-label">{sleep.sleep_duration_hours}h planned sleep · <span style={{ textTransform: "capitalize" }}>{sleep.category}</span></div>
                  <div style={{ fontSize: 14, color: "var(--ink)", marginTop: 8, lineHeight: 1.5 }}>{sleep.insight}</div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === "behavior" && (
          <div className="tab-panel">
            {behavior && behavior.day_of_week_breakdown.length > 0 && (
              <>
                <h2 className="section-heading">Snoozes by day of week</h2>
                <div className="chart-card">
                  <p className="insight-note">
                    Best day: <strong>{behavior.best_day}</strong>. Hardest day: <strong>{behavior.worst_day}</strong>.
                  </p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={behavior.day_of_week_breakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
                      <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="avg_snoozes" name="Avg snoozes" fill="#FF9A52" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {productivity && productivity.daily_points.length >= 3 && (
              <>
                <h2 className="section-heading">Wake-up quality vs. productivity</h2>
                <div className="chart-card">
                  <div className="correlation-summary">
                    <div>
                      <span className="correlation-value">{productivity.correlation}</span>
                      <span className="correlation-strength">{productivity.strength} correlation</span>
                    </div>
                    <p className="correlation-insight">{productivity.insight}</p>
                  </div>
                  <ResponsiveContainer width="100%" height={210}>
                    <LineChart data={productivity.daily_points}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="wake_quality" stroke="#6C56E8" strokeWidth={2} dot={{ r: 2 }} name="Wake quality" />
                      <Line type="monotone" dataKey="productivity" stroke="#FF6F5E" strokeWidth={2} dot={{ r: 2 }} name="Productivity" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}

            {perf && (
              <>
                <h2 className="section-heading">Challenge type performance</h2>
                <div className="perf-grid">
                  {Object.entries(perf.performance).map(([type, data]) => (
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
          </div>
        )}

        {tab === "ai" && (
          <div className="tab-panel">
            {difficulty && (
              <>
                <h2 className="section-heading">Adaptive difficulty</h2>
                <div className="info-card" style={{ marginBottom: 14 }}>
                  <div className="info-card-label">
                    {difficulty.is_ml_prediction ? "Predicted by the machine learning model from your recent performance" : "Default (not enough history yet)"}
                  </div>
                  <div className="info-card-value" style={{ textTransform: "capitalize" }}>
                    {difficulty.recommended_difficulty}
                    {difficulty.is_ml_prediction && (
                      <span style={{ fontSize: 13, fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--mist)", fontWeight: 500, marginLeft: 10 }}>
                        {difficulty.confidence}% confidence
                      </span>
                    )}
                  </div>
                </div>
                {difficulty.trend !== "insufficient_data" && (
                  <div className={`trend-badge trend-${difficulty.trend}`} style={{ marginBottom: 28 }}>
                    <span className="trend-icon" style={{ display: "inline-flex" }}><TrendIcon size={16} /></span>
                    <span>{difficulty.trend_message}</span>
                  </div>
                )}
              </>
            )}

            {rl && (
              <>
                <h2 className="section-heading">Reinforcement learning agent</h2>
                <div className="chart-card">
                  <p className="insight-note">
                    The agent tries nudging your difficulty up, down or leaving it, and learns from how each session goes.
                    Currently preferred: <strong style={{ color: "var(--ink)", textTransform: "capitalize" }}>{rl.current_best_action}</strong>.
                  </p>
                  {["increase", "decrease", "stay"].map((action) => (
                    <div className="habit-score-bar-row" key={action} style={{ marginBottom: 10 }}>
                      <span style={{ textTransform: "capitalize" }}>{action}</span>
                      <div className="habit-score-bar-track">
                        <div className="habit-score-bar-fill" style={{ width: `${((rl.q_values[action] + 1) / 2) * 100}%` }} />
                      </div>
                      <span>{rl.q_values[action]}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default HabitInsights;