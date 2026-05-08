import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/admin/AdminSidebar";
import DataTable from "../../components/admin/DataTable";
import api from "../../services/api";

const AdminTransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState({
    type: "",
    status: "",
    category: "",
    fromDate: "",
    toDate: "",
    suspiciousFlag: false,
  });

  const load = async () => {
    const params = {};
    Object.entries(query).forEach(([key, value]) => {
      if (value !== "" && value !== false) params[key] = value;
      if (key === "suspiciousFlag" && value) params.suspiciousFlag = true;
    });
    const response = await api.get("/admin/transactions", { params });
    setTransactions(response?.data?.data?.transactions || []);
  };

  useEffect(() => {
    load();
  }, []);

  const columns = [
    { key: "transactionId", label: "Transaction ID" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount", render: (row) => `PKR ${Number(row.amount || 0).toLocaleString()}` },
    { key: "sender", label: "Sender", render: (row) => row.senderId?.name || "-" },
    { key: "receiver", label: "Receiver", render: (row) => row.receiverId?.name || "-" },
    { key: "status", label: "Status" },
    { key: "createdAt", label: "Date", render: (row) => new Date(row.createdAt).toLocaleString() },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="page-transition mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <AdminSidebar />
          <section>
            <h1 className="text-2xl font-bold text-gray-900">Admin Transactions</h1>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
              <label className="text-sm text-gray-700"><span className="mb-1 block">Type</span><input className="w-full rounded border p-2" placeholder="Type" value={query.type} onChange={(e) => setQuery((p) => ({ ...p, type: e.target.value }))} /></label>
              <label className="text-sm text-gray-700"><span className="mb-1 block">Status</span><input className="w-full rounded border p-2" placeholder="Status" value={query.status} onChange={(e) => setQuery((p) => ({ ...p, status: e.target.value }))} /></label>
              <label className="text-sm text-gray-700"><span className="mb-1 block">Category</span><input className="w-full rounded border p-2" placeholder="Category" value={query.category} onChange={(e) => setQuery((p) => ({ ...p, category: e.target.value }))} /></label>
              <label className="flex items-center gap-2 rounded border px-3 py-2 text-sm">
                <input type="checkbox" checked={query.suspiciousFlag} onChange={(e) => setQuery((p) => ({ ...p, suspiciousFlag: e.target.checked }))} />
                Suspicious Only
              </label>
              <label className="text-sm text-gray-700"><span className="mb-1 block">From date</span><input className="w-full rounded border p-2" type="date" value={query.fromDate} onChange={(e) => setQuery((p) => ({ ...p, fromDate: e.target.value }))} /></label>
              <label className="text-sm text-gray-700"><span className="mb-1 block">To date</span><input className="w-full rounded border p-2" type="date" value={query.toDate} onChange={(e) => setQuery((p) => ({ ...p, toDate: e.target.value }))} /></label>
              <button onClick={load} className="rounded bg-indigo-600 px-3 py-2 text-sm text-white">
                Apply Filters
              </button>
            </div>
            <div className="mt-4">
              <DataTable columns={columns} rows={transactions} />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminTransactionsPage;
