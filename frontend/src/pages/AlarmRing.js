import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { startWakeUp, submitWakeUpAnswer, snoozeWakeUp, timeoutWakeUp } from "../services/wakeupService";

function AlarmRing() {
  const { alarmId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [snoozeCount, setSnoozeCount] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [wrongShake, setWrongShake] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showMemorySequence, setShowMemorySequence] = useState(true);
  const [timeLeft, setTimeLeft] = useState(null);
  const timerRef = useRef(null);

  const handleTimeout = useCallback(async (logId) => {
    try {
      await timeoutWakeUp(logId);
      toast.error("Time's up! Streak reset.");
      setAnswer("");
      beginSession();
    } catch (err) {
      toast.error("Something went wrong");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const beginSession = async () => {
    setLoading(true);
    clearInterval(timerRef.current);
    try {
      const res = await startWakeUp(alarmId);
      setSession(res.data);
      setAnswer("");
      setShowMemorySequence(true);
      setTimeLeft(res.data.time_limit_seconds);

      if (res.data.challenge_type === "memory") {
        setTimeout(() => setShowMemorySequence(false), 4000);
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeout(res.data.wakeup_log_id);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error("Could not start alarm challenge");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    beginSession();
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarmId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await submitWakeUpAnswer(session.wakeup_log_id, answer);
      setAttempts(res.data.attempts);

      if (res.data.alarm_dismissed) {
        clearInterval(timerRef.current);
        setDismissed(true);
        toast.success("Alarm dismissed — you're fully awake! 🎉");
      } else if (res.data.is_correct) {
        toast.success(`Correct! Streak: ${res.data.correct_streak}/${res.data.required_streak} — one more!`);
        beginSession();
      } else {
        setWrongShake(true);
        toast.error("Not quite — streak reset, try again");
        setAnswer("");
        setTimeout(() => setWrongShake(false), 400);
      }
    } catch (err) {
      toast.error("Something went wrong");
    }
  };

  const handleSnooze = async () => {
    try {
      const res = await snoozeWakeUp(session.wakeup_log_id);
      setSnoozeCount(res.data.snooze_count);
      toast.info("Snoozed — a new challenge will appear");
      beginSession();
    } catch (err) {
      toast.error("Could not snooze");
    }
  };

  if (loading) {
    return <div className="ring-page"><p className="ring-loading">Loading challenge...</p></div>;
  }

  if (dismissed) {
    return (
      <div className="ring-page">
        <div className="ring-card ring-success">
          <div className="ring-success-icon">✅</div>
          <h2>You're awake!</h2>
          <p>Solved in {attempts} attempt{attempts !== 1 ? "s" : ""}, after {snoozeCount} snooze{snoozeCount !== 1 ? "s" : ""}.</p>
          <button className="btn-primary" style={{ width: "auto", padding: "12px 28px" }} onClick={() => navigate("/alarms")}>
            Back to Alarms
          </button>
        </div>
      </div>
    );
  }

  const timerPercent = session ? (timeLeft / session.time_limit_seconds) * 100 : 100;
  const timerLow = timeLeft <= 5;

  return (
    <div className="ring-page">
      <div className={`ring-card ${wrongShake ? "ring-shake" : ""}`}>
        <div className="ring-time">⏰ Alarm Ringing</div>

        <div className="streak-row">
          {Array.from({ length: session.required_streak }).map((_, i) => (
            <div
              key={i}
              className={`streak-dot ${i < session.correct_streak ? "streak-dot-filled" : ""}`}
            />
          ))}
          <span className="streak-label">{session.correct_streak}/{session.required_streak} correct in a row</span>
        </div>

        <div className={`timer-bar-track`}>
          <div
            className={`timer-bar-fill ${timerLow ? "timer-bar-low" : ""}`}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
        <div className={`timer-text ${timerLow ? "timer-text-low" : ""}`}>{timeLeft}s remaining</div>

        <div className="ring-badge">{session.challenge_type} · {session.difficulty}</div>
        <h2 className="ring-question">
          {session.challenge_type === "memory" && !showMemorySequence
            ? "Now type the sequence you saw:"
            : session.question}
        </h2>

        <form onSubmit={handleSubmit}>
          <input
            className="form-input ring-input"
            type="text"
            placeholder="Your answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            autoFocus
            required
          />
          <button className="btn-primary" type="submit">Submit Answer</button>
        </form>

        <button className="btn-snooze" onClick={handleSnooze}>
          😴 Snooze (new challenge)
        </button>

        {attempts > 0 && (
          <p className="ring-attempts">Attempts so far: {attempts}</p>
        )}
      </div>
    </div>
  );
}

export default AlarmRing;