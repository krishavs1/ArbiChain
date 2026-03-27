'use client';

const EXPLORER = 'https://nile.tronscan.org';

interface AgentData {
  address: string;
  balance: string;
  role: string;
  reputation: number;
  tier: string;
  tasksCompleted: number;
  disputesWon: number;
  disputesLost: number;
}

const tierColors: Record<string, string> = {
  Elite: 'text-purple-400',
  Trusted: 'text-emerald-400',
  Established: 'text-blue-400',
  New: 'text-amber-400',
  Untrusted: 'text-red-400',
};

const roleIcons: Record<string, string> = {
  Buyer: '🛒',
  Seller: '🏪',
  Arbitrator: '⚖️',
};

export default function AgentCard({ agent, previousRep }: { agent: AgentData; previousRep?: number }) {
  const repPercent = (agent.reputation / 1000) * 100;
  const repChanged = previousRep !== undefined && previousRep !== agent.reputation;
  const repDelta = previousRep !== undefined ? agent.reputation - previousRep : 0;

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{roleIcons[agent.role] || '🤖'}</span>
          <span className="font-semibold text-sm">{agent.role}</span>
        </div>
        <span className="text-xs font-mono bg-[#12121a] px-2 py-1 rounded">
          {agent.balance} TRX
        </span>
      </div>

      <a
        href={`${EXPLORER}/#/address/${agent.address}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs font-mono text-blue-400 hover:text-blue-300 block truncate"
      >
        {agent.address}
      </a>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#a1a1aa]">Reputation</span>
          <span className="flex items-center gap-2">
            <span className={`font-semibold ${tierColors[agent.tier] || 'text-white'}`}>
              {agent.reputation}/1000
            </span>
            {repChanged && (
              <span className={`text-xs font-mono animate-slide-in ${repDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {repDelta > 0 ? '+' : ''}{repDelta}
              </span>
            )}
          </span>
        </div>
        <div className="w-full bg-[#12121a] rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${repPercent}%`,
              background: agent.reputation >= 700 ? '#10b981' : agent.reputation >= 500 ? '#3b82f6' : agent.reputation >= 300 ? '#f59e0b' : '#ef4444',
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-[#71717a]">
          <span className={tierColors[agent.tier] || ''}>{agent.tier}</span>
          <span>Tasks: {agent.tasksCompleted} | Won: {agent.disputesWon} | Lost: {agent.disputesLost}</span>
        </div>
      </div>
    </div>
  );
}
