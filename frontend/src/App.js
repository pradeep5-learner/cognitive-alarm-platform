import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AlarmWatcher from "./components/AlarmWatcher";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Alarms from "./pages/Alarms";
import Profile from "./pages/Profile";
import AlarmRing from "./pages/AlarmRing";
import HabitInsights from "./pages/HabitInsights";
import Admin from "./pages/Admin";
import CoachDashboard from "./pages/CoachDashboard";
import CoachUserDetail from "./pages/CoachUserDetail";

const MEMBER = ["user", "admin"];
const COACH = ["wellness_coach"];
const ADMIN = ["admin"];

function App() {
  useEffect(() => {
    const unlockAudio = () => {
      const testAudio = new Audio();
      testAudio.play().catch(() => {});
      document.removeEventListener("click", unlockAudio);
    };
    document.addEventListener("click", unlockAudio);
    return () => document.removeEventListener("click", unlockAudio);
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ToastContainer position="top-right" autoClose={3000} />
        <AlarmWatcher />
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          <Route path="/dashboard" element={<ProtectedRoute roles={MEMBER}><Dashboard /></ProtectedRoute>} />
          <Route path="/alarms" element={<ProtectedRoute roles={MEMBER}><Alarms /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute roles={MEMBER}><Profile /></ProtectedRoute>} />
          <Route path="/insights" element={<ProtectedRoute roles={MEMBER}><HabitInsights /></ProtectedRoute>} />
          <Route path="/alarm-ring/:alarmId" element={<ProtectedRoute roles={MEMBER}><AlarmRing /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute roles={ADMIN}><Admin /></ProtectedRoute>} />

          <Route path="/coach-dashboard" element={<ProtectedRoute roles={COACH}><CoachDashboard /></ProtectedRoute>} />
          <Route path="/coach-dashboard/users/:userId" element={<ProtectedRoute roles={COACH}><CoachUserDetail /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;