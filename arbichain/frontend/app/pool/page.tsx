"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCcw, Zap, Users, Award, Coins } from "lucide-react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface ArbitratorInfo {
  address: string
  isActive: boolean
  stakedAmount: number
  totalVotes: number
  correctVotes: number
  earnedRewards: number
  tokenBalance: number
}

interface PoolStatus {
  enabled: boolean
  poolSize?: number
  totalDisputes?: number
  totalTokenSupply?: number
  arbitrators?: ArbitratorInfo[]
  panelSize?: number
  voteThreshold?: number
}

export default function PoolPage() {
  const [pool, setPool] = useState<PoolStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [setupLoading, setSetupLoading] = useState(false)

  const fetchPool = useCallback(async () => {
    try {
      const res = await fetch("/api/pool")
      const data = await res.json()
      setPool(data)
    } catch {
      setPool({ enabled: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPool() }, [fetchPool])

  const setupPool = async () => {
    setSetupLoading(true)
    try {
      const res = await fetch("/api/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setup" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Pool initialized with ${data.poolSize} arbitrators`)
      await fetchPool()
    } catch (err: any) {
      toast.error(err.message || "Failed to setup pool")
    } finally {
      setSetupLoading(false)
    }
  }

  const labels = ["Deployer", "Arbitrator", "Panel Member 3"]

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header
          title="Arbitrator Pool"
          description="Multi-sig dispute resolution with ARBI token staking and rewards"
        />
        <main className="flex-1 p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              Loading pool status...
            </div>
          ) : !pool?.enabled ? (
            <Card className="max-w-lg mx-auto">
              <CardHeader className="text-center">
                <CardTitle>Pool Not Configured</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  ARBI_TOKEN_ADDRESS and ARBITRATOR_POOL_ADDRESS are not set in .env.
                  Deploy the contracts first with <code className="text-xs bg-muted px-1 py-0.5 rounded">npm run migrate</code>.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-2xl font-bold">{pool.poolSize}</p>
                        <p className="text-xs text-muted-foreground">Pool Size</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-warning" />
                      <div>
                        <p className="text-2xl font-bold">{pool.totalDisputes}</p>
                        <p className="text-xs text-muted-foreground">Disputes Handled</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Coins className="h-5 w-5 text-emerald-500" />
                      <div>
                        <p className="text-2xl font-bold">{pool.totalTokenSupply?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">ARBI Supply</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="text-2xl font-bold">{pool.panelSize}/{pool.voteThreshold}</p>
                        <p className="text-xs text-muted-foreground">Panel / Threshold</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={fetchPool}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                {pool.poolSize === 0 && (
                  <Button size="sm" onClick={setupPool} disabled={setupLoading}>
                    {setupLoading ? "Setting up..." : "Initialize Pool (3 Arbitrators)"}
                  </Button>
                )}
              </div>

              {/* Arbitrator Cards */}
              <div className="grid gap-4 lg:grid-cols-3">
                {pool.arbitrators?.map((arb, i) => (
                  <Card key={arb.address}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{labels[i]}</CardTitle>
                        <Badge variant={arb.isActive ? "default" : "secondary"}>
                          {arb.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <a
                        href={`https://nile.tronscan.org/#/address/${arb.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-mono text-primary hover:underline truncate block"
                      >
                        {arb.address}
                      </a>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs">Staked</p>
                          <p className="font-semibold">{arb.stakedAmount} ARBI</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Balance</p>
                          <p className="font-semibold">{arb.tokenBalance.toLocaleString()} ARBI</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Total Votes</p>
                          <p className="font-semibold">{arb.totalVotes}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Rewards Earned</p>
                          <p className="font-semibold text-emerald-500">{arb.earnedRewards} ARBI</p>
                        </div>
                      </div>
                      {arb.totalVotes > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Accuracy</span>
                            <span>{Math.round((arb.correctVotes / arb.totalVotes) * 100)}%</span>
                          </div>
                          <Progress value={(arb.correctVotes / arb.totalVotes) * 100} className="h-2" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Economics Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Token Economics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3 text-sm">
                    <div className="space-y-1">
                      <p className="font-semibold text-emerald-500">+10 ARBI</p>
                      <p className="text-muted-foreground text-xs">Reward per correct vote (majority side)</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold text-destructive">-5 ARBI</p>
                      <p className="text-muted-foreground text-xs">Slashed from stake for minority vote</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-semibold">100 ARBI</p>
                      <p className="text-muted-foreground text-xs">Minimum stake to join the arbitrator pool</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
