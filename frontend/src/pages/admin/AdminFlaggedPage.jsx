import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/admin/AdminSidebar";
import DataTable from "../../components/admin/DataTable";
import api from "../../services/api";

const AdminFlaggedPage = () => {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get("/admin/transactions/flagged");
      setTransactions(response?.data?.data || []);
    };
    load();
  }, []);

  const columns = [
    { key: "transactionId", label: "Transaction ID" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount", render: (row) => `PKR ${Number(row.amount || 0).toLocaleString()}` },
    {
      key: "suspiciousReasons",
      label: "Suspicious Reasons",
      render: (row) => (
        <div className="space-y-1 text-xs text-rose-700">
          {(row.suspiciousReasons || []).map((reason) => (
            <p key={reason}>- {reason}</p>
          ))}
        </div>
      ),
    },
    {
      key: "review",
      label: "Action",
      render: () => (
        <button type="button" className="text-xs text-indigo-700">
          Review
        </button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <AdminSidebar />
          <section>
            <h1 className="text-2xl font-bold text-gray-900">Admin Flagged Transactions</h1>
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

export default AdminFlaggedPage;
