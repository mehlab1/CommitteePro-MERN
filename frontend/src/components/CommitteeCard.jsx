import { Link } from "react-router-dom";
import CycleProgressBar from "./CycleProgressBar";

const CommitteeCard = ({ committee }) => {
  if (!committee) return null;

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
        <CycleProgressBar
          current={committee.currentCycleNumber || 0}
          total={committee.memberCount || 1}
        />
      </div>

      {committee.currentCycleStatus === "bidding_open" ? (
        <div className="mt-3 animate-pulse rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
          Bid Open
        </div>
      ) : null}

      <Link to={`/committees/${committee._id}`} className="mt-3 inline-block rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white">
        View Committee
      </Link>
    </div>
  );
};

export default CommitteeCard;
