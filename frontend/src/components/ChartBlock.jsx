const ChartBlock = ({ title, children, actions }) => {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {actions ? <div>{actions}</div> : null}
      </div>
      <div className="min-h-[220px]">{children}</div>
    </div>
  );
};

export default ChartBlock;
