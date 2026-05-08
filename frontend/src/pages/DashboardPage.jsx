import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || "User"}!</h1>
          <p className="mt-1 text-gray-600">Here is your committee and wallet snapshot.</p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Saved" value="PKR 120,000" subtitle="Mock value" />
          <StatCard title="Active Committees" value="3" subtitle="Mock value" />
          <StatCard title="Wallet Balance" value="PKR 18,500" subtitle="Mock value" />
          <StatCard title="Trust Score" value="74" subtitle="Mock value" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
