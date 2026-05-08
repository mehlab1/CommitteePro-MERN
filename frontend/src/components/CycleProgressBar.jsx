const CycleProgressBar = ({ current = 0, total = 1 }) => {
  const pct = total > 0 ? Math.min(100, Math.round((Number(current) / Number(total)) * 100)) : 0;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
        <span>Cycle Progress</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200">
        <div className="h-2 rounded-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export default CycleProgressBar;
