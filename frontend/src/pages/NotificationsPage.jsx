import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";

const iconMap = {
  transaction: "💸",
  budget: "📊",
  security: "🛡️",
  account: "👤",
  system: "⚙️",
  committee: "👥",
  bid: "🏷️",
};

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/notifications");
      setNotifications(response?.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="page-transition mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <button
            className="rounded border border-gray-300 px-3 py-2 text-sm"
            onClick={async () => {
              await api.patch("/notifications/read-all");
              await load();
            }}
          >
            Mark all as read
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {loading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                  <LoadingSkeleton className="h-4 w-44" />
                  <LoadingSkeleton className="mt-2 h-3 w-full" />
                </div>
              ))
            : notifications.map((notification) => (
            <button
              key={notification._id}
              type="button"
              className={`w-full rounded-xl p-4 text-left shadow-sm ring-1 ${
                notification.readStatus
                  ? "bg-white ring-gray-200"
                  : "bg-indigo-50 ring-indigo-200"
              }`}
              onClick={async () => {
                if (!notification.readStatus) {
                  await api.patch(`/notifications/${notification._id}/read`);
                  await load();
                }
              }}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">
                  {iconMap[notification.type] || "🔔"} {notification.title}
                </p>
                {!notification.readStatus ? (
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">Unread</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
            </button>
              ))}
          {!loading && notifications.length === 0 ? (
            <EmptyState
              title="No notifications"
              description="You are all caught up."
            />
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
