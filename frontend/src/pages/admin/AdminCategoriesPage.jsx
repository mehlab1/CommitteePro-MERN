import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/admin/AdminSidebar";
import DataTable from "../../components/admin/DataTable";
import api from "../../services/api";

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", type: "expense", description: "" });
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const [expense, budget, transaction] = await Promise.all([
      api.get("/categories?type=expense").catch(() => ({ data: { data: [] } })),
      api.get("/categories?type=budget").catch(() => ({ data: { data: [] } })),
      api.get("/categories?type=transaction").catch(() => ({ data: { data: [] } })),
    ]);
    setCategories([...(expense.data?.data || []), ...(budget.data?.data || []), ...(transaction.data?.data || [])]);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (editingId) {
      await api.put(`/admin/categories/${editingId}`, form);
    } else {
      await api.post("/admin/categories", form);
    }
    setForm({ name: "", type: "expense", description: "" });
    setEditingId(null);
    await load();
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "type", label: "Type" },
    { key: "description", label: "Description" },
    { key: "isActive", label: "Status", render: (row) => (row.isActive ? "Active" : "Disabled") },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="space-x-2">
          <button
            type="button"
            className="text-xs text-indigo-700"
            onClick={() => {
              setEditingId(row._id);
              setForm({ name: row.name, type: row.type, description: row.description || "" });
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className="text-xs text-rose-700"
            onClick={async () => {
              await api.patch(`/admin/categories/${row._id}/disable`);
              await load();
            }}
          >
            Disable
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="page-transition mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <AdminSidebar />
          <section>
            <h1 className="text-2xl font-bold text-gray-900">Admin Categories</h1>
            <div className="mt-3 grid gap-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200 sm:grid-cols-4">
              <label className="text-sm text-gray-700"><span className="mb-1 block">Name</span><input className="w-full rounded border p-2" placeholder="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
              <label className="text-sm text-gray-700"><span className="mb-1 block">Type</span><select className="w-full rounded border p-2" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                <option value="expense">Expense</option>
                <option value="budget">Budget</option>
                <option value="transaction">Transaction</option>
              </select></label>
              <label className="text-sm text-gray-700"><span className="mb-1 block">Description</span><input className="w-full rounded border p-2" placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} /></label>
              <button onClick={save} className="rounded bg-indigo-600 px-3 py-2 text-sm text-white">
                {editingId ? "Update" : "Add"}
              </button>
            </div>
            <div className="mt-4">
              <DataTable columns={columns} rows={categories} />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminCategoriesPage;
