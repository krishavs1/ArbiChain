"use client"

import { useEffect, useState, useCallback } from "react"
import { RefreshCw, Pause, Play } from "lucide-react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { AgentCard } from "@/components/agent-card"
import { NetworkPanel } from "@/components/network-panel"
import { FilecoinPanel } from "@/components/filecoin-panel"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

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
}

interface OverviewData {
  buyer: AgentData
  seller: AgentData
  arbitrator: AgentData
  contracts: {
    escrow: string
    reputationGate: string
  }
  network: string
  explorer: string
  filecoin: {
    provider: string
    configured: boolean
    ready: boolean
    balance?: string
    network?: string
    message?: string | null
  }
}

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/agents")
      if (!res.ok) throw new Error("Failed to fetch data")
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 15000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchData])

  const handleRefresh = () => {
    setLoading(true)
    fetchData()
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header
          title="Overview"
          description="Monitor agents, contracts, and storage status"
        />
        <main className="flex-1 space-y-6 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-destructive">
              {error}
            </div>
          )}

          {loading && !data ? (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-[320px] rounded-lg" />
                ))}
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Skeleton className="h-[280px] rounded-lg" />
                <Skeleton className="h-[200px] rounded-lg" />
              </div>
            </div>
          ) : data ? (
            <div className="space-y-6">
              <section>
                <h3 className="mb-4 text-lg font-semibold text-muted-foreground">
                  Agents
                </h3>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <AgentCard agent={data.buyer} title="Buyer" />
                  <AgentCard agent={data.seller} title="Seller" />
                  <AgentCard agent={data.arbitrator} title="Arbitrator" />
                </div>
              </section>

              <section>
                <h3 className="mb-4 text-lg font-semibold text-muted-foreground">
                  Infrastructure
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <NetworkPanel
                    network={data.network}
                    explorer={data.explorer}
                    contracts={data.contracts}
                  />
                  <FilecoinPanel status={data.filecoin} />
                </div>
              </section>
            </div>
          ) : null}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
