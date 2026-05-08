import { NavLink } from "react-router-dom";

const links = [
  { to: "/admin", label: "Dashboard" },
  { to: "/admin/users", label: "Users" },
  { to: "/admin/wallets", label: "Wallets" },
  { to: "/admin/transactions", label: "Transactions" },
  { to: "/admin/flagged", label: "Flagged" },
  { to: "/admin/categories", label: "Categories" },
  { to: "/admin/reports", label: "Reports" },
];

const AdminSidebar = () => {
  return (
    <aside className="rounded-xl bg-white p-3 shadow-sm ring-1 ring-gray-200">
      <h2 className="mb-3 px-2 text-sm font-semibold text-gray-900">Admin Panel</h2>
      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/admin"}
            className={({ isActive }) =>
              `block rounded-md px-3 py-2 text-sm ${
                isActive ? "bg-indigo-50 font-semibold text-indigo-700" : "text-gray-700 hover:bg-gray-50"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
