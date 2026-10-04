import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../components/AppLayout";
import { getAlarms } from "../services/alarmService";
import { getAnalytics } from "../services/wakeupService";
import { getDifficultyPrediction } from "../services/habitService";
import { toast } from "react-toastify";
import { getEngagementStatus } from "../services/habitService";
import { getDailyStreak } from "../services/habitService";
import { Flame } from "lucide-react";
import { Hand } from "lucide-react";
import { ShieldCheck } from "lucide-react";
import { Sparkles } from "lucide-react";
import { logProductivity, getProductivityHistory } from "../services/productivityService";

function Dashboard() {
  const { user } = useAuth();
  const [totalAlarms, setTotalAlarms] = useState(0);
  const [activeAlarms, setActiveAlarms] = useState(0);
  const [analytics, setAnalytics] = useState(null);
  const [aiDifficulty, setAiDifficulty] = useState(null);
  const [productivityRating, setProductivityRating] = useState(null);
  const [savingRating, setSavingRating] = useState(false);
  const [engagement, setEngagement] = useState(null);
  const [streak, setStreak] = useState(null);

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

      try {
        const streakRes = await getDailyStreak();
        setStreak(streakRes.data);
      } catch (err) {
        setStreak(null);
      }

      try {
  const historyRes = await getProductivityHistory();
  const today = new Date().toISOString().split("T")[0];
  const todayEntry = historyRes.data.find((h) => h.log_date === today);
  if (todayEntry) {
    setProductivityRating(todayEntry.rating);
  }
} catch (err) {
  // silently skip
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
    <AppLayout>
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
  Welcome, {user?.name} <Hand size={26} color="#FFB648" strokeWidth={2} />
</h1>
          <p className="dashboard-subtitle">Here's your account overview</p>
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

        <div className="card-grid">
  <div className="info-card">
    <div className="info-card-icon">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2" /><path d="M5 3 2 6M19 3l3 3" /></svg>
    </div>
    <div className="info-card-label">Total Alarms</div>
    <div className="info-card-value">{totalAlarms}</div>
  </div>
  <div className="info-card">
    <div className="info-card-icon">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
    </div>
    <div className="info-card-label">Active Alarms</div>
    <div className="info-card-value">{activeAlarms}</div>
  </div>
  <div className="info-card">
    <div className="info-card-icon">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
    </div>
    <div className="info-card-label">Role</div>
    <div className="info-card-value">{user?.role}</div>
  </div>
  <div className="info-card">
    <div className="info-card-icon">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" /></svg>
    </div>
    <div className="info-card-label">Profile Setting</div>
    <div className="info-card-value">{user?.difficulty_preference || "Not set"}</div>
  </div>
  {aiDifficulty && (
    <div className="info-card">
      <div className="info-card-icon">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 00-4 12.7V17a1 1 0 001 1h6a1 1 0 001-1v-2.3A7 7 0 0012 2z" /><path d="M9 21h6" /></svg>
      </div>
      <div className="info-card-label">
        {aiDifficulty.is_ml_prediction ? "AI-Adjusted Difficulty" : "AI (needs more data)"}
      </div>
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
  {streak && (
    <div className="info-card">
      <div className="info-card-icon">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2c1 4-3 5-3 9a3 3 0 006 0c0-1.5-1-2-1-3 2 1 3 3 3 5a5 5 0 01-10 0c0-5 3-6 5-11z" /></svg>
      </div>
      <div className="info-card-label">Daily Streak</div>
      <div className="info-card-value">
        <span className="streak-flame" style={{ display: "inline-flex", verticalAlign: "-3px", marginRight: 3 }}>
  <Flame size={16} color="#FF9E5E" fill="#FF9E5E" strokeWidth={1.5} />
</span>
{streak.current_streak} {streak.current_streak === 1 ? "day" : "days"}
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