import AppRoutes from "./routes/AppRoutes";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const resolveTitle = (pathname) => {
  if (pathname === "/") return "CommitteePro - Home";
  if (pathname === "/login") return "CommitteePro - Login";
  if (pathname === "/register") return "CommitteePro - Register";
  if (pathname === "/dashboard") return "CommitteePro - Dashboard";
  if (pathname === "/wallet") return "CommitteePro - Wallet";
  if (pathname === "/profile") return "CommitteePro - Profile";
  if (pathname === "/transactions") return "CommitteePro - Transactions";
  if (pathname.startsWith("/transactions/") && pathname.endsWith("/receipt")) {
    return "CommitteePro - Transaction Receipt";
  }
  if (pathname === "/expenses") return "CommitteePro - Expenses";
  if (pathname === "/budgets") return "CommitteePro - Budgets";
  if (pathname === "/committees/create") return "CommitteePro - Create Committee";
  if (pathname.startsWith("/committees/")) return "CommitteePro - Committee Detail";
  if (pathname.startsWith("/join/")) return "CommitteePro - Join Committee";
  if (pathname === "/notifications") return "CommitteePro - Notifications";
  if (pathname === "/admin") return "CommitteePro - Admin Dashboard";
  if (pathname === "/admin/users") return "CommitteePro - Admin Users";
  if (pathname === "/admin/wallets") return "CommitteePro - Admin Wallets";
  if (pathname === "/admin/transactions") return "CommitteePro - Admin Transactions";
  if (pathname === "/admin/flagged") return "CommitteePro - Admin Flagged";
  if (pathname === "/admin/categories") return "CommitteePro - Admin Categories";
  if (pathname === "/admin/reports") return "CommitteePro - Admin Reports";
  return "CommitteePro";
};

function App() {
  const location = useLocation();

  useEffect(() => {
    document.title = resolveTitle(location.pathname);
  }, [location.pathname]);

  return (
    <>
      <Toaster position="top-right" />
      <AppRoutes />
    </>
  );
}

export default App;
