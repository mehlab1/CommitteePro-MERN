import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api from "../services/api";

const TransactionReceiptPage = () => {
  const { id } = useParams();
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    const load = async () => {
      const response = await api.get(`/transactions/${id}/receipt`);
      setReceipt(response?.data?.data || null);
    };
    load();
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Transaction Receipt</h1>
          <div className="mt-4 grid gap-2 text-sm text-gray-700">
            <p><span className="font-medium">Transaction ID:</span> {receipt?.receiptNumber}</p>
            <p><span className="font-medium">Type:</span> {receipt?.type}</p>
            <p><span className="font-medium">Amount:</span> PKR {receipt?.amount}</p>
            <p><span className="font-medium">Sender:</span> {receipt?.sender?.name || "-"}</p>
            <p><span className="font-medium">Receiver:</span> {receipt?.receiver?.name || "-"}</p>
            <p><span className="font-medium">Status:</span> {receipt?.status}</p>
            <p><span className="font-medium">Date:</span> {receipt?.transactionDate ? new Date(receipt.transactionDate).toLocaleString() : "-"}</p>
            <p><span className="font-medium">Description:</span> {receipt?.description || "-"}</p>
            {receipt?.suspiciousFlag ? (
              <p className="rounded bg-rose-100 px-2 py-1 text-rose-700">
                Suspicious badge: flagged ({(receipt?.suspiciousReasons || []).join(", ")})
              </p>
            ) : null}
            <p><span className="font-medium">Raast Reference (mock):</span> RAAST-{receipt?.receiptNumber}</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TransactionReceiptPage;
