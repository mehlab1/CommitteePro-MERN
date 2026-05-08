import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

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

  const load = async () => {
    const response = await api.get("/notifications");
    setNotifications(response?.data?.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
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
          {notifications.map((notification) => (
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
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default NotificationsPage;
