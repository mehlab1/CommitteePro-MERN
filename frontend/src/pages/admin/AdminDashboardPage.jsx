import { useEffect, useState } from "react";
import { Bar, Line, Pie } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  BarElement,
  PointElement,
  Title,
  Tooltip,
  ArcElement,
} from "chart.js";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChartBlock from "../../components/ChartBlock";
import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminStatCard from "../../components/admin/AdminStatCard";
import api from "../../services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [userTrend, setUserTrend] = useState([]);
  const [txVolume, setTxVolume] = useState([]);
  const [committeeStatus, setCommitteeStatus] = useState({ active: 0, pending: 0, paused: 0, completed: 0 });

  useEffect(() => {
    const load = async () => {
      const [dashboardRes, usersRes, txVolumeRes, committeesRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/users?limit=200"),
        api.get("/admin/reports/transaction-volume?groupBy=month"),
        api.get("/admin/transactions?limit=200"),
      ]);

      const dashboard = dashboardRes?.data?.data || {};
      setStats(dashboard);
      setTxVolume(txVolumeRes?.data?.data?.report || []);

      const users = usersRes?.data?.data?.users || [];
      const groupedUsers = users.reduce((acc, user) => {
        const label = new Date(user.createdAt).toISOString().slice(0, 7);
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {});
      setUserTrend(Object.entries(groupedUsers).map(([label, count]) => ({ label, count })).sort((a, b) => a.label.localeCompare(b.label)));

      const transactions = committeesRes?.data?.data?.transactions || [];
      const status = { active: 0, pending: 0, paused: 0, completed: 0 };
      transactions.forEach((transaction) => {
        if (transaction.committeeId?.status && status[transaction.committeeId.status] !== undefined) {
          status[transaction.committeeId.status] += 1;
        }
      });
      setCommitteeStatus(status);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <AdminSidebar />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AdminStatCard title="Total Users" value={stats?.totalUsers || 0} />
              <AdminStatCard title="Active Users" value={stats?.activeUsers || 0} accent="emerald" />
              <AdminStatCard title="Blocked Users" value={stats?.blockedUsers || 0} accent="rose" />
              <AdminStatCard title="Total Committees" value={stats?.totalCommittees || 0} />
              <AdminStatCard title="Total Transactions" value={stats?.totalTransactions || 0} />
              <AdminStatCard title="Flagged Count" value={stats?.flaggedTransactions || 0} accent="amber" />
              <AdminStatCard title="Total Volume" value={`PKR ${Number(stats?.totalVolume || 0).toLocaleString()}`} />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <ChartBlock title="User Registration Trend">
                <Line
                  data={{
                    labels: userTrend.map((item) => item.label),
                    datasets: [{ label: "Users", data: userTrend.map((item) => item.count), borderColor: "#4f46e5" }],
                  }}
                />
              </ChartBlock>
              <ChartBlock title="Transaction Volume">
                <Bar
                  data={{
                    labels: txVolume.map((item) => item.label),
                    datasets: [{ label: "Volume", data: txVolume.map((item) => item.totalVolume), backgroundColor: "#14b8a6" }],
                  }}
                />
              </ChartBlock>
              <ChartBlock title="Committee Status">
                <Pie
                  data={{
                    labels: ["Active", "Pending", "Paused", "Completed"],
                    datasets: [
                      {
                        data: [
                          committeeStatus.active,
                          committeeStatus.pending,
                          committeeStatus.paused,
                          committeeStatus.completed,
                        ],
                        backgroundColor: ["#22c55e", "#f59e0b", "#8b5cf6", "#64748b"],
                      },
                    ],
                  }}
                />
              </ChartBlock>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboardPage;
