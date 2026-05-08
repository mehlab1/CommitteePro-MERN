import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdminSidebar from "../../components/admin/AdminSidebar";
import DataTable from "../../components/admin/DataTable";
import api from "../../services/api";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState({ search: "", status: "" });

  const load = async () => {
    const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value));
    const response = await api.get("/admin/users", { params });
    setUsers(response?.data?.data?.users || []);
  };

  useEffect(() => {
    load();
  }, []);

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role" },
    { key: "status", label: "Status" },
    { key: "trustScore", label: "Trust Score", render: () => "-" },
    { key: "createdAt", label: "Joined Date", render: (row) => new Date(row.createdAt).toLocaleDateString() },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="space-x-2">
          <button
            type="button"
            onClick={async (event) => {
              event.stopPropagation();
              await api.get(`/admin/users/${row._id}`);
            }}
            className="text-xs text-indigo-700"
          >
            View
          </button>
          <button
            type="button"
            onClick={async (event) => {
              event.stopPropagation();
              if (row.status === "blocked") {
                await api.patch(`/admin/users/${row._id}/unblock`);
              } else {
                await api.patch(`/admin/users/${row._id}/block`);
              }
              await load();
            }}
            className={`text-xs ${row.status === "blocked" ? "text-emerald-700" : "text-rose-700"}`}
          >
            {row.status === "blocked" ? "Unblock" : "Block"}
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
            <h1 className="text-2xl font-bold text-gray-900">Admin Users</h1>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <label className="text-sm text-gray-700">
                <span className="mb-1 block">Search</span>
                <input
                  className="w-full rounded border p-2"
                  placeholder="Search name or email"
                  value={query.search}
                  onChange={(event) => setQuery((prev) => ({ ...prev, search: event.target.value }))}
                />
              </label>
              <label className="text-sm text-gray-700">
                <span className="mb-1 block">Status</span>
                <select
                  className="w-full rounded border p-2"
                  value={query.status}
                  onChange={(event) => setQuery((prev) => ({ ...prev, status: event.target.value }))}
                >
                  <option value="">All status</option>
                  <option value="active">Active</option>
                  <option value="blocked">Blocked</option>
                </select>
              </label>
              <button onClick={load} className="rounded bg-indigo-600 px-3 py-2 text-sm text-white">
                Apply
              </button>
            </div>
            <div className="mt-4">
              <DataTable
                columns={columns}
                rows={users}
                rowClassName={(row) => (row.status === "blocked" ? "bg-rose-50" : "")}
              />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminUsersPage;
