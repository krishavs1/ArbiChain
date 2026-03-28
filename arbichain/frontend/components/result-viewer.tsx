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
  const reviewWindowSeconds =
    typeof result.reviewWindowSeconds === "number"
      ? result.reviewWindowSeconds
      : null
  const deliverBy =
    typeof result.deliverBy === "number"
      ? new Date((result.deliverBy as number) * 1000).toLocaleString()
      : null

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

        {result.taskSpec && (() => {
          const spec = result.taskSpec as Record<string, any>;
          return (
            <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-sm font-semibold">{spec.title}</p>
              <p className="text-xs text-muted-foreground">{spec.description}</p>
              {spec.requirements && Array.isArray(spec.requirements) && (
                <div className="space-y-1 pt-1">
                  <p className="text-xs font-medium text-muted-foreground">Requirements:</p>
                  {spec.requirements.map((req: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="text-primary">&#8226;</span>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {result.amount && (
          <div className="flex items-center justify-between rounded-lg border bg-primary/5 p-3">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-semibold text-primary">
              {result.amount as string}
            </span>
          </div>
        )}

        {deliverBy && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Delivery Deadline</span>
            <span className="font-mono text-xs">{deliverBy}</span>
          </div>
        )}

        {reviewWindowSeconds !== null && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Review Window</span>
            <span className="font-mono text-sm">{reviewWindowSeconds}s</span>
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

        {result.reputationUpdate && Array.isArray(result.reputationUpdate) && (
          <div className="space-y-2 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-sm font-medium">Reputation Updates</p>
            {(result.reputationUpdate as any[]).map((u: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{u.agent} — {u.reason}</span>
                <Badge variant="outline" className={
                  u.change.startsWith('+')
                    ? "bg-success/10 text-success border-success/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }>
                  {u.change}
                </Badge>
              </div>
            ))}
          </div>
        )}

        {result.tokenRewards && Array.isArray(result.tokenRewards) && (
          <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-sm font-medium">ARBI Token Rewards</p>
            {(result.tokenRewards as any[]).map((t: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t.agent} — {t.reason}</span>
                <Badge variant="outline" className={
                  t.change.startsWith('+')
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                    : "bg-destructive/10 text-destructive border-destructive/20"
                }>
                  {t.change}
                </Badge>
              </div>
            ))}
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

        {result.voter && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Voter</span>
            <span className="text-sm font-medium">{result.voter as string}</span>
          </div>
        )}

        {result.panelResolved !== undefined && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Panel Status</span>
            <Badge variant={result.panelResolved ? "default" : "outline"}>
              {result.panelResolved ? "Resolved" : "Awaiting more votes"}
            </Badge>
          </div>
        )}

        {(result.disputeOpenedBy || result.disputeReason) && (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">Dispute Metadata</p>
            {result.disputeOpenedBy && (
              <p className="mt-1 text-muted-foreground">
                Opened by: {String(result.disputeOpenedBy)}
              </p>
            )}
            {result.disputeReason && (
              <p className="text-muted-foreground">
                Reason code: {String(result.disputeReason)}
              </p>
            )}
          </div>
        )}

        {(result.ruling !== undefined || result.rulingLabel) && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm text-muted-foreground">Ruling</span>
            <Badge
              variant={
                winner === "buyer" || String(result.rulingLabel || result.ruling).toLowerCase().includes("refund")
                  ? "destructive" : "default"
              }
            >
              {(result.rulingLabel || result.ruling) as string}
            </Badge>
          </div>
        )}

        {(result.contentBody || result.contentPreview) && (
          <div className="space-y-2 rounded-lg border p-3">
            <p className="text-sm font-medium">
              {result.aiModel ? "AI-Generated Content" : "Content Preview"}
            </p>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed">
              {(result.contentBody || result.contentPreview) as string}
            </p>
          </div>
        )}

        {result.aiModel && (
          <div className="flex items-center justify-between rounded-lg border bg-purple-500/5 p-3">
            <span className="text-sm text-muted-foreground">AI Model</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">
                {result.aiModel as string}
              </Badge>
              {result.aiTokensUsed && (
                <span className="text-xs text-muted-foreground">{String(result.aiTokensUsed)} tokens</span>
              )}
            </div>
          </div>
        )}

        {result.aiReview && (() => {
          const review = result.aiReview as Record<string, any>;
          return (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">AI Buyer Review</p>
                <div className="flex items-center gap-2">
                  <Badge variant={review.approved ? "default" : "destructive"}>
                    {review.approved ? "Approved" : "Rejected"}
                  </Badge>
                  <span className="text-sm font-semibold">{review.overallScore}/100</span>
                </div>
              </div>
              {review.reasoning && (
                <p className="text-xs text-muted-foreground italic">&ldquo;{review.reasoning}&rdquo;</p>
              )}
              {review.rubric && Array.isArray(review.rubric) && (
                <div className="space-y-1">
                  {review.rubric.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 rounded bg-muted/50 px-2 py-1.5 text-xs">
                      <span className={cn("mt-0.5 font-bold", item.met ? "text-success" : "text-destructive")}>
                        {item.met ? "✓" : "✗"}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium">{item.requirement}</span>
                        {item.comment && <span className="text-muted-foreground"> — {item.comment}</span>}
                      </div>
                      <span className="font-mono text-muted-foreground">{item.score}/100</span>
                    </div>
                  ))}
                </div>
              )}
              {review.model && (
                <p className="text-xs text-muted-foreground">Model: {review.model}</p>
              )}
            </div>
          );
        })()}

        {result.aiAnalysis && (() => {
          const a = result.aiAnalysis as Record<string, any>;
          return (
            <div className="space-y-3 rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">AI Arbitrator Analysis</p>
                <div className="flex items-center gap-2">
                  <Badge variant={a.ruling === 'REFUND_BUYER' ? "destructive" : "default"}>
                    {a.ruling}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{a.confidence}% confidence</span>
                </div>
              </div>
              {a.rationale && (
                <p className="text-xs text-muted-foreground italic border-l-2 border-purple-500/30 pl-2">
                  &ldquo;{a.rationale}&rdquo;
                </p>
              )}
              {a.requirementAnalysis && Array.isArray(a.requirementAnalysis) && (
                <div className="space-y-1">
                  <p className="text-xs font-medium">
                    Requirements: {a.requirementsMet}/{a.requirementsTotal} met
                  </p>
                  {a.requirementAnalysis.map((item: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 rounded bg-background/50 px-2 py-1.5 text-xs">
                      <span className={cn("mt-0.5 font-bold", item.met ? "text-success" : "text-destructive")}>
                        {item.met ? "✓" : "✗"}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium">{item.requirement}</span>
                        {item.evidence && <span className="text-muted-foreground"> — {item.evidence}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {a.mitigatingFactors && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium">Mitigating factors:</span> {a.mitigatingFactors}
                </p>
              )}
              {a.model && (
                <p className="text-xs text-muted-foreground">Model: {a.model}</p>
              )}
            </div>
          );
        })()}

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
