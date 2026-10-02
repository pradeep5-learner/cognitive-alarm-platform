import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { getAlarms } from "../services/alarmService";
import { getAnalytics } from "../services/wakeupService";
import { getDifficultyPrediction } from "../services/habitService";
import { logProductivity } from "../services/productivityService";
import { toast } from "react-toastify";
import { getEngagementStatus } from "../services/habitService";

function Dashboard() {
  const { user } = useAuth();
  const [totalAlarms, setTotalAlarms] = useState(0);
  const [activeAlarms, setActiveAlarms] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [aiDifficulty, setAiDifficulty] = useState(null);
  const [productivityRating, setProductivityRating] = useState(null);
  const [savingRating, setSavingRating] = useState(false);
  const [engagement, setEngagement] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      const alarmsRes = await getAlarms();
      setTotalAlarms(alarmsRes.data.length);
      setActiveAlarms(alarmsRes.data.filter((a) => a.is_active).length);

      try {
        const analyticsRes = await getAnalytics();
        setAnalytics(analyticsRes.data);
      } catch (err) {
        setAnalytics(null);
      }

      try {
      const diffRes = await getDifficultyPrediction();
      setAiDifficulty(diffRes.data);
      } catch (err) {
      setAiDifficulty(null);
      }

      try {
        const engagementRes = await getEngagementStatus();
        setEngagement(engagementRes.data);
      } catch (err) {
        setEngagement(null);
      }
    };
    loadStats();
  }, []);

  const handleRateProductivity = async (rating) => {
    setSavingRating(true);
    try {
      await logProductivity(rating);
      setProductivityRating(rating);
      toast.success("Thanks! Today's productivity logged.");
    } catch (err) {
      toast.error("Could not save rating");
    } finally {
      setSavingRating(false);
    }
  };

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome, {user?.name} 👋</h1>
          <p className="dashboard-subtitle">Here's your account overview</p>
        </div>

        {engagement && engagement.disengaging && (
          <div className="engagement-banner">
            <span className="engagement-icon">💪</span>
            <div>
              <div className="engagement-title">We've eased things up for you</div>
              <div className="engagement-text">
                Your recent completion rate is {engagement.recent_completion_rate}%. Your next alarms will be a bit easier to help you build momentum.
              </div>
            </div>
          </div>
        )}

        <div className="card-grid">
          <div className="info-card">
            <div className="info-card-label">Total Alarms</div>
            <div className="info-card-value">{totalAlarms}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">Active Alarms</div>
            <div className="info-card-value">{activeAlarms}</div>
          </div>
          <div className="info-card">
            <div className="info-card-label">Role</div>
            <div className="info-card-value">{user?.role}</div>
          </div>
          <div className="info-card">
            <div className="info-card-value">{user?.difficulty_preference || "Not set"}</div>
            <div className="info-card-label">Profile Setting</div>
          </div>
          {aiDifficulty && (
            <div className="info-card">
              <div className="info-card-label">
                {aiDifficulty.is_ml_prediction ? "AI-Adjusted Difficulty" : "AI (needs more data)"}
              </div>
              <div className="info-card-value" style={{ textTransform: "capitalize" }}>
                {aiDifficulty.recommended_difficulty}
                {aiDifficulty.is_ml_prediction && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, marginLeft: 6 }}>
                    ({aiDifficulty.confidence}%)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {analytics && analytics.total_sessions > 0 && (
          <>
            <h2 className="section-heading">Wake-Up Performance</h2>
            <div className="card-grid">
              <div className="info-card">
                <div className="info-card-label">Completion Rate</div>
                <div className="info-card-value">{analytics.completion_rate}%</div>
              </div>
              <div className="info-card">
                <div className="info-card-label">First-Try Accuracy</div>
                <div className="info-card-value">{analytics.first_try_accuracy}%</div>
              </div>
              <div className="info-card">
                <div className="info-card-label">Avg. Attempts</div>
                <div className="info-card-value">{analytics.average_attempts}</div>
              </div>
              <div className="info-card">
                <div className="info-card-label">Total Snoozes</div>
                <div className="info-card-value">{analytics.total_snoozes}</div>
              </div>
            </div>
          </>
        )}
        
        <div className="productivity-widget">
  <div className="productivity-widget-label">How productive was your day?</div>
  <div className="productivity-scale">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        className={`productivity-btn ${productivityRating === n ? "productivity-btn-active" : ""}`}
        onClick={() => handleRateProductivity(n)}
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
</div>


        {user?.role === "admin" && (
          <div className="admin-panel">
            <div className="admin-panel-title">🔐 Admin Panel</div>
            <p className="admin-panel-text">
              You're viewing this because your account role is "admin". Regular users never see this section.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;