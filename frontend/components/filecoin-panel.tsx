"use client"

import { HardDrive, CheckCircle2, AlertCircle, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface FilecoinStatus {
  provider: string
  configured: boolean
  ready: boolean
  balance?: string
  network?: string
  message?: string | null
  error?: string
}

interface FilecoinPanelProps {
  status: FilecoinStatus
}

export function FilecoinPanel({ status }: FilecoinPanelProps) {
  const getStatusInfo = () => {
    if (status.error) {
      return {
        icon: XCircle,
        label: "Error",
        color: "text-destructive",
        bgColor: "bg-destructive/10",
      }
    }
    if (status.ready) {
      return {
        icon: CheckCircle2,
        label: "Ready",
        color: "text-success",
        bgColor: "bg-success/10",
      }
    }
    if (status.configured) {
      return {
        icon: AlertCircle,
        label: "Not Funded",
        color: "text-warning",
        bgColor: "bg-warning/10",
      }
    }
    return {
      icon: XCircle,
      label: "Not Configured",
      color: "text-muted-foreground",
      bgColor: "bg-muted",
    }
  }

  const statusInfo = getStatusInfo()
  const StatusIcon = statusInfo.icon

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Filecoin Storage</CardTitle>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "flex items-center gap-1",
              statusInfo.bgColor,
              statusInfo.color
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {statusInfo.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Provider</span>
          <Badge variant="secondary" className="font-mono">
            {status.provider}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Configured</span>
          <span className={status.configured ? "text-success" : "text-muted-foreground"}>
            {status.configured ? "Yes" : "No"}
          </span>
        </div>

        {status.ready && status.balance && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Balance</span>
            <span className="font-mono text-sm">{status.balance}</span>
          </div>
        )}

        {status.ready && status.network && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Network</span>
            <span className="font-mono text-sm">{status.network}</span>
          </div>
        )}

        {(status.message || status.error) && (
          <div
            className={cn(
              "mt-2 rounded-lg border p-3 text-sm",
              status.error
                ? "border-destructive/20 bg-destructive/5 text-destructive"
                : "border-warning/20 bg-warning/5 text-warning"
            )}
          >
            {status.error || status.message}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
