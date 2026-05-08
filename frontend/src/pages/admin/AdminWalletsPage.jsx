import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/admin/AdminSidebar";
import DataTable from "../../components/admin/DataTable";
import api from "../../services/api";

const AdminWalletsPage = () => {
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    const load = async () => {
      const response = await api.get("/admin/wallets");
      setWallets(response?.data?.data || []);
    };
    load();
  }, []);

  const columns = [
    { key: "userName", label: "User Name", render: (row) => row.userId?.name || "-" },
    { key: "balance", label: "Balance", render: (row) => `PKR ${Number(row.balance || 0).toLocaleString()}` },
    { key: "status", label: "Status" },
    { key: "totalDeposits", label: "Total Deposits", render: (row) => `PKR ${Number(row.totalDeposits || 0).toLocaleString()}` },
    { key: "totalWithdrawals", label: "Total Withdrawals", render: (row) => `PKR ${Number(row.totalWithdrawals || 0).toLocaleString()}` },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <AdminSidebar />
          <section>
            <h1 className="text-2xl font-bold text-gray-900">Admin Wallets</h1>
            <div className="mt-4">
              <DataTable columns={columns} rows={wallets} />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminWalletsPage;
