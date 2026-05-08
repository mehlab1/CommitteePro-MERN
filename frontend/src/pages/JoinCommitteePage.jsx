import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AgreementModal from "../components/AgreementModal";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const JoinCommitteePage = () => {
  const { token } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [preview, setPreview] = useState(null);
  const [openAgreement, setOpenAgreement] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/register?intent=join&token=${token}`, { replace: true });
      return;
    }

    const loadPreview = async () => {
      try {
        const response = await api.get(`/invites/${token}/preview`);
        setPreview(response?.data?.data || null);
      } catch {
        setPreview(null);
      }
    };
    loadPreview();
  }, [isAuthenticated, navigate, token]);

  const join = async () => {
    setLoading(true);
    try {
      const response = await api.post(`/committees/join/${token}`);
      const committeeId = response?.data?.data?.committeeId || preview?.committeeId;
      setOpenAgreement(false);
      navigate(`/committees/${committeeId}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="page-transition mx-auto max-w-4xl px-4 py-8">
        <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Join Committee</h1>
          <p className="mt-1 text-sm text-gray-600">Review details before joining with invite token.</p>

          <div className="mt-4 grid gap-2 text-sm text-gray-700">
            <p><span className="font-medium">Name:</span> {preview?.name || "Preview unavailable"}</p>
            <p><span className="font-medium">Admin:</span> {preview?.adminName || "-"}</p>
            <p><span className="font-medium">Amount:</span> PKR {preview?.contributionAmount || 0}</p>
            <p><span className="font-medium">Frequency:</span> {preview?.cycleFrequency || "-"}</p>
            <p><span className="font-medium">Slots remaining:</span> {preview?.slotsRemaining ?? "-"}</p>
          </div>

          <div className="mt-4">
            <h2 className="text-sm font-semibold text-gray-900">Member list</h2>
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {(preview?.members || []).map((member) => (
                <li key={member.userId}>
                  {member.displayName} - Trust {member.trustScore ?? 60}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            className="mt-5 rounded bg-indigo-600 px-4 py-2 text-white"
            onClick={() => setOpenAgreement(true)}
          >
            Join This Committee
          </button>
        </div>
      </main>
      <Footer />
      <AgreementModal
        isOpen={openAgreement}
        onClose={() => setOpenAgreement(false)}
        onConfirm={join}
        loading={loading}
      />
    </div>
  );
};

export default JoinCommitteePage;
