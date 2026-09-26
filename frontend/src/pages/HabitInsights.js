import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";
import Navbar from "../components/Navbar";
import {
  getHabitScore, getHabitScoreHistory, getBehavioralAnalytics,
  getRecommendations, getDifficultyPrediction
} from "../services/habitService";

function HabitInsights() {
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [difficultyPred, setDifficultyPred] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [scoreRes, historyRes, analyticsRes, recsRes, diffRes] = await Promise.all([
          getHabitScore(),
          getHabitScoreHistory(),
          getBehavioralAnalytics(),
          getRecommendations(),
          getDifficultyPrediction(),
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
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-content"><p>Loading your insights...</p></div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Habit Insights 📊</h1>
          <p className="dashboard-subtitle">Your wake-up performance, powered by real behavioral data</p>
        </div>

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

        {difficultyPred && (
          <>
            <h2 className="section-heading">AI Difficulty Suggestion</h2>
            <div className="info-card" style={{ marginBottom: 28 }}>
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
    </div>
  );
}

export default HabitInsights;