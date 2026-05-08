const PaymentHistoryTable = ({ rows = [], onExportCsv }) => {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select className="rounded border p-2 text-sm"><option>Type</option></select>
        <select className="rounded border p-2 text-sm"><option>Cycle</option></select>
        <input type="date" className="rounded border p-2 text-sm" />
        <button
          type="button"
          onClick={onExportCsv}
          className="rounded border border-gray-300 px-3 py-2 text-sm"
        >
          Export CSV
        </button>
      </div>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Type</th>
            <th>Cycle</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row._id || index} className="border-b last:border-none">
              <td className="py-2">{row.type || "-"}</td>
              <td>{row.cycleNumber || "-"}</td>
              <td>PKR {Number(row.amount || 0).toLocaleString()}</td>
              <td>{row.status || "-"}</td>
              <td>{row.date ? new Date(row.date).toLocaleDateString() : "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PaymentHistoryTable;
