import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const guestLinks = [
    { to: "/", label: "Home" },
    { to: "/login", label: "Login" },
    { to: "/register", label: "Register" },
  ];

  const authLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/committees/create", label: "Create Committee" },
    { to: "/transactions", label: "Transactions" },
    { to: "/expenses", label: "Expenses" },
    { to: "/budgets", label: "Budgets" },
    { to: "/wallet", label: "Wallet" },
    { to: "/profile", label: "Profile" },
    { to: "/notifications", label: "Notifications" },
  ];

  const links = isAuthenticated ? authLinks : guestLinks;

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-indigo-700">
          CommitteePro
        </Link>

        <button
          type="button"
          className="rounded-md border border-gray-300 px-3 py-1 text-sm md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          Menu
        </button>

        <div className="hidden items-center gap-4 md:flex">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `text-sm ${isActive ? "font-semibold text-indigo-700" : "text-gray-700"}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-500">Hi, {user?.name || "User"}</span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded bg-indigo-600 px-3 py-1 text-sm text-white"
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-gray-200 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded px-2 py-1 text-sm ${
                    isActive ? "bg-indigo-50 font-semibold text-indigo-700" : "text-gray-700"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-1 rounded bg-indigo-600 px-3 py-2 text-sm text-white"
              >
                Logout
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </nav>
  );
};

export default Navbar;
