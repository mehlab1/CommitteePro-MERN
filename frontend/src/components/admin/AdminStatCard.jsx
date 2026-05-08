const AdminStatCard = ({ title, value, accent = "indigo", subtitle }) => {
  const accentClass =
    accent === "emerald"
      ? "text-emerald-700 bg-emerald-50"
      : accent === "rose"
        ? "text-rose-700 bg-rose-50"
        : accent === "amber"
          ? "text-amber-700 bg-amber-50"
          : "text-indigo-700 bg-indigo-50";

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <p className="text-xs text-gray-500">{title}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${accentClass}`}>●</span>
      </div>
      {subtitle ? <p className="mt-1 text-xs text-gray-500">{subtitle}</p> : null}
    </div>
  );
};

export default AdminStatCard;
