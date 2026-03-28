"use client"

import { ExternalLink, Server, FileCode } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/copy-button"

interface NetworkPanelProps {
  network: string
  explorer: string
  contracts: {
    escrow: string
    reputationGate: string
  }
}

export function NetworkPanel({
  network,
  explorer,
  contracts,
}: NetworkPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Network & Contracts</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Network</span>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-success" />
            <span className="font-mono text-sm">{network}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Explorer</span>
          <a
            href={explorer}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-mono text-sm text-primary hover:underline"
          >
            {explorer.replace("https://", "")}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        <div className="space-y-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Contracts</span>
          </div>

          <div className="space-y-2">
            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Escrow Contract
                </span>
                <CopyButton value={contracts.escrow} />
              </div>
              <code className="mt-1 block truncate font-mono text-xs">
                {contracts.escrow}
              </code>
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Reputation Gate
                </span>
                <CopyButton value={contracts.reputationGate} />
              </div>
              <code className="mt-1 block truncate font-mono text-xs">
                {contracts.reputationGate}
              </code>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
