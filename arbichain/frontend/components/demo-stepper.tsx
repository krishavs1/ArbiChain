"use client"

import { Check, Loader2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Step {
  id: string
  label: string
  description: string
}

interface DemoStepperProps {
  steps: Step[]
  currentStep: number
  completedSteps: number[]
  loadingStep: number | null
}

export function DemoStepper({
  steps,
  currentStep,
  completedSteps,
  loadingStep,
}: DemoStepperProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index)
        const isCurrent = currentStep === index
        const isLoading = loadingStep === index

        return (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted
                    ? "border-success bg-success text-success-foreground"
                    : isCurrent
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 bg-muted text-muted-foreground"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mt-2 h-12 w-0.5",
                    isCompleted ? "bg-success" : "bg-muted-foreground/30"
                  )}
                />
              )}
            </div>
            <div className="flex-1 pb-8">
              <h4
                className={cn(
                  "font-semibold",
                  isCompleted
                    ? "text-success"
                    : isCurrent
                      ? "text-foreground"
                      : "text-muted-foreground"
                )}
              >
                {step.label}
              </h4>
              <p className="mt-1 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
