import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

const BudgetsPage = () => {
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({
    month: "",
    totalLimit: "",
    categoryLimits: [{ category: "Food", limit: 0 }],
  });

  const load = async () => {
    const response = await api.get("/budgets");
    setBudgets(response?.data?.data || []);
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
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Budgets</h1>

        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <h2 className="font-semibold">Create Budget</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <input className="rounded border p-2" type="month" value={form.month} onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))} />
            <input className="rounded border p-2" type="number" placeholder="Total Limit" value={form.totalLimit} onChange={(e) => setForm((p) => ({ ...p, totalLimit: e.target.value }))} />
            <input className="rounded border p-2" placeholder="Category Name" value={form.categoryLimits[0].category} onChange={(e) => setForm((p) => ({ ...p, categoryLimits: [{ ...p.categoryLimits[0], category: e.target.value }] }))} />
            <input className="rounded border p-2" type="number" placeholder="Category Limit" value={form.categoryLimits[0].limit} onChange={(e) => setForm((p) => ({ ...p, categoryLimits: [{ ...p.categoryLimits[0], limit: e.target.value }] }))} />
          </div>
          <button className="mt-3 rounded bg-indigo-600 px-3 py-2 text-sm text-white" onClick={create}>
            Create Budget
          </button>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {budgets.map((budget) => {
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
      </main>
      <Footer />
    </div>
  );
};

export default BudgetsPage;
