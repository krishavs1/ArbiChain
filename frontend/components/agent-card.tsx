"use client"

import { User, ShoppingCart, Gavel, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CopyButton } from "@/components/copy-button"
import { cn } from "@/lib/utils"

interface AgentData {
  address: string
  balance: string
  role: string
  reputation: number
  tier: string
  tasksCompleted: number
  tasksDisputed: number
  disputesWon: number
  disputesLost: number
  isRegistered: boolean
  arbiBalance?: number
}

interface AgentCardProps {
  agent: AgentData
  title: string
}

const roleIcons = {
  buyer: ShoppingCart,
  seller: User,
  arbitrator: Gavel,
}

const tierColors: Record<string, string> = {
  Trusted: "bg-success/10 text-success border-success/20",
  Established: "bg-primary/10 text-primary border-primary/20",
  New: "bg-warning/10 text-warning border-warning/20",
  Untrusted: "bg-destructive/10 text-destructive border-destructive/20",
}

export function AgentCard({ agent, title }: AgentCardProps) {
  const roleKey = (agent.role || "").toLowerCase()
  const Icon = roleIcons[roleKey as keyof typeof roleIcons] || Shield
  const reputationScore = Number.isFinite(agent.reputation) ? agent.reputation : 0
  const reputationPercent = Math.max(
    0,
    Math.min(100, Math.round(reputationScore / 10))
  )

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
      <CardHeader className="relative flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge
              variant="outline"
              className={cn("mt-1 text-xs", tierColors[agent.tier] || "")}
            >
              {agent.tier}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{agent.balance}</p>
          <p className="text-xs text-muted-foreground">TRX Balance</p>
          {agent.arbiBalance != null && agent.arbiBalance > 0 && (
            <>
              <p className="text-sm font-semibold text-purple-500 mt-1">{agent.arbiBalance.toLocaleString()} ARBI</p>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="flex items-center gap-2">
          <a
            href={`https://nile.tronscan.org/#/address/${agent.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 truncate rounded bg-muted px-2 py-1 font-mono text-xs text-primary hover:underline"
          >
            {agent.address}
          </a>
          <CopyButton value={agent.address} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Reputation</span>
            <span className="font-medium">
              {reputationScore}/1000 ({reputationPercent}%)
            </span>
          </div>
          <Progress value={reputationPercent} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <p className="text-2xl font-bold">{agent.tasksCompleted}</p>
            <p className="text-xs text-muted-foreground">Tasks Completed</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold">{agent.tasksDisputed}</p>
            <p className="text-xs text-muted-foreground">Tasks Disputed</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-success">
              {agent.disputesWon}
            </p>
            <p className="text-xs text-muted-foreground">Disputes Won</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-destructive">
              {agent.disputesLost}
            </p>
            <p className="text-xs text-muted-foreground">Disputes Lost</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
