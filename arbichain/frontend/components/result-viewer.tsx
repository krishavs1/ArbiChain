"use client"

import { useState } from "react"
import {
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  Hash,
  Link2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/copy-button"
import { cn } from "@/lib/utils"

interface ResultViewerProps {
  result: Record<string, unknown>
  title: string
  className?: string
}

export function ResultViewer({ result, title, className }: ResultViewerProps) {
  const [showRaw, setShowRaw] = useState(false)
  const winner = result.winner ? String(result.winner).toLowerCase() : null

  const getHighlightedFields = () => {
    const highlights: { label: string; value: string; icon: React.ReactNode }[] =
      []

    if (result.taskId) {
      highlights.push({
        label: "Task ID",
        value: result.taskId as string,
        icon: <Hash className="h-4 w-4" />,
      })
    }

    if (result.specCid) {
      highlights.push({
        label: "Spec CID",
        value: result.specCid as string,
        icon: <FileText className="h-4 w-4" />,
      })
    }

    if (result.deliverableCid) {
      highlights.push({
        label: "Deliverable CID",
        value: result.deliverableCid as string,
        icon: <FileText className="h-4 w-4" />,
      })
    }

    if (result.reportCid) {
      highlights.push({
        label: "Report CID",
        value: result.reportCid as string,
        icon: <FileText className="h-4 w-4" />,
      })
    }

    if (result.txHash) {
      highlights.push({
        label: "Transaction Hash",
        value: result.txHash as string,
        icon: <Hash className="h-4 w-4" />,
      })
    }

    return highlights
  }

  const getLinks = () => {
    const links: { label: string; url: string }[] = []

    if (result.explorerUrl) {
      links.push({
        label: "View on Explorer",
        url: result.explorerUrl as string,
      })
    }

    if (result.specRetrievalUrl) {
      links.push({
        label: "View Task Spec",
        url: result.specRetrievalUrl as string,
      })
    }

    if (result.deliverableRetrievalUrl) {
      links.push({
        label: "View Deliverable",
        url: result.deliverableRetrievalUrl as string,
      })
    }

    if (result.reportRetrievalUrl) {
      links.push({
        label: "View Report",
        url: result.reportRetrievalUrl as string,
      })
    }

    return links
  }

  const highlights = getHighlightedFields()
  const links = getLinks()

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-muted/30 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Badge variant="outline" className="bg-success/10 text-success">
              Success
            </Badge>
            {title}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRaw(!showRaw)}
          >
            {showRaw ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" />
                Hide Raw
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-4 w-4" />
                Show Raw
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {highlights.length > 0 && (
          <div className="space-y-3">
            {highlights.map((field) => (
              <div
                key={field.label}
                className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3"
              >
                <div className="mt-0.5 text-primary">{field.icon}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <code className="mt-1 block truncate font-mono text-sm">
                    {field.value}
                  </code>
                </div>
                <CopyButton value={field.value} />
              </div>
            ))}
          </div>
        )}

        {result.amount && (
          <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-3">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-semibold text-primary">
              {result.amount as string}
            </span>
          </div>
        )}

        {result.wordCount && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Word Count</span>
            <span className="font-mono">{result.wordCount as number}</span>
          </div>
        )}

        {result.action && (
          <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-sm text-success">
            {result.action as string}
          </div>
        )}

        {result.reason && (
          <div className="rounded-lg border border-warning/20 bg-warning/5 p-3 text-sm text-warning-foreground">
            <p className="font-medium">Dispute Reason:</p>
            <p className="mt-1 text-muted-foreground">
              {result.reason as string}
            </p>
          </div>
        )}

        {result.ruling && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Ruling</span>
            <Badge
              variant={
                winner === "buyer" ? "destructive" : "default"
              }
            >
              {result.ruling as string}
            </Badge>
          </div>
        )}

        {result.analysis && (
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">Analysis</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {Object.entries(result.analysis as Record<string, unknown>).map(
                ([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded bg-muted/50 px-2 py-1"
                  >
                    <span className="text-muted-foreground">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span
                      className={cn(
                        "font-mono",
                        typeof value === "boolean"
                          ? value
                            ? "text-success"
                            : "text-destructive"
                          : ""
                      )}
                    >
                      {typeof value === "boolean"
                        ? value
                          ? "Yes"
                          : "No"
                        : String(value)}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border bg-background px-3 py-2 text-sm transition-colors hover:bg-muted"
              >
                <Link2 className="h-4 w-4 text-primary" />
                {link.label}
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            ))}
          </div>
        )}

        {showRaw && (
          <div className="relative rounded-lg border bg-muted/30 p-4">
            <pre className="overflow-x-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
