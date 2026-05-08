import { useEffect, useMemo, useState } from "react";
import { Pie } from "react-chartjs-2";
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

ChartJS.register(ArcElement, Tooltip, Legend);

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    categoryId: "",
    date: "",
    notes: "",
    paymentMethod: "Wallet",
  });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const [expensesRes, summaryRes] = await Promise.all([
      api.get("/expenses"),
      api.get("/expenses/summary/categories"),
    ]);
    setExpenses(expensesRes?.data?.data || []);
    setSummary(summaryRes?.data?.data || []);
  };

  useEffect(() => {
    load();
    const loadCategories = async () => {
      try {
        const res = await api.get("/categories?type=expense");
        setCategories(res?.data?.data || []);
      } catch {
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  const monthlyTotal = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );

  const save = async () => {
    const payload = { ...form, amount: Number(form.amount) };
    if (editingId) {
      await api.put(`/expenses/${editingId}`, payload);
    } else {
      await api.post("/expenses", payload);
    }
    setForm({ title: "", amount: "", categoryId: "", date: "", notes: "", paymentMethod: "Wallet" });
    setEditingId(null);
    await load();
  };

  const edit = (expense) => {
    setEditingId(expense._id);
    setForm({
      title: expense.title || "",
      amount: expense.amount || "",
      categoryId: expense.categoryId?._id || "",
      date: expense.date ? new Date(expense.date).toISOString().slice(0, 10) : "",
      notes: expense.notes || "",
      paymentMethod: expense.paymentMethod || "Wallet",
    });
  };

  const chartData = {
    labels: summary.map((item) => item.categoryName),
    datasets: [
      {
        data: summary.map((item) => Number(item.totalAmount || 0)),
        backgroundColor: ["#6366f1", "#14b8a6", "#f59e0b", "#f43f5e", "#8b5cf6"],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
            <h2 className="font-semibold">Add Expense</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <input className="rounded border p-2" placeholder="Title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              <input className="rounded border p-2" type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
              <select className="rounded border p-2" value={form.categoryId} onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
              </select>
              <input className="rounded border p-2" type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
              <input className="rounded border p-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              <input className="rounded border p-2" placeholder="Payment Method" value={form.paymentMethod} onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))} />
            </div>
            <button className="mt-3 rounded bg-indigo-600 px-3 py-2 text-sm text-white" onClick={save}>
              {editingId ? "Update Expense" : "Add Expense"}
            </button>
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <h2 className="font-semibold">Monthly Summary</h2>
            <p className="mt-2 text-2xl font-bold">PKR {monthlyTotal.toLocaleString()}</p>
            <p className="text-sm text-gray-500">{expenses.length} expenses this month</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 lg:col-span-2">
            <h2 className="font-semibold">Expense List</h2>
            <table className="mt-3 w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Title</th><th>Amount</th><th>Category</th><th>Date</th><th />
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id} className="border-b last:border-none">
                    <td className="py-2">{expense.title}</td>
                    <td>PKR {expense.amount}</td>
                    <td>{expense.categoryId?.name || "Uncategorized"}</td>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td className="space-x-2">
                      <button className="text-indigo-700" onClick={() => edit(expense)}>Edit</button>
                      <button className="text-rose-600" onClick={async () => { await api.delete(`/expenses/${expense._id}`); await load(); }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
            <h2 className="mb-2 font-semibold">Category Pie Chart</h2>
            <Pie data={chartData} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ExpensesPage;
