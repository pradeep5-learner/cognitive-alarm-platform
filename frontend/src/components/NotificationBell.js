import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { getNotifications, getUnreadCount, markAsRead, markAllRead } from "../services/notificationService";

const typeIcons = {
  bedtime: "🌙",
  wakeup: "⏰",
  habit_alert: "⚠️",
  challenge: "🧩",
  progress: "🎉",
  announcement: "📣",
};

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  const loadUnread = async () => {
    try {
      const res = await getUnreadCount();
      setUnreadCount(res.data.unread_count);
    } catch (err) {}
  };

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
      loadUnread();
    } catch (err) {}
  };

  useEffect(() => {
    loadUnread();
    const interval = setInterval(loadUnread, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!open) loadNotifications();
    setOpen(!open);
  };

  const handleMarkOne = async (id) => {
    await markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    loadUnread();
  };

  const handleMarkAll = async () => {
    await markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="notif-bell-wrap" ref={ref}>
      <button className="notif-bell-btn" onClick={handleToggle}>
        <Bell size={19} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAll}>Mark all read</button>
            )}
          </div>
          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">Nothing new right now.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${!n.is_read ? "unread" : ""}`}
                  onClick={() => !n.is_read && handleMarkOne(n.id)}
                >
                  <span className="notif-item-icon">{typeIcons[n.notif_type] || "🔔"}</span>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-message">{n.message}</div>
                    <div className="notif-item-time">{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && <span className="notif-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;