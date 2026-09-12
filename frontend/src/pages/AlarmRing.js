import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { startWakeUp, submitWakeUpAnswer, snoozeWakeUp } from "../services/wakeupService";

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

  const beginSession = async () => {
    setLoading(true);
    try {
      const res = await startWakeUp(alarmId);
      setSession(res.data);
      setAnswer("");
    } catch (err) {
      toast.error("Could not start alarm challenge");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    beginSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alarmId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await submitWakeUpAnswer(session.wakeup_log_id, answer);
      setAttempts(res.data.attempts);

      if (res.data.is_correct) {
        setDismissed(true);
        toast.success("Alarm dismissed — you're awake! 🎉");
      } else {
        setWrongShake(true);
        toast.error("Not quite — try again");
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

  return (
    <div className="ring-page">
      <div className={`ring-card ${wrongShake ? "ring-shake" : ""}`}>
        <div className="ring-time">⏰ Alarm Ringing</div>
        <div className="ring-badge">{session.challenge_type} · {session.difficulty}</div>
        <h2 className="ring-question">{session.question}</h2>

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