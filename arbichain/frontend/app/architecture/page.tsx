"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const agents = [
  { name: "Buyer Agent", model: "GPT-4o-mini", color: "bg-blue-500", role: "Creates tasks, reviews deliverables, opens disputes" },
  { name: "Seller Agent", model: "GPT-4o-mini", color: "bg-green-500", role: "Generates content from task specs, submits on-chain" },
  { name: "Arbitrator Agent", model: "GPT-4o-mini", color: "bg-purple-500", role: "Analyzes evidence, produces ruling with rationale" },
]

const layers = [
  { name: "AI Layer", color: "border-purple-500/30 bg-purple-500/5", items: ["GPT-4o-mini content generation", "Structured rubric evaluation", "Evidence analysis with confidence scoring", "Logged rationale for permanent record"] },
  { name: "Storage Layer — Filecoin", color: "border-blue-500/30 bg-blue-500/5", items: ["Task specs stored as PieceCIDs via Synapse SDK", "Deliverables with PDP storage proofs", "Arbitration reports — immutable audit trail", "Calibration testnet with real storage deals"] },
  { name: "Settlement Layer — TRON", color: "border-red-500/30 bg-red-500/5", items: ["Escrow.sol — holds funds, enforces deadlines", "ArbitratorPool.sol — 3-member panel, 2/3 majority", "ArbiToken.sol — staking, rewards, slashing", "ReputationGate.sol — on-chain reputation (0-1000)"] },
]

export default function ArchitecturePage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header
          title="Architecture"
          description="Full agentic workflow — from task creation to dispute resolution"
        />
        <main className="flex-1 p-6 space-y-8">

          {/* Agents */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map((a) => (
              <Card key={a.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className={`h-3 w-3 rounded-full ${a.color}`} />
                    {a.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="mb-2 text-xs">{a.model}</Badge>
                  <p className="text-xs text-muted-foreground">{a.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main flow diagram */}
          <Card>
            <CardHeader>
              <CardTitle>Happy Path Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-stretch gap-0">
                <FlowStep
                  number={1}
                  title="Create Task"
                  agent="Buyer"
                  agentColor="bg-blue-500"
                  actions={["Upload task spec to Filecoin", "Escrow TRX on TRON", "Set delivery & review deadlines"]}
                  arrow
                />
                <FlowStep
                  number={2}
                  title="Generate & Submit"
                  agent="Seller AI"
                  agentColor="bg-green-500"
                  actions={["GPT reads spec from Filecoin CID", "Generates quality content", "Uploads deliverable to Filecoin", "Submits CID on-chain"]}
                  arrow
                />
                <FlowStep
                  number={3}
                  title="Review & Approve"
                  agent="Buyer AI"
                  agentColor="bg-blue-500"
                  actions={["Retrieves deliverable from Filecoin", "Evaluates against structured rubric", "Scores each requirement (0-100)", "Approves → funds released to seller"]}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dispute Path Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-stretch gap-0">
                <FlowStep
                  number={1}
                  title="Low-Effort Submit"
                  agent="Seller AI"
                  agentColor="bg-green-500"
                  actions={["GPT in lazy mode", "Produces inadequate content", "Submits garbage on-chain"]}
                  arrow
                  variant="destructive"
                />
                <FlowStep
                  number={2}
                  title="AI Review & Reject"
                  agent="Buyer AI"
                  agentColor="bg-blue-500"
                  actions={["Rubric: 0/100 score", "All requirements failed", "Opens dispute on-chain", "Panel of 3 assigned"]}
                  arrow
                  variant="destructive"
                />
                <FlowStep
                  number={3}
                  title="AI Arbitration"
                  agent="Arbitrator AI"
                  agentColor="bg-purple-500"
                  actions={["Deep evidence analysis", "Ruling + confidence score", "Written rationale", "Report stored on Filecoin"]}
                  arrow
                  variant="destructive"
                />
                <FlowStep
                  number={4}
                  title="Panel Votes"
                  agent="3-Member Panel"
                  agentColor="bg-purple-500"
                  actions={["Each votes independently", "2/3 majority auto-resolves", "Loser's TRX refunded to winner", "Correct voters earn ARBI rewards"]}
                  variant="destructive"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stack layers */}
          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {layers.map((layer) => (
                <div key={layer.name} className={`rounded-lg border p-4 ${layer.color}`}>
                  <p className="text-sm font-semibold mb-2">{layer.name}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {layer.items.map((item, i) => (
                      <p key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="text-primary">&#8226;</span> {item}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Economic model */}
          <Card>
            <CardHeader>
              <CardTitle>Token Economics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Two tokens: <strong>TRX</strong> flows through escrow (buyer → seller or refund). <strong>ARBI</strong> is the arbitrator incentive token — staked to join, earned for honest voting, slashed for dishonesty.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="font-medium">Staking (ARBI)</p>
                  <p className="text-xs text-muted-foreground">Arbitrators stake 100 ARBI to join the pool. Stake is locked while active and at risk during disputes.</p>
                </div>
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="font-medium">Rewards (ARBI)</p>
                  <p className="text-xs text-muted-foreground">Correct voters (majority side) earn +10 ARBI per dispute. Minted fresh by the ArbiToken contract.</p>
                </div>
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="font-medium">Slashing (ARBI)</p>
                  <p className="text-xs text-muted-foreground">Minority voters lose 5 ARBI from their stake. Burned to reduce supply. Incentivizes honest voting.</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Escrow funds (TRX)</strong> are separate — when a dispute resolves, the escrowed TRX goes directly to the winner (buyer refund or seller payment). Arbitrators never touch the escrow funds; they're incentivized purely through ARBI token economics.
                </p>
              </div>
            </CardContent>
          </Card>

        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function FlowStep({
  number,
  title,
  agent,
  agentColor,
  actions,
  arrow,
  variant,
}: {
  number: number
  title: string
  agent: string
  agentColor: string
  actions: string[]
  arrow?: boolean
  variant?: "destructive"
}) {
  return (
    <div className="flex items-stretch flex-1">
      <div className={`flex-1 rounded-lg border p-4 space-y-2 ${
        variant === "destructive" ? "border-destructive/20" : "border-border"
      }`}>
        <div className="flex items-center gap-2">
          <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
            variant === "destructive" ? "bg-destructive" : "bg-primary"
          }`}>
            {number}
          </span>
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`h-2 w-2 rounded-full ${agentColor}`} />
          <span className="text-xs text-muted-foreground">{agent}</span>
        </div>
        <div className="space-y-1 pt-1">
          {actions.map((a, i) => (
            <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
              <span className="text-muted-foreground/50 mt-0.5">→</span> {a}
            </p>
          ))}
        </div>
      </div>
      {arrow && (
        <div className="hidden md:flex items-center px-1">
          <svg width="20" height="20" viewBox="0 0 20 20" className="text-muted-foreground/40">
            <path d="M4 10h10M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  )
}
