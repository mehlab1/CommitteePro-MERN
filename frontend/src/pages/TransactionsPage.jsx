import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";

const badgeClass = {
  successful: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700",
  pending: "bg-amber-100 text-amber-700",
  flagged: "bg-violet-100 text-violet-700",
};

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState({ type: "", status: "", search: "" });
  const navigate = useNavigate();

  const load = async () => {
    const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value));
    setLoading(true);
    try {
      const response = await api.get("/transactions", { params });
      setTransactions(response?.data?.data?.transactions || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!query.search) return transactions;
    return transactions.filter((transaction) =>
      String(transaction.transactionId || "").toLowerCase().includes(query.search.toLowerCase())
    );
  }, [transactions, query.search]);

  const exportCsv = () => {
    const header = ["Date", "Type", "Amount", "Status", "Reference ID"];
    const rows = filtered.map((transaction) => [
      new Date(transaction.createdAt).toISOString(),
      transaction.type,
      transaction.amount,
      transaction.status,
      transaction.transactionId,
    ]);
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="page-transition mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <button onClick={exportCsv} className="rounded border border-gray-300 px-3 py-2 text-sm">
            Export CSV
          </button>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <label className="text-sm text-gray-700">
            <span className="mb-1 block">Type</span>
            <select className="w-full rounded border p-2" value={query.type} onChange={(e) => setQuery((p) => ({ ...p, type: e.target.value }))}>
              <option value="">All types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
              <option value="contribution">Contribution</option>
              <option value="payout">Payout</option>
            </select>
          </label>
          <label className="text-sm text-gray-700">
            <span className="mb-1 block">Status</span>
            <select className="w-full rounded border p-2" value={query.status} onChange={(e) => setQuery((p) => ({ ...p, status: e.target.value }))}>
              <option value="">All status</option>
              <option value="successful">Successful</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="flagged">Flagged</option>
            </select>
          </label>
          <label className="text-sm text-gray-700">
            <span className="mb-1 block">Search transaction ID</span>
            <input
              className="w-full rounded border p-2"
              placeholder="Search transaction ID"
              value={query.search}
              onChange={(e) => setQuery((p) => ({ ...p, search: e.target.value }))}
            />
          </label>
        </div>

        <button onClick={load} className="mt-2 rounded bg-indigo-600 px-3 py-1.5 text-sm text-white">
          Apply Filters
        </button>

        <div className="mt-4 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Reference ID</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`sk-${idx}`} className="border-b">
                      <td className="px-3 py-2"><LoadingSkeleton className="h-4 w-32" /></td>
                      <td className="px-3 py-2"><LoadingSkeleton className="h-4 w-20" /></td>
                      <td className="px-3 py-2"><LoadingSkeleton className="h-4 w-24" /></td>
                      <td className="px-3 py-2"><LoadingSkeleton className="h-4 w-16" /></td>
                      <td className="px-3 py-2"><LoadingSkeleton className="h-4 w-28" /></td>
                    </tr>
                  ))
                : filtered.map((transaction) => (
                <tr
                  key={transaction._id}
                  className="cursor-pointer border-b last:border-none hover:bg-gray-50"
                  onClick={() => navigate(`/transactions/${transaction._id}/receipt`)}
                >
                  <td className="px-3 py-2">{new Date(transaction.createdAt).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-700">
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-3 py-2">PKR {Number(transaction.amount).toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs ${badgeClass[transaction.status] || "bg-slate-100 text-slate-700"}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-3 py-2">{transaction.transactionId}</td>
                </tr>
                  ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No transactions yet"
                description="Transactions will appear once you deposit, transfer, or receive payouts."
              />
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TransactionsPage;
