import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import WalletPage from "../pages/WalletPage";
import ProfilePage from "../pages/ProfilePage";
import CreateCommitteePage from "../pages/CreateCommitteePage";
import CommitteeDetailPage from "../pages/CommitteeDetailPage";
import JoinCommitteePage from "../pages/JoinCommitteePage";
import TransactionsPage from "../pages/TransactionsPage";
import TransactionReceiptPage from "../pages/TransactionReceiptPage";
import ExpensesPage from "../pages/ExpensesPage";
import BudgetsPage from "../pages/BudgetsPage";
import NotificationsPage from "../pages/NotificationsPage";
import AdminDashboardPage from "../pages/admin/AdminDashboardPage";
import AdminUsersPage from "../pages/admin/AdminUsersPage";
import AdminWalletsPage from "../pages/admin/AdminWalletsPage";
import AdminTransactionsPage from "../pages/admin/AdminTransactionsPage";
import AdminFlaggedPage from "../pages/admin/AdminFlaggedPage";
import AdminCategoriesPage from "../pages/admin/AdminCategoriesPage";
import AdminReportsPage from "../pages/admin/AdminReportsPage";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <WalletPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <TransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions/:id/receipt"
        element={
          <ProtectedRoute>
            <TransactionReceiptPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <ExpensesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <BudgetsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/committees"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/committees/create"
        element={
          <ProtectedRoute>
            <CreateCommitteePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/committees/:id"
        element={
          <ProtectedRoute>
            <CommitteeDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/join/:token"
        element={
          <ProtectedRoute>
            <JoinCommitteePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute adminOnly>
            <AdminUsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/wallets"
        element={
          <ProtectedRoute adminOnly>
            <AdminWalletsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/transactions"
        element={
          <ProtectedRoute adminOnly>
            <AdminTransactionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/flagged"
        element={
          <ProtectedRoute adminOnly>
            <AdminFlaggedPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute adminOnly>
            <AdminCategoriesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute adminOnly>
            <AdminReportsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
