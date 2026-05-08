import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({
    month: "",
    totalLimit: "",
    categoryLimits: [{ category: "Food", limit: 0 }],
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/budgets");
      setBudgets(response?.data?.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    await api.post("/budgets", {
      ...form,
      totalLimit: Number(form.totalLimit),
      categoryLimits: form.categoryLimits.map((item) => ({ ...item, limit: Number(item.limit) })),
    });
    setForm({ month: "", totalLimit: "", categoryLimits: [{ category: "Food", limit: 0 }] });
    await load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="page-transition mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <h2 className="font-semibold">Create Budget</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <label className="text-sm text-gray-700"><span className="mb-1 block">Month</span><input className="w-full rounded border p-2" type="month" value={form.month} onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))} /></label>
            <label className="text-sm text-gray-700"><span className="mb-1 block">Total Limit</span><input className="w-full rounded border p-2" type="number" placeholder="Total Limit" value={form.totalLimit} onChange={(e) => setForm((p) => ({ ...p, totalLimit: e.target.value }))} /></label>
            <label className="text-sm text-gray-700"><span className="mb-1 block">Category Name</span><input className="w-full rounded border p-2" placeholder="Category Name" value={form.categoryLimits[0].category} onChange={(e) => setForm((p) => ({ ...p, categoryLimits: [{ ...p.categoryLimits[0], category: e.target.value }] }))} /></label>
            <label className="text-sm text-gray-700"><span className="mb-1 block">Category Limit</span><input className="w-full rounded border p-2" type="number" placeholder="Category Limit" value={form.categoryLimits[0].limit} onChange={(e) => setForm((p) => ({ ...p, categoryLimits: [{ ...p.categoryLimits[0], limit: e.target.value }] }))} /></label>
          </div>
          <button className="mt-3 rounded bg-indigo-600 px-3 py-2 text-sm text-white" onClick={create}>
            Create Budget
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {loading
            ? Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                  <LoadingSkeleton className="h-4 w-24" />
                  <LoadingSkeleton className="mt-3 h-3 w-48" />
                  <LoadingSkeleton className="mt-3 h-2 w-full" />
                </div>
              ))
            : budgets.map((budget) => {
            const ratio = Math.min(100, Math.round((Number(budget.spentAmount || 0) / Number(budget.totalLimit || 1)) * 100));
            const barColor =
              budget.status === "exceeded"
                ? "bg-rose-500"
                : budget.status === "nearLimit"
                  ? "bg-amber-500"
                  : "bg-emerald-500";
            return (
              <div key={budget._id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{budget.month}</h3>
                  <span className={`rounded-full px-2 py-1 text-xs ${
                    budget.status === "exceeded"
                      ? "bg-rose-100 text-rose-700"
                      : budget.status === "nearLimit"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-emerald-100 text-emerald-700"
                  }`}>
                    {budget.status === "nearLimit" ? "Near Limit" : budget.status === "exceeded" ? "Exceeded" : "Safe"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  Spent PKR {Number(budget.spentAmount || 0).toLocaleString()} / PKR {Number(budget.totalLimit || 0).toLocaleString()}
                </p>
                <div className="mt-2 h-2 rounded-full bg-gray-200">
                  <div className={`h-2 rounded-full ${barColor}`} style={{ width: `${ratio}%` }} />
                </div>
                {budget.status === "nearLimit" || budget.status === "exceeded" ? (
                  <p className="mt-2 text-xs text-amber-700">Warning: you are near or beyond budget limit.</p>
                ) : null}
              </div>
            );
            })}
        </div>
        {!loading && budgets.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No budgets set"
              description="Create a monthly budget to monitor spending."
            />
          </div>
        ) : null}
      </main>
      <Footer />
    </div>
  );
};

export default BudgetsPage;
