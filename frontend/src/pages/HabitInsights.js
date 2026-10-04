import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import AppLayout from "../components/AppLayout";
import {
  getHabitScore, getHabitScoreHistory, getBehavioralAnalytics,
  getRecommendations, getDifficultyPrediction
} from "../services/habitService";
import { getProductivityCorrelation } from "../services/productivityService";
import { getChallengePerformance } from "../services/habitService";
import { getSleepPatterns } from "../services/habitService";
import { getDailyStreak } from "../services/habitService";
import { Flame } from "lucide-react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";


function HabitInsights() {
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [difficultyPred, setDifficultyPred] = useState(null);
  const [loading, setLoading] = useState(true);
  const [productivity, setProductivity] = useState(null);
  const [challengePerf, setChallengePerf] = useState(null);
  const [sleepPattern, setSleepPattern] = useState(null);
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [scoreRes, historyRes, analyticsRes, recsRes, diffRes, prodRes, perfRes, sleepRes, streakRes] = await Promise.all([
          getHabitScore(),
          getHabitScoreHistory(),
          getBehavioralAnalytics(),
          getRecommendations(),
          getDifficultyPrediction(),
          getProductivityCorrelation(),
          getChallengePerformance(),
          getSleepPatterns(),
          getDailyStreak(),
        ]);
        setScore(scoreRes.data);
        setHistory(
          historyRes.data.map((h, i) => ({
            index: i + 1,
            score: h.total_score,
            date: new Date(h.calculated_at).toLocaleDateString(),
          }))
        );
        setAnalytics(analyticsRes.data);
        setRecommendations(recsRes.data.recommendations);
        setDifficultyPred(diffRes.data);
        setProductivity(prodRes.data);
        setChallengePerf(perfRes.data.performance);
        setSleepPattern(sleepRes.data);
        setStreak(streakRes.data);
      } catch (err) {
        toast.error("Could not load habit insights");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <div className="dashboard-content"><p>Loading your insights...</p></div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Habit Insights 📊</h1>
          <p className="dashboard-subtitle">Your wake-up performance, powered by real behavioral data</p>
        </div>
        
        {streak && (
          <div className="streak-hero">
            <div className="streak-hero-main">
              <span className="streak-hero-fire">
  <Flame size={30} color="#FF9E5E" fill="#FF9E5E" strokeWidth={1.5} />
</span>
              <div>
                <div className="streak-hero-number">{streak.current_streak}</div>
                <div className="streak-hero-label">day streak</div>
              </div>
            </div>
            <div className="streak-hero-best">
              Longest streak: <strong>{streak.longest_streak} days</strong>
            </div>
          </div>
        )}

        {score && (
          <div className="habit-score-hero">
            <div className="habit-score-ring" style={{ "--pct": score.total_score }}>
              <div className="habit-score-number">{Math.round(score.total_score)}</div>
              <div className="habit-score-label">Habit Score</div>
            </div>
            <div className="habit-score-breakdown">
              <div className="habit-score-bar-row">
                <span>Wake-Up Consistency</span>
                <div className="habit-score-bar-track">
                  <div className="habit-score-bar-fill" style={{ width: `${score.wake_consistency_score}%` }} />
                </div>
                <span>{score.wake_consistency_score}%</span>
              </div>
              <div className="habit-score-bar-row">
                <span>Challenge Completion</span>
                <div className="habit-score-bar-track">
                  <div className="habit-score-bar-fill" style={{ width: `${score.challenge_completion_score}%` }} />
                </div>
                <span>{score.challenge_completion_score}%</span>
              </div>
              <div className="habit-score-bar-row">
                <span>Snooze Reduction</span>
                <div className="habit-score-bar-track">
                  <div className="habit-score-bar-fill" style={{ width: `${score.snooze_reduction_score}%` }} />
                </div>
                <span>{score.snooze_reduction_score}%</span>
              </div>
              <div className="habit-score-bar-row">
                <span>Sleep Schedule Adherence</span>
                <div className="habit-score-bar-track">
                  <div className="habit-score-bar-fill" style={{ width: `${score.sleep_adherence_score}%` }} />
                </div>
                <span>{score.sleep_adherence_score}%</span>
              </div>
              <div className="habit-score-bar-row">
                <span>Productivity</span>
                <div className="habit-score-bar-track">
                  <div className="habit-score-bar-fill" style={{ width: `${score.productivity_score}%` }} />
                </div>
                <span>{score.productivity_score}%</span>
              </div>
            </div>
          </div>
        )}

        {history.length > 1 && (
          <>
            <h2 className="section-heading">Habit Score Trend</h2>
            <div className="chart-card">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
                  <XAxis dataKey="index" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {analytics && analytics.day_of_week_breakdown.length > 0 && (
          <>
            <h2 className="section-heading">Snoozes by Day of Week</h2>
            <div className="chart-card">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={analytics.day_of_week_breakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="avg_snoozes" fill="#F97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {sleepPattern && sleepPattern.category !== "not_set" && (
  <>
    <h2 className="section-heading">Sleep Pattern Insight</h2>
    <div className="info-card" style={{ marginBottom: 28 }}>
      <div className="info-card-label">
        {sleepPattern.sleep_duration_hours}h planned sleep · <span style={{ textTransform: "capitalize" }}>{sleepPattern.category}</span>
      </div>
      <div style={{ fontSize: 14, color: "var(--text-dark)", marginTop: 8, lineHeight: 1.5 }}>
        {sleepPattern.insight}
      </div>
    </div>
  </>
)}

        {productivity && productivity.daily_points.length >= 3 && (
  <>
    <h2 className="section-heading">Wake-Up Quality vs. Productivity</h2>
    <div className="chart-card">
      <div className="correlation-summary">
        <div>
          <span className="correlation-value">{productivity.correlation}</span>
          <span className="correlation-strength">{productivity.strength} correlation</span>
        </div>
        <p className="correlation-insight">{productivity.insight}</p>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={productivity.daily_points}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EEF2FF" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="wake_quality" stroke="#4F46E5" strokeWidth={2} dot={{ r: 2 }} name="Wake Quality" />
          <Line type="monotone" dataKey="productivity" stroke="#F97316" strokeWidth={2} dot={{ r: 2 }} name="Productivity" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </>
)}

        {difficultyPred && (
  <>
    <h2 className="section-heading">AI Difficulty Suggestion</h2>
    <div className="info-card" style={{ marginBottom: 14 }}>
      <div className="info-card-label">
        {difficultyPred.is_ml_prediction ? "Based on your recent performance" : "Default (not enough history yet)"}
      </div>
      <div className="info-card-value" style={{ textTransform: "capitalize" }}>
        {difficultyPred.recommended_difficulty}
        {difficultyPred.is_ml_prediction && (
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 500, marginLeft: 10 }}>
            {difficultyPred.confidence}% confidence
          </span>
        )}
      </div>
    </div>
    {difficultyPred.trend !== "insufficient_data" && (
      <div className={`trend-badge trend-${difficultyPred.trend}`} style={{ marginBottom: 28 }}>
        <span className="trend-icon" style={{ display: "inline-flex" }}>
  {difficultyPred.trend === "improving" ? <TrendingUp size={16} /> : difficultyPred.trend === "declining" ? <TrendingDown size={16} /> : <Minus size={16} />}
</span>
        <span>{difficultyPred.trend_message}</span>
      </div>
    )}
  </>
)}

        {challengePerf && (
          <>
            <h2 className="section-heading">Challenge Type Performance</h2>
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

        <h2 className="section-heading">Recommendations</h2>
        <div className="recs-list">
          {recommendations.map((rec, i) => (
            <div className={`rec-card rec-${rec.priority}`} key={i}>
              <div className="rec-title">{rec.title}</div>
              <div className="rec-message">{rec.message}</div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

export default HabitInsights;