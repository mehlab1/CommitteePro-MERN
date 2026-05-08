import { useMemo, useState } from "react";

const DataTable = ({ columns = [], rows = [], rowClassName, onRowClick, emptyText = "No data found" }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  const sortedRows = useMemo(() => {
    if (!sortConfig.key) return rows;
    const clone = [...rows];
    clone.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return sortConfig.direction === "asc" ? -1 : 1;
    });
    return clone;
  }, [rows, sortConfig]);

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            {columns.map((column) => (
              <th key={column.key} className="px-3 py-2 font-medium text-gray-700">
                <button
                  type="button"
                  onClick={() =>
                    setSortConfig((prev) => ({
                      key: column.key,
                      direction:
                        prev.key === column.key && prev.direction === "asc" ? "desc" : "asc",
                    }))
                  }
                  className="inline-flex items-center gap-1"
                >
                  {column.label}
                  {sortConfig.key === column.key ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedRows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-center text-gray-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            sortedRows.map((row, index) => (
              <tr
                key={row._id || index}
                className={`border-b last:border-none ${onRowClick ? "cursor-pointer hover:bg-gray-50" : ""} ${rowClassName ? rowClassName(row) : ""}`}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <td key={`${column.key}-${row._id || index}`} className="px-3 py-2">
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
