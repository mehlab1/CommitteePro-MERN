const TrustScoreBadge = ({ score = 0 }) => {
  const safeScore = Number(score) || 0;
  const colorClass =
    safeScore >= 75
      ? "bg-emerald-500"
      : safeScore >= 50
        ? "bg-amber-500"
        : "bg-rose-500";

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white ${colorClass}`}>
        {Math.round(safeScore)}
      </span>
      <span className="text-sm text-gray-700">Trust Score</span>
    </div>
  );
};

export default TrustScoreBadge;
