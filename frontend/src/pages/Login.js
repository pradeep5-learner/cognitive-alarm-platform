import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await api.post("/auth/login", { email, password });
    const token = res.data.access_token;

    localStorage.setItem("token", token);

    const profileRes = await api.get("/auth/profile");

    login(profileRes.data, token);
    navigate("/dashboard");
  } catch (err) {
  toast.error(err.response?.data?.detail || "Login failed");
} finally {
  setLoading(false);
}
};

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">⏰</div>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">Log in to manage your alarms</p>


        <form onSubmit={handleSubmit}>
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
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;