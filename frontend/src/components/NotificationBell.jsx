import { Link } from "react-router-dom";

const NotificationBell = ({ unreadCount = 0, to = "/notifications" }) => {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700"
      aria-label={`Notifications (${unreadCount} unread)`}
    >
      <span>🔔</span>
      <span className="font-medium">{unreadCount}</span>
    </Link>
  );
};

export default NotificationBell;
