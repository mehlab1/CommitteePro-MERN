import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import StatCard from "../components/StatCard";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import EmptyState from "../components/EmptyState";
import LoadingSkeleton from "../components/LoadingSkeleton";

const CommitteeCard = ({ committee }) => {
  const progress = useMemo(() => {
    const current = Number(committee.currentCycleNumber || 0);
    const total = Number(committee.memberCount || 1);
    return Math.min(100, Math.round((current / total) * 100));
  }, [committee.currentCycleNumber, committee.memberCount]);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900">{committee.name}</h3>
        <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
          {committee.status || "pending"}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600">Contribution: PKR {committee.contributionAmount || 0}</p>
      <p className="text-sm text-gray-600">Members: {committee.memberCount || 0}</p>
      <p className="text-sm text-gray-600">
        Next payment: {committee.nextPaymentDate ? new Date(committee.nextPaymentDate).toLocaleDateString() : "TBD"}
      </p>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
          <span>Cycle progress</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-gray-200">
          <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {committee.currentCycleStatus === "bidding_open" ? (
        <div className="mt-3 animate-pulse rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
          Bid Open
        </div>
      ) : null}

      <Link
        to={`/committees/${committee._id}`}
        className="mt-3 inline-block rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white"
      >
        Open
      </Link>
    </div>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [adminCommittees, setAdminCommittees] = useState([]);
  const [memberCommittees, setMemberCommittees] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const [pendingActions, setPendingActions] = useState({
    unsignedAgreements: 0,
    overduePayments: 0,
    unlinkedAccounts: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [committeesRes, walletRes, notificationsRes] = await Promise.all([
          api.get("/committees"),
          api.get("/wallet"),
          api.get("/notifications"),
        ]);

        const committeesData = committeesRes?.data?.data || {};
        setAdminCommittees(committeesData.adminCommittees || []);
        setMemberCommittees(committeesData.memberCommittees || []);
        setWalletBalance(walletRes?.data?.data?.balance || 0);

        const notifications = notificationsRes?.data?.data || [];
        setNotificationsUnread(notifications.filter((item) => !item.readStatus).length);
        setPendingActions({
          unsignedAgreements: notifications.filter((n) => /agreement/i.test(n.title)).length,
          overduePayments: notifications.filter((n) => /overdue|grace/i.test(n.message)).length,
          unlinkedAccounts: 0,
        });
      } catch {
        setAdminCommittees([]);
        setMemberCommittees([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const allCommittees = [...adminCommittees, ...memberCommittees];
  const totalSaved = allCommittees.reduce(
    (sum, committee) => sum + Number(committee.contributionAmount || 0),
    0
  );
  const nextPayment = allCommittees
    .map((committee) => committee.nextPaymentDate)
    .filter(Boolean)
    .sort()[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="page-transition mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name || "User"}!</h1>
              <p className="mt-1 text-gray-600">Your savings circles and wallet activity at a glance.</p>
            </div>
            <Link
              to="/notifications"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm"
            >
              <span>🔔</span>
              <span>{notificationsUnread}</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <LoadingSkeleton className="h-3 w-24" />
                <LoadingSkeleton className="mt-3 h-8 w-20" />
                <LoadingSkeleton className="mt-2 h-3 w-28" />
              </div>
            ))
          ) : (
            <>
              <StatCard title="Total Saved" value={`PKR ${totalSaved.toLocaleString()}`} />
              <StatCard title="Active Committees" value={allCommittees.length} />
              <StatCard title="Wallet Balance" value={`PKR ${Number(walletBalance).toLocaleString()}`} />
              <StatCard
                title="Next Payment Due"
                value={nextPayment ? new Date(nextPayment).toLocaleDateString() : "N/A"}
              />
              <StatCard title="Trust Score" value={user?.trustScore || "60"} subtitle="Badge" />
            </>
          )}
        </div>

        <div className="mt-6 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Pending Actions</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              Unsigned agreements: {pendingActions.unsignedAgreements}
            </div>
            <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
              Overdue payments: {pendingActions.overduePayments}
            </div>
            <div className="rounded-lg bg-slate-100 p-3 text-sm text-slate-700">
              Unlinked accounts: {pendingActions.unlinkedAccounts}
            </div>
          </div>
        </div>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Committees I Manage</h2>
            <Link to="/committees/create" className="text-sm font-medium text-indigo-700">
              + Create Committee
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {adminCommittees.length > 0 ? (
              adminCommittees.map((committee) => <CommitteeCard key={committee._id} committee={committee} />)
            ) : (
              <EmptyState
                title="No committees managed yet"
                description="Create a committee to start inviting members."
              />
            )}
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold text-gray-900">Committees I Joined</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {memberCommittees.length > 0 ? (
              memberCommittees.map((committee) => <CommitteeCard key={committee._id} committee={committee} />)
            ) : (
              <EmptyState
                title="No joined committees"
                description="Join a committee with an invite token to see it here."
              />
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
