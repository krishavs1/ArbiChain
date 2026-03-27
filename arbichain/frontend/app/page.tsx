'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import AgentCard from '@/components/AgentCard';
import DemoStepper from '@/components/DemoStepper';
import EventLog, { LogEntry } from '@/components/EventLog';
import ReputationTerms from '@/components/ReputationTerms';
import StatusDot from '@/components/StatusDot';

const EXPLORER = 'https://nile.tronscan.org';

const HAPPY_STEPS = [
  { id: 'create-task', label: 'Create Task & Fund Escrow', description: 'Buyer posts task spec to Filecoin, locks 10 TRX in escrow', icon: '1' },
  { id: 'submit-deliverable', label: 'Submit Deliverable', description: 'Seller generates article, uploads to Filecoin, submits on-chain', icon: '2' },
  { id: 'approve', label: 'Approve & Release Funds', description: 'Buyer approves delivery, funds release to seller, both reputations increase', icon: '3' },
];

const DISPUTE_STEPS = [
  { id: 'create-task', label: 'Create Task & Fund Escrow', description: 'Buyer posts strict 500-word requirement, locks 10 TRX', icon: '1' },
  { id: 'submit-garbage', label: 'Submit Garbage Deliverable', description: 'Seller submits a 16-word response to a 500-word requirement', icon: '2' },
  { id: 'open-dispute', label: 'Open Dispute', description: 'Buyer disputes the deliverable, recorded on-chain', icon: '3' },
  { id: 'resolve', label: 'Arbitrator Resolves Dispute', description: 'Arbitrator pulls evidence from Filecoin, analyzes, rules REFUND_BUYER', icon: '4' },
];

type AgentRole = 'buyer' | 'seller' | 'arbitrator';

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

interface Agents {
  buyer: AgentData;
  seller: AgentData;
  arbitrator: AgentData;
  contracts?: { escrow: string; reputationGate: string };
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agents | null>(null);
  const [prevReps, setPrevReps] = useState<Record<AgentRole, number>>({} as any);
  const [activeTab, setActiveTab] = useState<'happy' | 'dispute'>('happy');
  const [events, setEvents] = useState<LogEntry[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [showRepTerms, setShowRepTerms] = useState(false);
  const [happyCompleted, setHappyCompleted] = useState(false);
  const [disputeCompleted, setDisputeCompleted] = useState(false);
  const eventIdRef = useRef(0);

  const addEvent = useCallback((type: LogEntry['type'], message: string, link?: string) => {
    const now = new Date();
    const ts = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setEvents(prev => [...prev, { id: String(++eventIdRef.current), timestamp: ts, type, message, link }]);
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAgents(prev => {
        if (prev) {
          const changed: string[] = [];
          for (const role of ['buyer', 'seller', 'arbitrator'] as AgentRole[]) {
            if (prev[role].reputation !== data[role].reputation) {
              const delta = data[role].reputation - prev[role].reputation;
              changed.push(`${role}: ${delta > 0 ? '+' : ''}${delta}`);
            }
          }
          if (changed.length > 0) {
            addEvent('reputation', `Reputation updated — ${changed.join(', ')}`);
          }
          setPrevReps({ buyer: prev.buyer.reputation, seller: prev.seller.reputation, arbitrator: prev.arbitrator.reputation });
        }
        return data;
      });
      setConnectionStatus('connected');
    } catch {
      setConnectionStatus('error');
    }
  }, [addEvent]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const handleStepComplete = useCallback((path: string) => (step: string, data: any) => {
    if (data.txHash) {
      addEvent('tx', `${step}: ${data.txHash.slice(0, 20)}...`, data.explorerUrl);
    }
    if (data.specCid) {
      addEvent('upload', `Task spec uploaded: ${data.specCid.slice(0, 24)}...`, data.specRetrievalUrl);
    }
    if (data.deliverableCid) {
      addEvent('upload', `Deliverable uploaded: ${data.deliverableCid.slice(0, 24)}...`, data.deliverableRetrievalUrl);
    }
    if (data.reportCid) {
      addEvent('upload', `Arbitration report: ${data.reportCid.slice(0, 24)}...`, data.reportRetrievalUrl);
    }
    if (data.ruling) {
      addEvent('info', `Ruling: ${data.ruling} — ${data.winner || ''} wins`);
    }
    if (data.action) {
      addEvent('info', data.action);
    }
    if (data.repTxHash) {
      addEvent('reputation', `Reputation recorded on-chain`);
    }

    if (path === 'happy' && step === 'approve') {
      setHappyCompleted(true);
      addEvent('info', '✅ Happy path complete!');
    }
    if (path === 'dispute' && step === 'resolve') {
      setDisputeCompleted(true);
      setShowRepTerms(true);
      addEvent('info', '✅ Dispute path complete — checking reputation consequences...');
    }

    setTimeout(fetchAgents, 2000);
  }, [addEvent, fetchAgents]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Bar */}
      <header className="border-b border-[#2a2a40] bg-[#12121a]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-blue-400">Arbi</span>Chain
            </h1>
            <span className="text-xs text-[#3a3a55] font-mono">Live Demo</span>
          </div>

          <div className="flex items-center gap-6">
            <StatusDot status={connectionStatus} label="TRON Nile" />
            <StatusDot status={connectionStatus} label="Filecoin Calibration" />
            {agents?.contracts && (
              <a
                href={`${EXPLORER}/#/contract/${agents.contracts.escrow}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[#3a3a55] hover:text-[#71717a]"
              >
                Escrow: {agents.contracts.escrow.slice(0, 8)}...
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 py-6">
        <div className="grid grid-cols-12 gap-6 h-full">
          {/* Left Panel — Agent Cards */}
          <div className="col-span-3 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#3a3a55] px-1">Agents</h2>
            {agents ? (
              <>
                <AgentCard agent={agents.buyer} previousRep={prevReps.buyer} />
                <AgentCard agent={agents.seller} previousRep={prevReps.seller} />
                <AgentCard agent={agents.arbitrator} previousRep={prevReps.arbitrator} />
              </>
            ) : (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="card p-4 h-36 animate-pulse bg-[#1a1a2e]" />
                ))}
              </div>
            )}

            <button
              onClick={fetchAgents}
              className="w-full py-2 text-xs text-[#71717a] hover:text-white border border-[#2a2a40] rounded-lg hover:border-[#3a3a55] transition-colors"
            >
              Refresh Balances
            </button>
          </div>

          {/* Center Panel — Demo Flow */}
          <div className="col-span-6 space-y-4">
            <div className="flex items-center gap-1 bg-[#12121a] rounded-lg p-1">
              <button
                onClick={() => setActiveTab('happy')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'happy'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'text-[#71717a] hover:text-white'
                }`}
              >
                Happy Path {happyCompleted && '✓'}
              </button>
              <button
                onClick={() => setActiveTab('dispute')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'dispute'
                    ? 'bg-red-600/20 text-red-400 border border-red-500/30'
                    : 'text-[#71717a] hover:text-white'
                }`}
              >
                Dispute Path {disputeCompleted && '✓'}
              </button>
            </div>

            {activeTab === 'happy' ? (
              <div className="space-y-4">
                <div className="px-1">
                  <h3 className="text-sm font-semibold text-emerald-400">Happy Path</h3>
                  <p className="text-xs text-[#71717a] mt-1">
                    Task → Deliver → Approve → Funds release, both reputations go up
                  </p>
                </div>
                <DemoStepper
                  steps={HAPPY_STEPS}
                  apiPath="/api/demo/happy"
                  onStepComplete={handleStepComplete('happy')}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="px-1">
                  <h3 className="text-sm font-semibold text-red-400">Dispute Path</h3>
                  <p className="text-xs text-[#71717a] mt-1">
                    Task → Garbage delivery → Dispute → Arbitrator rules refund, seller's reputation drops
                  </p>
                </div>
                <DemoStepper
                  steps={DISPUTE_STEPS}
                  apiPath="/api/demo/dispute"
                  onStepComplete={handleStepComplete('dispute')}
                />
              </div>
            )}
          </div>

          {/* Right Panel — Event Log + Reputation */}
          <div className="col-span-3 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#3a3a55] px-1">Event Log</h2>
            <div className="card p-3 min-h-[300px]">
              <EventLog entries={events} />
            </div>
            <ReputationTerms show={showRepTerms} />
          </div>
        </div>
      </main>
    </div>
  );
}
