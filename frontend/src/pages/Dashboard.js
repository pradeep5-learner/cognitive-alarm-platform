import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Flame, Brain, AlarmClock, Check, Target, Lightbulb, ShieldCheck } from "lucide-react";
import AppLayout from "../components/AppLayout";
import { useAuth } from "../context/AuthContext";
import { getAlarms } from "../services/alarmService";
import { getAnalytics, getWakeUpHistory } from "../services/wakeupService";
import {
  getHabitScore, getHabitScoreHistory, getRecommendations, getDifficultyPrediction,
  getEngagementStatus, getDailyStreak, getChallengePerformance, getWeekOverview,
} from "../services/habitService";
import { logProductivity, getProductivityHistory, getProductivityCorrelation } from "../services/productivityService";
import { nextRingDate } from "../utils/alarmSchedule";
import { formatTime } from "../utils/formatTime";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";


const ARC_LENGTH = Math.PI * 100;
const PRIORITY_RANK = { high: 3, medium: 2, low: 1 };

function dayPart(hour) {
  if (hour >= 5 && hour < 12) return { key: "morning", greeting: "Good morning" };
  if (hour >= 12 && hour < 17) return { key: "afternoon", greeting: "Good afternoon" };
  if (hour >= 17 && hour < 21) return { key: "evening", greeting: "Good evening" };
  return { key: "night", greeting: "Good night" };
}

function formatCountdown(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${String(s).padStart(2, "0")}s`;
}

const localDateString = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function Hero({ user, alarms, streak, aiDifficulty }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const part = dayPart(now.getHours());
  const hour12 = now.getHours() % 12 || 12;
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  const ampm = now.getHours() >= 12 ? "PM" : "AM";
  const firstName = (user?.name || "").split(" ")[0];

  const upcoming = alarms
    .map((alarm) => ({ alarm, at: nextRingDate(alarm, now) }))
    .filter((x) => x.at)
    .sort((a, b) => a.at - b.at)[0];

  return (
    <div className={`dash-hero hero-${part.key}`}>
      <div className="dash-hero-glow" />
      <div>
        <div className="dash-hero-greeting">{part.greeting}, {firstName}</div>
        <div className="dash-hero-clock">
          {hour12}:{minutes}
          <span className="dash-hero-seconds">{seconds}</span>
          <span className="dash-hero-ampm">{ampm}</span>
        </div>
        <div className="dash-hero-date">
          {now.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
        <div className="dash-hero-chips">
          {streak && (
            <span className="hero-chip"><Flame size={14} /> {streak.current_streak} day streak</span>
          )}
          <span className="hero-chip"><AlarmClock size={14} /> {alarms.filter((a) => a.is_active).length} active alarms</span>
          {aiDifficulty && (
            <span className="hero-chip" style={{ textTransform: "capitalize" }}>
              <Brain size={14} /> {aiDifficulty.recommended_difficulty} difficulty
            </span>
          )}
        </div>
      </div>

      <div className="dash-hero-next">
        <div className="dash-hero-next-label">Next alarm</div>
        {upcoming ? (
          <>
            <div className="dash-hero-next-count">{formatCountdown(upcoming.at - now)}</div>
            <div className="dash-hero-next-meta">
              {formatTime(upcoming.alarm.time)} · {upcoming.alarm.label}
            </div>
          </>
        ) : (
          <div className="dash-hero-next-meta" style={{ marginTop: 8 }}>
            No upcoming alarms. Create one on the Alarms page.
          </div>
        )}
      </div>
    </div>
  );
}

function HorizonGauge({ value }) {
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setShown(value), 200);
    return () => clearTimeout(t);
  }, [value]);

  const pct = Math.max(0, Math.min(100, shown));

  return (
    <div className="gauge-wrap">
      <svg viewBox="0 0 240 130" className="gauge-svg">
        <defs>
          <linearGradient id="horizonGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#6C56E8" />
            <stop offset="60%" stopColor="#FF6F5E" />
            <stop offset="100%" stopColor="#FFB648" />
          </linearGradient>
        </defs>
        <path d="M 20 110 A 100 100 0 0 1 220 110" className="gauge-track" />
        <path
          d="M 20 110 A 100 100 0 0 1 220 110"
          className="gauge-fill"
          stroke="url(#horizonGrad)"
          style={{ strokeDasharray: ARC_LENGTH, strokeDashoffset: ARC_LENGTH * (1 - pct / 100) }}
        />
        <g className="gauge-sun" style={{ transform: `rotate(${pct * 1.8}deg)` }}>
          <circle cx="20" cy="110" r="9" fill="#FFB648" stroke="#fff" strokeWidth="3" />
        </g>
      </svg>
      <div className="gauge-center">
        <div className="gauge-number">{Math.round(value)}</div>
        <div className="gauge-caption">Habit score</div>
      </div>
    </div>
  );
}

function WeekStrip({ days }) {
  return (
    <div className="week-strip">
      {days.map((d) => {
        const state = d.verified > 0 ? "done" : d.sessions > 0 ? "missed" : "empty";
        return (
          <div className={`week-day ${d.is_today ? "today" : ""}`} key={d.date} title={d.wake_label ? `Woke at ${d.wake_label}` : "No wake-up"}>
            <div className={`week-dot week-${state}`}>{state === "done" && <Check size={15} strokeWidth={3} />}</div>
            <div className="week-label">{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

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
  const [week, setWeek] = useState(null);
  const [rating, setRating] = useState(null);
  const [ratingHistory, setRatingHistory] = useState([]);
  const [savingRating, setSavingRating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const results = await Promise.allSettled([
        getAlarms(),                  // 0
        getAnalytics(),               // 1
        getHabitScore(),              // 2
        getHabitScoreHistory(),       // 3
        getDailyStreak(),             // 4
        getDifficultyPrediction(),    // 5
        getEngagementStatus(),        // 6
        getChallengePerformance(),    // 7
        getRecommendations(),         // 8
        getProductivityCorrelation(), // 9
        getProductivityHistory(),     // 10
        getWakeUpHistory(8),          // 11
        getWeekOverview(),            // 12
      ]);
      const val = (i) => (results[i].status === "fulfilled" ? results[i].value.data : null);

      setAlarms(val(0) || []);
      setStats(val(1));
      setScore(val(2));
      setHistory(
        (val(3) || []).slice(-30).map((h, i) => ({
          index: i + 1,
          score: h.total_score,
          date: new Date(h.calculated_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true }),
        }))
      );
      setStreak(val(4));
      setAiDifficulty(val(5));
      setEngagement(val(6));
      setChallengePerf(val(7)?.performance || null);
      setRecs(val(8)?.recommendations || []);
      setProductivity(val(9));
      setSessions(val(11) || []);
      setWeek(val(12));

      const todayEntry = (val(10) || []).find((h) => h.log_date === localDateString());
      if (todayEntry) setRating(todayEntry.rating);
      setRatingHistory(
        (val(10) || []).slice(-7).map((h) => ({
          day: new Date(`${h.log_date}T00:00:00`).toLocaleDateString([], { weekday: "short" }),
          rating: h.rating,
          isToday: h.log_date === localDateString(),
        }))
      );
      setLoading(false);
    };
    load();
  }, []);

  const handleRate = async (n) => {
    setSavingRating(true);
    try {
      await logProductivity(n);
      setRating(n);
      setRatingHistory((prev) => {
        const today = new Date().toLocaleDateString([], { weekday: "short" });
        return [...prev.filter((p) => !p.isToday), { day: today, rating: n, isToday: true }].slice(-7);
      });
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
        ["Consistency", score.wake_consistency_score],
        ["Completion", score.challenge_completion_score],
        ["Snooze control", score.snooze_reduction_score],
        ["Sleep schedule", score.sleep_adherence_score],
        ["Productivity", score.productivity_score],
      ]
    : [];

  const radarData = challengePerf
    ? Object.entries(challengePerf).map(([type, d]) => ({
        type: type.replace("_", " "),
        skill: d.count > 0 && d.avg_attempts ? Math.min(100, Math.round(100 / d.avg_attempts)) : 0,
      }))
    : [];

  const sortedRecs = [...recs].sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority]);
  const spotlight = sortedRecs[0];
  const otherRecs = sortedRecs.slice(1);
  const goal = week?.goal;

  return (
    <AppLayout>
      <div className="dashboard-content">
        <Hero user={user} alarms={alarms} streak={streak} aiDifficulty={aiDifficulty} />

        {engagement && engagement.disengaging && (
          <div className="engagement-banner">
            <div>
              <div className="engagement-title">We've eased things up for you</div>
              <div className="engagement-text">
                Your recent completion rate is {engagement.recent_completion_rate}%. Your next alarms will be a bit easier to help you build momentum.
              </div>
            </div>
          </div>
        )}

        <div className="dash-grid dash-grid-a">
          {score && (
            <div className="dash-card">
              <h3 className="dash-card-title">Habit score</h3>
              <HorizonGauge value={score.total_score} />
              <div className="mini-bars">
                {bars.map(([label, value]) => (
                  <div className="mini-bar-row" key={label}>
                    <span>{label}</span>
                    <div className="mini-bar-track"><div className="mini-bar-fill" style={{ width: `${value}%` }} /></div>
                    <span>{Math.round(value)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="dash-stack">
            {week && (
              <div className="dash-card">
                <h3 className="dash-card-title">This week</h3>
                <WeekStrip days={week.days} />
                <p className="insight-note" style={{ margin: "14px 0 0" }}>
                  {week.days.filter((d) => d.verified > 0).length} of 7 days completed
                </p>
              </div>
            )}

            {goal && (
              <div className="dash-card">
                <h3 className="dash-card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Target size={17} color="#6C56E8" /> Wake-up goal
                </h3>
                {goal.has_goal ? (
                  <>
                    <div className="goal-row">
                      <div>
                        <div className="goal-label">Target</div>
                        <div className="goal-value">{goal.target_label}</div>
                      </div>
                      <div>
                        <div className="goal-label">Your average</div>
                        <div className="goal-value">{goal.avg_wake_label || "—"}</div>
                      </div>
                      <div>
                        <div className="goal-label">On target</div>
                        <div className="goal-value">{goal.days_on_target}/{goal.days_with_wakeup || 0}</div>
                      </div>
                    </div>
                    <div className="mini-bar-track" style={{ marginTop: 14 }}>
                      <div
                        className="mini-bar-fill"
                        style={{ width: `${goal.days_with_wakeup ? (goal.days_on_target / goal.days_with_wakeup) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="insight-note" style={{ margin: "10px 0 0" }}>
                      {goal.days_with_wakeup === 0
                        ? "Complete a wake-up to start tracking your goal."
                        : `A day counts when you wake within ${goal.tolerance_minutes} minutes of your target.`}
                    </p>
                  </>
                ) : (
                  <p className="insight-note" style={{ margin: 0 }}>
                    Set your preferred wake-up time in <Link to="/profile" style={{ color: "var(--violet)", fontWeight: 600 }}>Profile</Link> to track a wake-up goal.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="dash-grid dash-grid-b">
          <div className="dash-card">
            <h3 className="dash-card-title">Score over time</h3>
            {history.length > 1 ? (
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6C56E8" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6C56E8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" vertical={false} />
                  <XAxis dataKey="index" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={32} />
                  <Tooltip labelFormatter={(i) => history[i - 1]?.date} />
                  <Area type="monotone" dataKey="score" name="Habit score" stroke="#6C56E8" strokeWidth={2.5} fill="url(#scoreFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="insight-note">Your trend appears here once you've opened your dashboard a few times.</p>
            )}
          </div>

          <div className="dash-card">
            <h3 className="dash-card-title">Skill radar</h3>
            {radarData.some((d) => d.skill > 0) ? (
              <ResponsiveContainer width="100%" height={230}>
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="#E4DEF3" />
                  <PolarAngleAxis dataKey="type" tick={{ fontSize: 11, fill: "#8D87A6" }} />
                  <Radar dataKey="skill" name="Skill" stroke="#6C56E8" fill="#6C56E8" fillOpacity={0.3} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <p className="insight-note">Solve a few challenges and your strengths will show up here.</p>
            )}
          </div>
        </div>

        {stats && stats.total_sessions > 0 && (
          <div className="card-grid" style={{ marginBottom: 16 }}>
            <div className="info-card"><div className="info-card-label">Completion rate</div><div className="info-card-value">{stats.completion_rate}%</div></div>
            <div className="info-card"><div className="info-card-label">First-try accuracy</div><div className="info-card-value">{stats.first_try_accuracy}%</div></div>
            <div className="info-card"><div className="info-card-label">Avg. attempts</div><div className="info-card-value">{stats.average_attempts}</div></div>
            <div className="info-card"><div className="info-card-label">Total snoozes</div><div className="info-card-value">{stats.total_snoozes}</div></div>
          </div>
        )}

        <div className="dash-grid dash-grid-d">
          <div className="dash-card">
            <h3 className="dash-card-title">For you</h3>
            {spotlight ? (
              <>
                <div className="spotlight">
                  <div className="spotlight-head">
                    <Lightbulb size={17} color="#6C56E8" />
                    <span className={`prio-pill prio-${spotlight.priority}`}>{spotlight.priority}</span>
                  </div>
                  <div className="rec-title">{spotlight.title}</div>
                  <div className="rec-message">{spotlight.message}</div>
                </div>
                {otherRecs.length > 0 && (
                  <div className="recs-list" style={{ marginTop: 12 }}>
                    {otherRecs.map((rec, i) => (
                      <div className={`rec-card rec-${rec.priority}`} key={i}>
                        <div className="rec-title">{rec.title}</div>
                        <div className="rec-message">{rec.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="insight-note">Recommendations will appear as you use the app.</p>
            )}
          </div>

          <div className="dash-card">
            <h3 className="dash-card-title">How productive was your day?</h3>
            <div className="rating-grid">
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
            <div className="rating-labels"><span>Not productive</span><span>Very productive</span></div>

            {ratingHistory.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <div className="insight-note" style={{ marginBottom: 6 }}>Your last {ratingHistory.length} ratings</div>
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart data={ratingHistory}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 5]} hide />
                    <Tooltip cursor={{ fill: "rgba(108,86,232,0.06)" }} />
                    <Bar dataKey="rating" name="Rating" fill="#6C56E8" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {productivity && (
              <p className="insight-note" style={{ marginTop: 14, marginBottom: 0 }}>
                {productivity.correlation !== null && <strong>{productivity.correlation} ({productivity.strength} correlation). </strong>}
                {productivity.insight}
              </p>
            )}
          </div>
        </div>

        <div className="dash-card" style={{ marginTop: 16 }}>
          <h3 className="dash-card-title">Recent alarms</h3>
          {sessions.length === 0 ? (
            <p className="insight-note">No alarms rung yet.</p>
          ) : (
            <div className="timeline">
              {sessions.map((s, i) => (
                <div className={`tl-item ${s.verified ? "tl-done" : "tl-open"}`} key={i}>
                  <div className="tl-title">
                    {s.alarm_label}
                    <span className={`status-pill ${s.verified ? "status-done" : "status-open"}`} style={{ marginLeft: 10 }}>
                      {s.verified ? "Completed" : "Incomplete"}
                    </span>
                  </div>
                  <div className="tl-meta">
                    {new Date(s.started_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })}
                    {" · "}<span style={{ textTransform: "capitalize" }}>{s.challenge_type.replace("_", " ")}</span>
                    {" · "}{s.attempts} attempt{s.attempts !== 1 ? "s" : ""}{" · "}{s.snooze_count} snooze{s.snooze_count !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
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