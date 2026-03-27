'use client';

import { useEffect, useState } from 'react';

interface TermsData {
  taskAmount: string;
  suggestedDeposit: string;
  depositPercent: number;
  requiresArbitration: boolean;
}

export default function ReputationTerms({ show }: { show: boolean }) {
  const [terms, setTerms] = useState<TermsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;
    setLoading(true);
    fetch('/api/reputation')
      .then(r => r.json())
      .then(setTerms)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [show]);

  if (!show) return null;

  return (
    <div className="card p-4 space-y-3 border-amber-500/30 animate-slide-in">
      <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
        <span>⚠️</span> Reputation Consequences
      </h3>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-[#71717a]">
          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          Querying smart contract...
        </div>
      ) : terms ? (
        <div className="space-y-3">
          <p className="text-xs text-[#a1a1aa]">
            Seller's low reputation now triggers harsher terms for future tasks:
          </p>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#12121a] rounded-lg p-3 text-center">
              <div className="text-xs text-[#71717a] mb-1">Before Dispute</div>
              <div className="text-lg font-bold text-emerald-400">10%</div>
              <div className="text-xs text-[#71717a]">Security Deposit</div>
              <div className="text-xs text-emerald-400 mt-1">No Mandatory Arbitration</div>
            </div>

            <div className="bg-[#12121a] rounded-lg p-3 text-center border border-red-500/20">
              <div className="text-xs text-[#71717a] mb-1">After Dispute</div>
              <div className="text-lg font-bold text-red-400">{terms.depositPercent}%</div>
              <div className="text-xs text-[#71717a]">Security Deposit</div>
              <div className={`text-xs mt-1 ${terms.requiresArbitration ? 'text-red-400' : 'text-emerald-400'}`}>
                {terms.requiresArbitration ? 'Mandatory Arbitration' : 'No Mandatory Arbitration'}
              </div>
            </div>
          </div>

          <div className="text-xs text-[#71717a] text-center">
            For a hypothetical {terms.taskAmount} task → {terms.suggestedDeposit} TRX deposit required
          </div>
        </div>
      ) : null}
    </div>
  );
}
