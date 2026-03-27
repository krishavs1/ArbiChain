"use client"

import { useState } from "react"
import { RotateCcw, Play } from "lucide-react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { DemoStepper, type Step } from "@/components/demo-stepper"
import { ResultViewer } from "@/components/result-viewer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

const steps: Step[] = [
  {
    id: "create-task",
    label: "Create Task",
    description:
      "Buyer creates a task with requirements stored on Filecoin, escrows funds on TRON",
  },
  {
    id: "submit-garbage",
    label: "Submit Bad Deliverable",
    description:
      "Seller submits work that does not meet requirements (for demo purposes)",
  },
  {
    id: "open-dispute",
    label: "Open Dispute",
    description:
      "Buyer disputes the deliverable, triggering arbitration process",
  },
  {
    id: "resolve",
    label: "Arbitrator Resolves",
    description:
      "Arbitrator analyzes evidence and rules in favor of buyer (refund)",
  },
]

interface StepResult {
  step: string
  data: Record<string, unknown>
}

export default function DisputePathPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [loadingStep, setLoadingStep] = useState<number | null>(null)
  const [results, setResults] = useState<StepResult[]>([])
  const [error, setError] = useState<string | null>(null)

  const runStep = async (stepIndex: number) => {
    const step = steps[stepIndex]
    setLoadingStep(stepIndex)
    setError(null)

    try {
      const res = await fetch("/api/demo/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: step.id }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to execute step")
      }

      setResults((prev) => [...prev, { step: step.id, data }])
      setCompletedSteps((prev) => [...prev, stepIndex])
      setCurrentStep(stepIndex + 1)
      toast.success(`${step.label} completed successfully`)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"
      setError(message)
      toast.error(message)
    } finally {
      setLoadingStep(null)
    }
  }

  const reset = () => {
    setCurrentStep(0)
    setCompletedSteps([])
    setResults([])
    setError(null)
  }

  const isComplete = completedSteps.length === steps.length

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header
          title="Dispute Path Demo"
          description="Walk through a disputed task with arbitration flow"
        />
        <main className="flex-1 p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Demo Steps</CardTitle>
                  <Button variant="outline" size="sm" onClick={reset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </CardHeader>
                <CardContent>
                  <DemoStepper
                    steps={steps}
                    currentStep={currentStep}
                    completedSteps={completedSteps}
                    loadingStep={loadingStep}
                  />

                  <div className="mt-6 border-t pt-6">
                    {isComplete ? (
                      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-center">
                        <p className="font-semibold text-destructive">
                          Dispute Resolved!
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          The arbitrator ruled in favor of the buyer. Funds have
                          been refunded.
                        </p>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={() => runStep(currentStep)}
                        disabled={loadingStep !== null}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Run: {steps[currentStep].label}
                      </Button>
                    )}
                  </div>

                  {error && (
                    <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                      <p className="text-sm text-destructive">{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => runStep(currentStep)}
                      >
                        Retry
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-warning/20 bg-warning/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-warning">
                    About This Demo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    This demo simulates a dispute scenario where the seller
                    submits work that does not meet the task requirements. The
                    arbitrator analyzes the evidence and rules in favor of the
                    buyer, triggering a refund.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Results Log</h3>
              {results.length === 0 ? (
                <Card className="flex min-h-[200px] items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    Run a step to see results here
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {results.map((result, index) => (
                    <ResultViewer
                      key={index}
                      result={result.data}
                      title={
                        steps.find((s) => s.id === result.step)?.label ||
                        result.step
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
