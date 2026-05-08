import { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
} from "chart.js";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import ChartBlock from "../../components/ChartBlock";
import AdminSidebar from "../../components/admin/AdminSidebar";
import api from "../../services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const AdminReportsPage = () => {
  const [report, setReport] = useState([]);
  const [balance, setBalance] = useState(0);
  const [range, setRange] = useState({ fromDate: "", toDate: "" });

  const load = async () => {
    const [reportRes, balanceRes] = await Promise.all([
      api.get("/admin/reports/transaction-volume?groupBy=day"),
      api.get("/admin/reports/system-balance"),
    ]);
    setReport(reportRes?.data?.data?.report || []);
    setBalance(balanceRes?.data?.data?.totalBalance || 0);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = report.filter((item) => {
    if (!range.fromDate && !range.toDate) return true;
    if (range.fromDate && item.label < range.fromDate) return false;
    if (range.toDate && item.label > range.toDate) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="page-transition mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <AdminSidebar />
          <section>
            <h1 className="text-2xl font-bold text-gray-900">Admin Reports</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
              <label className="text-sm text-gray-600">
                <span className="mb-1 block">From</span>
                <input className="rounded border p-2 text-sm" type="date" value={range.fromDate} onChange={(e) => setRange((p) => ({ ...p, fromDate: e.target.value }))} />
              </label>
              <label className="text-sm text-gray-600">
                <span className="mb-1 block">To</span>
                <input className="rounded border p-2 text-sm" type="date" value={range.toDate} onChange={(e) => setRange((p) => ({ ...p, toDate: e.target.value }))} />
              </label>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <ChartBlock title="Transaction Volume (Daily)">
                <Bar
                  data={{
                    labels: filtered.map((item) => item.label),
                    datasets: [{ label: "Volume", data: filtered.map((item) => item.totalVolume), backgroundColor: "#4f46e5" }],
                  }}
                />
              </ChartBlock>
              <ChartBlock title="Transaction Count (Daily)">
                <Line
                  data={{
                    labels: filtered.map((item) => item.label),
                    datasets: [{ label: "Count", data: filtered.map((item) => item.transactionCount), borderColor: "#0ea5e9" }],
                  }}
                />
              </ChartBlock>
              <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <p className="text-sm text-gray-500">System Balance</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  PKR {Number(balance).toLocaleString()}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminReportsPage;
