import { useState } from "react";
import { Link } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";

const faqs = [
  {
    question: "How does CommitteePro work?",
    answer:
      "You join a trusted committee, contribute on schedule, and receive payouts based on transparent rotation or bidding rules.",
  },
  {
    question: "Is my money secure?",
    answer:
      "CommitteePro uses role-based access, transaction logs, and fraud monitoring rules to improve transparency and safety.",
  },
  {
    question: "Can I track my wallet and profile?",
    answer:
      "Yes, you can monitor wallet movements, trust signals, and committee activity from your dashboard.",
  },
];

const LandingPage = () => {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main>
        <section className="mx-auto grid max-w-6xl gap-8 px-4 py-16 md:grid-cols-2 md:items-center">
          <div>
            <p className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
              Trusted Community Finance
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
              Smarter committee savings with transparency and trust.
            </h1>
            <p className="mt-4 text-gray-600">
              Manage committees, wallets, payouts, and member trust metrics in one platform.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/register" className="rounded bg-indigo-600 px-5 py-2 text-white">
                Get Started
              </Link>
              <Link to="/login" className="rounded border border-gray-300 px-5 py-2 text-gray-700">
                Sign In
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Trust Indicators</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-600">
              <li>• On-time payment tracking</li>
              <li>• Verified member profiles</li>
              <li>• Fraud flagging and audit-ready logs</li>
              <li>• Wallet history visibility</li>
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-bold text-gray-900">How It Works</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {["Register", "Join Committee", "Contribute", "Get Payout"].map((step, idx) => (
              <div key={step} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
                <p className="text-xs font-semibold text-indigo-600">Step {idx + 1}</p>
                <h3 className="mt-2 font-semibold text-gray-900">{step}</h3>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-bold text-gray-900">FAQ</h2>
          <div className="mt-4 space-y-3">
            {faqs.map((item, index) => (
              <div key={item.question} className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-200">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                >
                  <span className="font-medium text-gray-900">{item.question}</span>
                  <span className="text-gray-500">{openFaq === index ? "-" : "+"}</span>
                </button>
                {openFaq === index ? <p className="mt-2 text-sm text-gray-600">{item.answer}</p> : null}
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
