import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import Navbar from "../components/Navbar";
import api from "../services/api";

const ProfilePage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState({ user: null, profile: null, wallet: null });
  const [form, setForm] = useState({
    name: "",
    displayName: "",
    phone: "",
    profilePhotoUrl: "",
  });

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users/profile");
      const payload = response.data?.data || {};
      setProfileData(payload);
      setForm({
        name: payload.user?.name || "",
        displayName: payload.profile?.displayName || "",
        phone: payload.user?.phone || "",
        profilePhotoUrl: payload.profile?.profilePhotoUrl || "",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/users/profile", form);
      toast.success("Profile updated");
      loadProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-3">
        <section className="md:col-span-2 rounded-xl bg-white p-6 ring-1 ring-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          {loading ? <LoadingSpinner label="Loading profile..." /> : null}

          {!loading ? (
            <form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-gray-700">Full Name</label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">Display Name</label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={form.displayName}
                  onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-700">Phone</label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={form.phone}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-gray-700">Profile Photo URL</label>
                <input
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  value={form.profilePhotoUrl}
                  onChange={(e) => setForm((prev) => ({ ...prev, profilePhotoUrl: e.target.value }))}
                />
              </div>
              <button
                className="sm:col-span-2 rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          ) : null}
        </section>

        <aside className="rounded-xl bg-white p-6 ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Wallet Summary</h2>
          <p className="mt-2 text-sm text-gray-600">Balance: {profileData.wallet?.balance ?? 0}</p>
          <p className="text-sm text-gray-600">Deposits: {profileData.wallet?.totalDeposits ?? 0}</p>
          <p className="text-sm text-gray-600">Withdrawals: {profileData.wallet?.totalWithdrawals ?? 0}</p>
        </aside>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
