import TrustScoreBadge from "./TrustScoreBadge";

const MemberList = ({ members = [], showRemove = false, onRemove }) => {
  return (
    <div className="overflow-x-auto rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Member</th>
            <th>Trust</th>
            <th>Payment Status</th>
            <th>Rotation</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {members.map((member, index) => (
            <tr key={member.userId || index} className="border-b last:border-none">
              <td className="py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                    {(member.displayName || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <span>{member.displayName || "Unknown"}</span>
                </div>
              </td>
              <td><TrustScoreBadge score={member.trustScore ?? 0} /></td>
              <td>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                  member.paymentStatus === "completed"
                    ? "bg-emerald-100 text-emerald-700"
                    : member.paymentStatus === "failed"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-amber-100 text-amber-700"
                }`}>
                  ● {member.paymentStatus || "pending"}
                </span>
              </td>
              <td>{member.rotationOrder || index + 1}</td>
              <td>
                {showRemove ? (
                  <button
                    type="button"
                    onClick={() => onRemove?.(member)}
                    className="text-xs text-rose-600"
                  >
                    Remove
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MemberList;
