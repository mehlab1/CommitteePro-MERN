import { useEffect, useMemo, useState } from "react";

const BiddingTimer = ({ targetDate }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const text = useMemo(() => {
    if (!targetDate) return "No bidding deadline";
    const diff = new Date(targetDate).getTime() - now;
    if (diff <= 0) return "Bidding closed";
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }, [targetDate, now]);

  return <div className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">{text}</div>;
};

export default BiddingTimer;
