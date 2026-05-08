import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AgreementModal from "../components/AgreementModal";
import api from "../services/api";

const tabs = ["Overview", "Members", "Bidding", "Payouts", "Agreement", "Payment History"];

const CommitteeDetailPage = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Overview");
  const [data, setData] = useState(null);
  const [bidsData, setBidsData] = useState(null);
  const [showAgreement, setShowAgreement] = useState(false);
  const [signLoading, setSignLoading] = useState(false);
  const [bidAmount, setBidAmount] = useState("");

  const load = async () => {
    const committeeRes = await api.get(`/committees/${id}`);
    setData(committeeRes?.data?.data || null);
    const cycleId = committeeRes?.data?.data?.currentActiveCycle?._id;
    if (cycleId) {
      const bidsRes = await api.get(`/bids/${cycleId}`);
      setBidsData(bidsRes?.data?.data || null);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const committee = data?.committee;
  const members = data?.members || [];
  const cycle = data?.currentActiveCycle;
  const currentUserMember = members[0];

  const livePayoutPreview = useMemo(() => {
    const pot = Number(cycle?.potAmount || 0);
    const discount = Number(bidAmount || 0);
    return Math.max(0, pot - discount);
  }, [cycle?.potAmount, bidAmount]);

  const signAgreement = async () => {
    setSignLoading(true);
    try {
      await api.post(`/committees/${id}/sign-agreement`);
      setShowAgreement(false);
      await load();
    } finally {
      setSignLoading(false);
    }
  };

  const submitBid = async () => {
    if (!cycle?._id || Number(bidAmount) <= 0) return;
    await api.post("/bids", {
      committeeId: id,
      cycleId: cycle._id,
      discountAmount: Number(bidAmount),
    });
    await load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900">{committee?.name || "Committee Detail"}</h1>

        <div className="mt-4 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-3 py-1 text-sm ${activeTab === tab ? "bg-indigo-600 text-white" : "bg-white text-gray-700 ring-1 ring-gray-200"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          {activeTab === "Overview" ? (
            <div className="space-y-3">
              <p><span className="font-semibold">Contribution:</span> PKR {committee?.contributionAmount || 0}</p>
              <p><span className="font-semibold">Model:</span> {committee?.payoutModel}</p>
              <p><span className="font-semibold">Current Cycle:</span> #{cycle?.cycleNumber || "-"}</p>
              <p><span className="font-semibold">My Payment Status:</span> {currentUserMember?.paymentStatus || "pending"}</p>
              <div className="flex -space-x-2">
                {members.slice(0, 6).map((member) => (
                  <div key={member.userId} className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 ring-2 ring-white">
                    {(member.displayName || "U").slice(0, 1).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {activeTab === "Members" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2">Member</th>
                    <th>Trust</th>
                    <th>Payment</th>
                    <th>Rotation</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, index) => (
                    <tr key={member.userId} className="border-b last:border-none">
                      <td className="py-2">{member.displayName}</td>
                      <td><span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{member.trustScore ?? "-"}</span></td>
                      <td>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                          member.paymentStatus === "completed"
                            ? "bg-emerald-100 text-emerald-700"
                            : member.paymentStatus === "failed"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-amber-100 text-amber-700"
                        }`}>
                          ● {member.paymentStatus}
                        </span>
                      </td>
                      <td>{member.rotationOrder || index + 1}</td>
                      <td>{member.role === "member" ? <button className="text-xs text-rose-600">Remove</button> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {activeTab === "Bidding" ? (
            <div className="space-y-3 text-sm">
              <p><span className="font-semibold">Countdown:</span> {cycle?.biddingClosesAt ? new Date(cycle.biddingClosesAt).toLocaleString() : "TBD"}</p>
              <p><span className="font-semibold">Current Pot:</span> PKR {cycle?.potAmount || 0}</p>
              <p className="rounded bg-slate-100 p-2">
                {(bidsData?.bids || []).length} bids placed, highest discount: PKR{" "}
                {Math.max(0, ...(bidsData?.bids || []).map((bid) => Number(bid.discountAmount)))}
              </p>
              {bidsData?.myBid ? (
                <div className="rounded bg-emerald-50 p-2 text-emerald-700">
                  Your bid is active (PKR {bidsData.myBid.discountAmount})
                  <button className="ml-2 text-xs underline">Withdraw</button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    className="rounded border p-2"
                    placeholder="Discount amount"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                  />
                  <span>You will receive PKR {livePayoutPreview.toLocaleString()}</span>
                  <button onClick={submitBid} className="rounded bg-indigo-600 px-3 py-2 text-white">
                    Confirm Bid
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {activeTab === "Payouts" ? (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Cycle #</th>
                  <th>Recipient</th>
                  <th>Amount</th>
                  <th>Discount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2">{cycle?.cycleNumber || "-"}</td>
                  <td>{members.find((m) => m.userId === cycle?.winnerUserId)?.displayName || "TBD"}</td>
                  <td>PKR {cycle?.payoutAmount || "-"}</td>
                  <td>PKR {cycle?.winningDiscount || 0}</td>
                  <td>{cycle?.status || "-"}</td>
                </tr>
              </tbody>
            </table>
          ) : null}

          {activeTab === "Agreement" ? (
            <div>
              <div className="max-h-48 overflow-y-auto rounded border p-3 text-sm text-gray-700">
                Members agree to comply with contributions, payout schedule, fraud checks, and digital signature records.
              </div>
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left">Member</th>
                    <th className="text-left">Signed</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.userId} className="border-b last:border-none">
                      <td className="py-2">{member.displayName}</td>
                      <td>{member.hasSignedAgreement ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button onClick={() => setShowAgreement(true)} className="mt-3 rounded bg-indigo-600 px-3 py-2 text-sm text-white">
                Sign Now
              </button>
            </div>
          ) : null}

          {activeTab === "Payment History" ? (
            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <select className="rounded border p-2 text-sm"><option>Type</option></select>
                <select className="rounded border p-2 text-sm"><option>Cycle</option></select>
                <input className="rounded border p-2 text-sm" type="date" />
                <button className="rounded border px-3 py-2 text-sm">Export CSV</button>
              </div>
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b"><th className="py-2">Type</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={`ph-${member.userId}`} className="border-b last:border-none">
                      <td className="py-2">Contribution</td>
                      <td>{member.paymentStatus}</td>
                      <td>{new Date().toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
      <AgreementModal
        isOpen={showAgreement}
        onClose={() => setShowAgreement(false)}
        onConfirm={signAgreement}
        loading={signLoading}
      />
    </div>
  );
};

export default CommitteeDetailPage;
