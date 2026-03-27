'use client';

import { useState, useRef, useEffect } from 'react';
import StepResult from './StepResult';

interface Step {
  id: string;
  label: string;
  description: string;
  icon: string;
}

interface Props {
  steps: Step[];
  apiPath: string;
  onStepComplete: (step: string, data: any) => void;
  disabled?: boolean;
}

export default function DemoStepper({ steps, apiPath, onStepComplete, disabled }: Props) {
  const [completedSteps, setCompletedSteps] = useState<Record<string, any>>({});
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const runStep = async (stepId: string) => {
    setActiveStep(stepId);
    setElapsed(0);

    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);

    try {
      const res = await fetch(apiPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step: stepId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'API error');

      setCompletedSteps(prev => ({ ...prev, [stepId]: data }));
      onStepComplete(stepId, data);
    } catch (err: any) {
      setCompletedSteps(prev => ({ ...prev, [stepId]: { error: err.message } }));
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setActiveStep(null);
    }
  };

  const getStepIndex = (stepId: string) => steps.findIndex(s => s.id === stepId);
  const completedIds = Object.keys(completedSteps);

  const isUnlocked = (stepId: string) => {
    const idx = getStepIndex(stepId);
    if (idx === 0) return true;
    return completedSteps[steps[idx - 1].id] && !completedSteps[steps[idx - 1].id].error;
  };

  return (
    <div className="space-y-3">
      {steps.map((step, i) => {
        const isCompleted = !!completedSteps[step.id] && !completedSteps[step.id]?.error;
        const isError = !!completedSteps[step.id]?.error;
        const isActive = activeStep === step.id;
        const canRun = isUnlocked(step.id) && !isActive && !isCompleted && !disabled;

        return (
          <div key={step.id} className="relative">
            {i < steps.length - 1 && (
              <div className={`absolute left-[19px] top-[48px] w-0.5 h-[calc(100%-28px)] ${isCompleted ? 'bg-emerald-500/50' : 'bg-[#2a2a40]'}`} />
            )}

            <div className={`card p-4 transition-all ${isActive ? 'border-blue-500/50 glow-blue' : isCompleted ? 'border-emerald-500/30' : isError ? 'border-red-500/30' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm shrink-0 ${
                  isCompleted ? 'bg-emerald-500/20 text-emerald-400' : isActive ? 'bg-blue-500/20 text-blue-400' : isError ? 'bg-red-500/20 text-red-400' : 'bg-[#12121a] text-[#71717a]'
                }`}>
                  {isCompleted ? '✓' : isActive ? (
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                  ) : step.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold">{step.label}</h4>
                      <p className="text-xs text-[#71717a] mt-0.5">{step.description}</p>
                    </div>

                    {isActive && (
                      <div className="flex items-center gap-2 text-xs text-blue-400 shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        {elapsed}s
                      </div>
                    )}

                    {!isActive && !isCompleted && (
                      <button
                        onClick={() => runStep(step.id)}
                        disabled={!canRun}
                        className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                          canRun
                            ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                            : 'bg-[#12121a] text-[#3a3a55] cursor-not-allowed'
                        }`}
                      >
                        Run
                      </button>
                    )}
                  </div>

                  {isCompleted && completedSteps[step.id] && (
                    <div className="mt-3">
                      <StepResult data={completedSteps[step.id]} />
                    </div>
                  )}

                  {isError && (
                    <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded p-2">
                      Error: {completedSteps[step.id].error}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
