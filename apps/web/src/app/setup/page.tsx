"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScriptBlock } from "@/components/onboarding/script-block";
import { getSetupSteps } from "@/lib/setup-steps";
import {
  deriveExperienceLevel,
  type OS,
  type AITool,
  type Goal,
  type Experience,
} from "@/lib/onboarding";

function SetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const os = (searchParams.get("os") ?? "windows") as OS;
  const tool = (searchParams.get("tool") ?? "claude-code") as AITool;
  const goal = (searchParams.get("goal") ?? "website") as Goal;
  const experiences = (searchParams.get("exp") ?? "none").split(",") as Experience[];
  const projectName = searchParams.get("project") ?? "my-first-app";

  const level = deriveExperienceLevel(experiences);
  const steps = getSetupSteps(os, tool, goal, level, projectName);

  const [completed, setCompleted] = useState<Set<string>>(new Set());

  function toggleComplete(stepId: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  }

  function isStepActive(index: number): boolean {
    if (index === 0) return true;
    return completed.has(steps[index - 1].id);
  }

  const allDone = steps.every((s) => completed.has(s.id));

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold">단계별 설치</h1>
        <p className="mb-4 text-center text-muted-foreground">
          각 단계의 명령어를 복사해서 터미널에 붙여넣으세요
        </p>

        {/* 진행 상황 */}
        <div className="mb-10 text-center text-sm text-muted-foreground">
          {completed.size} / {steps.length} 완료
        </div>

        {/* 스텝 리스트 */}
        <div className="flex flex-col gap-6">
          {steps.map((step, i) => {
            const active = isStepActive(i);
            const done = completed.has(step.id);

            return (
              <div
                key={step.id}
                className={`rounded-xl border-2 p-6 transition-all ${
                  done
                    ? "border-success/50 bg-success/5"
                    : active
                      ? "border-primary/50 bg-card"
                      : "border-border/30 bg-card/50 opacity-50"
                }`}
              >
                {/* 헤더 */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        done
                          ? "bg-success text-success-foreground"
                          : active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 상세 가이드 (초보자용) */}
                {active && step.detailedGuide && (
                  <div className="mb-4 rounded-lg bg-primary/5 p-4 text-sm text-muted-foreground">
                    {step.detailedGuide}
                  </div>
                )}

                {/* 스크립트 */}
                {active && step.script && (
                  <div className="mb-4">
                    <ScriptBlock script={step.script} />
                  </div>
                )}

                {/* 완료 버튼 */}
                {active && (
                  <Button
                    variant={done ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleComplete(step.id)}
                  >
                    {done ? "완료 취소" : "완료했어요!"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* 모든 단계 완료 */}
        {allDone && (
          <div className="mt-10 text-center">
            <Button
              size="lg"
              className="h-12 px-8 text-base"
              onClick={() => router.push("/complete")}
            >
              완료! 다음으로
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupContent />
    </Suspense>
  );
}
