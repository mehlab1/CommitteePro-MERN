import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

const initialForm = {
  name: "",
  contributionAmount: "",
  memberCount: "",
  cycleFrequency: "monthly",
  payoutModel: "bidding",
  startDate: "",
};

const CreateCommitteePage = () => {
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const canContinue = useMemo(() => {
    return (
      form.name &&
      Number(form.contributionAmount) > 0 &&
      Number(form.memberCount) >= 4 &&
      Number(form.memberCount) <= 20 &&
      form.cycleFrequency &&
      form.payoutModel &&
      form.startDate
    );
  }, [form]);

  const createCommittee = async () => {
    setLoading(true);
    try {
      const response = await api.post("/committees", {
        ...form,
        contributionAmount: Number(form.contributionAmount),
        memberCount: Number(form.memberCount),
      });
      const committeeId = response?.data?.data?._id;
      setStep(3);
      setTimeout(() => {
        navigate(`/committees/${committeeId}`);
      }, 900);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="page-transition mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Create Committee</h1>

          {step === 1 ? (
            <div className="mt-5 grid gap-4">
              <label className="text-sm text-gray-700"><span className="mb-1 block">Committee name</span><input className="w-full rounded border p-2" placeholder="Committee name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></label>
              <label className="text-sm text-gray-700"><span className="mb-1 block">Contribution amount</span><input className="w-full rounded border p-2" type="number" placeholder="Contribution amount" value={form.contributionAmount} onChange={(e) => setForm((p) => ({ ...p, contributionAmount: e.target.value }))} /></label>
              <label className="text-sm text-gray-700"><span className="mb-1 block">Members (4-20)</span><input className="w-full rounded border p-2" type="number" min="4" max="20" placeholder="Members (4-20)" value={form.memberCount} onChange={(e) => setForm((p) => ({ ...p, memberCount: e.target.value }))} /></label>
              <label className="text-sm text-gray-700"><span className="mb-1 block">Cycle frequency</span><select className="w-full rounded border p-2" value={form.cycleFrequency} onChange={(e) => setForm((p) => ({ ...p, cycleFrequency: e.target.value }))}>
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
              </select></label>
              <label className="text-sm text-gray-700"><span className="mb-1 block">Payout model</span><select className="w-full rounded border p-2" value={form.payoutModel} onChange={(e) => setForm((p) => ({ ...p, payoutModel: e.target.value }))}>
                <option value="bidding">Bidding</option>
                <option value="fixed">Fixed</option>
              </select></label>
              <label className="text-sm text-gray-700"><span className="mb-1 block">Start date</span><input className="w-full rounded border p-2" type="date" value={form.startDate} onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))} /></label>
              <div className="flex justify-end">
                <button disabled={!canContinue} onClick={() => setStep(2)} className="rounded bg-indigo-600 px-4 py-2 text-white disabled:bg-indigo-300">
                  Review
                </button>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="mt-5 space-y-2 text-sm text-gray-700">
              {Object.entries(form).map(([key, value]) => (
                <p key={key}>
                  <span className="font-medium">{key}:</span> {String(value)}
                </p>
              ))}
              <div className="mt-4 flex justify-between">
                <button onClick={() => setStep(1)} className="rounded border px-4 py-2 text-sm">
                  Back
                </button>
                <button onClick={createCommittee} disabled={loading} className="rounded bg-indigo-600 px-4 py-2 text-sm text-white">
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          ) : null}

          {step === 3 ? <p className="mt-5 text-emerald-700">Success! Redirecting to committee admin view...</p> : null}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateCommitteePage;
