import { useMemo, useState } from "react";

const BidForm = ({ potAmount = 0, onSubmit, disabled = false }) => {
  const [discountAmount, setDiscountAmount] = useState("");

  const validationMessage = useMemo(() => {
    const amount = Number(discountAmount);
    if (!discountAmount) return "";
    if (amount <= 0) return "Discount must be greater than zero";
    if (amount >= Number(potAmount)) return "Discount must be less than pot amount";
    return "";
  }, [discountAmount, potAmount]);

  const previewPayout = useMemo(() => {
    const amount = Number(discountAmount);
    if (!Number.isFinite(amount) || amount <= 0) return Number(potAmount) || 0;
    return Math.max(0, Number(potAmount) - amount);
  }, [discountAmount, potAmount]);

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-200">
      <h3 className="font-semibold text-gray-900">Place Bid</h3>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="number"
          value={discountAmount}
          onChange={(event) => setDiscountAmount(event.target.value)}
          placeholder="Discount amount"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={disabled || Boolean(validationMessage) || !discountAmount}
          onClick={() => onSubmit?.(Number(discountAmount))}
          className="rounded-md bg-indigo-600 px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-indigo-300"
        >
          Confirm Bid
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-600">You will receive PKR {previewPayout.toLocaleString()}</p>
      {validationMessage ? <p className="mt-1 text-xs text-rose-600">{validationMessage}</p> : null}
    </div>
  );
};

export default BidForm;
