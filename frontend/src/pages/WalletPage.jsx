import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Footer from "../components/Footer";
import LoadingSpinner from "../components/LoadingSpinner";
import Modal from "../components/Modal";
import Navbar from "../components/Navbar";
import api from "../services/api";
import EmptyState from "../components/EmptyState";

const hardcodedTransactions = [
  { id: "TXN-20260508-0001", type: "deposit", amount: 5000, status: "successful" },
  { id: "TXN-20260508-0002", type: "withdrawal", amount: 1000, status: "successful" },
];

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [transferForm, setTransferForm] = useState({ receiverId: "", amount: "" });

  const fetchWallet = async () => {
    setLoading(true);
    try {
      const [walletRes, summaryRes] = await Promise.all([api.get("/wallet"), api.get("/wallet/summary")]);
      setWallet(walletRes.data?.data || null);
      setSummary(summaryRes.data?.data?.summary || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load wallet");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleDeposit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/wallet/deposit", { amount: Number(depositAmount) });
      toast.success("Deposit successful");
      setDepositAmount("");
      setDepositOpen(false);
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || "Deposit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/wallet/withdraw", { amount: Number(withdrawAmount) });
      toast.success("Withdrawal successful");
      setWithdrawAmount("");
      setWithdrawOpen(false);
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || "Withdrawal failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/wallet/transfer", {
        receiverId: transferForm.receiverId,
        amount: Number(transferForm.amount),
      });
      toast.success("Transfer successful");
      setTransferForm({ receiverId: "", amount: "" });
      fetchWallet();
    } catch (err) {
      toast.error(err.response?.data?.message || "Transfer failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        {loading ? <LoadingSpinner label="Loading wallet..." /> : null}

        {!loading && wallet ? (
          <>
            <div className="mt-4 rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
              <p className="text-sm text-gray-500">Current Balance</p>
              <h2 className="text-3xl font-bold text-gray-900">
                {wallet.currency} {wallet.balance}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDepositOpen(true)}
                  className="rounded bg-indigo-600 px-4 py-2 text-white"
                >
                  Deposit
                </button>
                <button
                  type="button"
                  onClick={() => setWithdrawOpen(true)}
                  className="rounded bg-gray-800 px-4 py-2 text-white"
                >
                  Withdraw
                </button>
              </div>
            </div>

            {summary ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
                  <p className="text-xs text-gray-500">Total Inflow</p>
                  <p className="text-lg font-semibold">{summary.totalInflow}</p>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
                  <p className="text-xs text-gray-500">Total Outflow</p>
                  <p className="text-lg font-semibold">{summary.totalOutflow}</p>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
                  <p className="text-xs text-gray-500">Net Flow</p>
                  <p className="text-lg font-semibold">{summary.netFlow}</p>
                </div>
                <div className="rounded-xl bg-white p-4 ring-1 ring-gray-200">
                  <p className="text-xs text-gray-500">Available</p>
                  <p className="text-lg font-semibold">{summary.availableBalance}</p>
                </div>
              </div>
            ) : null}

            <div className="mt-6 rounded-xl bg-white p-6 ring-1 ring-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Transfer</h3>
              <form className="mt-3 grid gap-3 sm:grid-cols-3" onSubmit={handleTransfer}>
                <input
                  placeholder="Receiver email or userId"
                  className="rounded border border-gray-300 px-3 py-2 sm:col-span-2"
                  value={transferForm.receiverId}
                  onChange={(e) => setTransferForm((p) => ({ ...p, receiverId: e.target.value }))}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Amount"
                  className="rounded border border-gray-300 px-3 py-2"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm((p) => ({ ...p, amount: e.target.value }))}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-indigo-600 px-4 py-2 text-white sm:col-span-3"
                >
                  {submitting ? "Processing..." : "Send Transfer"}
                </button>
              </form>
            </div>

            <div className="mt-6 rounded-xl bg-white p-6 ring-1 ring-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              <ul className="mt-3 space-y-2">
                {hardcodedTransactions.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded border border-gray-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.id}</p>
                      <p className="text-xs text-gray-500">{item.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">PKR {item.amount}</p>
                      <p className="text-xs text-green-600">{item.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </>
        ) : null}

        {!loading && !wallet ? <EmptyState title="No wallet found" description="Wallet data is unavailable." /> : null}
      </main>

      <Modal isOpen={depositOpen} onClose={() => setDepositOpen(false)} title="Deposit Amount">
        <form className="space-y-3" onSubmit={handleDeposit}>
          <input
            type="number"
            min="1"
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
          />
          <button className="w-full rounded bg-indigo-600 px-4 py-2 text-white" disabled={submitting}>
            {submitting ? "Processing..." : "Confirm Deposit"}
          </button>
        </form>
      </Modal>

      <Modal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="Withdraw Amount">
        <form className="space-y-3" onSubmit={handleWithdraw}>
          <input
            type="number"
            min="1"
            className="w-full rounded border border-gray-300 px-3 py-2"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
          />
          <button className="w-full rounded bg-gray-800 px-4 py-2 text-white" disabled={submitting}>
            {submitting ? "Processing..." : "Confirm Withdraw"}
          </button>
        </form>
      </Modal>

      <Footer />
    </div>
  );
};

export default WalletPage;
