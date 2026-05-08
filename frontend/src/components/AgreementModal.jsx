import { useMemo, useState } from "react";

const defaultAgreementText = `
CommitteePro Participation Agreement

1. I agree to contribute my scheduled installment on time for each cycle.
2. I understand that delayed payments may trigger grace period and trust score penalties.
3. I understand committee payouts are governed by the configured payout model and approved cycle rules.
4. I consent to digital signature logging, including IP address and user-agent, for legal verification.
5. I agree to platform fraud and suspicious-activity monitoring controls.
6. I acknowledge that membership and payout eligibility can be suspended for policy violations.
`;

const AgreementModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = "Committee Agreement",
  agreementText = defaultAgreementText,
}) => {
  const [hasReachedBottom, setHasReachedBottom] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const canSubmit = useMemo(
    () => hasReachedBottom && isChecked && !loading,
    [hasReachedBottom, isChecked, loading]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="mx-auto flex h-full w-full max-w-3xl items-center justify-center p-0 sm:p-4">
        <div className="flex h-full w-full flex-col rounded-none bg-white sm:h-auto sm:max-h-[90vh] sm:rounded-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
            >
              Close
            </button>
          </div>

          <div
            className="m-4 flex-1 overflow-y-auto rounded-lg border border-gray-200 p-4 text-sm text-gray-700 sm:m-6"
            onScroll={(event) => {
              const element = event.currentTarget;
              const reachedBottom =
                element.scrollTop + element.clientHeight >= element.scrollHeight - 4;
              if (reachedBottom) setHasReachedBottom(true);
            }}
          >
            <pre className="whitespace-pre-wrap font-sans">{agreementText}</pre>
          </div>

          <div className="border-t border-gray-200 px-4 py-3 sm:px-6">
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(event) => setIsChecked(event.target.checked)}
                disabled={!hasReachedBottom}
                className="mt-0.5"
              />
              <span>I have read and agree to the terms.</span>
            </label>

            {!hasReachedBottom ? (
              <p className="mt-2 text-xs text-amber-600">
                Scroll to the bottom to enable confirmation.
              </p>
            ) : null}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={onConfirm}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:bg-indigo-300"
              >
                {loading ? "Signing..." : "Sign & Confirm"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgreementModal;
