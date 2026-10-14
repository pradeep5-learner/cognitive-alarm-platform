import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../services/api";
import RoleSelector from "../components/RoleSelector";
import { getErrorMessage } from "../utils/errorMessage";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [adminCode, setAdminCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { name, email, password, role };
      if (role === "admin") payload.admin_code = adminCode;
      await api.post("/auth/register", payload);
      toast.success("Account created. Please log in.");
      navigate("/login");
    } catch (err) {
      toast.error(getErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-visual">
        <div className="auth-visual-arc" />
        <p className="auth-visual-quote">
          Waking up is a skill. Build it one honest morning at a time.
        </p>
        <p className="auth-visual-sub">Cognitive Alarm Platform</p>
      </div>
      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-logo">
            <span className="auth-logo-mark" />
            <span className="auth-logo-text">Dawn</span>
          </div>
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Choose how you'll use the platform</p>

          <form onSubmit={handleSubmit}>
            <label className="form-label">I am a</label>
            <RoleSelector value={role} onChange={setRole} />

            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>
            {role === "admin" && (
              <div className="form-group">
                <label className="form-label">Admin code</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Required to register as admin"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                  required
                />
              </div>
            )}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;