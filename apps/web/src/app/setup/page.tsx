"use client";

import { useState, useRef, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScriptBlock } from "@/components/onboarding/script-block";
import { getSetupSteps, type SetupGroup } from "@/lib/setup-steps";
import {
  type OS,
  type Goal,
} from "@/lib/onboarding";

const GROUP_ORDER: SetupGroup[] = ["환경 준비", "도구 설치", "AI 설정", "프로젝트 생성"];


function SetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const os = (searchParams.get("os") ?? "windows") as OS;
  const goal = (searchParams.get("goal") ?? "web-nextjs") as Goal;
  const projectName = searchParams.get("project") ?? "my-first-app";

  const steps = getSetupSteps(os, goal, projectName);
  const storageKey = `vibestart-progress-${os}-${goal}-${projectName}`;

  const [openTroubleshooting, setOpenTroubleshooting] = useState<Set<string>>(new Set());

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // 마운트 시 localStorage에서 복원
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) setCompleted(new Set<string>(JSON.parse(saved) as string[]));
    } catch { /* 무시 */ }
    setHydrated(true);
  }, [storageKey]);

  // 완료 상태 변경 시 저장 (hydration 완료 후에만)
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify([...completed]));
    } catch { /* localStorage 접근 불가 시 무시 */ }
  }, [completed, storageKey, hydrated]);



  const stepRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const setStepRef = useCallback((id: string, el: HTMLDivElement | null) => {
    if (el) stepRefs.current.set(id, el);
    else stepRefs.current.delete(id);
  }, []);

  function toggleComplete(stepId: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
        // 다음 단계로 자동 스크롤
        const currentIndex = steps.findIndex((s) => s.id === stepId);
        const nextStep = steps[currentIndex + 1];
        if (nextStep) {
          setTimeout(() => {
            stepRefs.current.get(nextStep.id)?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }, 100);
        }
      }
      return next;
    });
  }

  function isStepActive(index: number): boolean {
    if (index === 0) return true;
    return completed.has(steps[index - 1].id);
  }

  const allDone = steps.every((s) => completed.has(s.id));
  const progressPercent = Math.round((completed.size / steps.length) * 100);

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold">단계별 설치</h1>
        <p className="mb-6 text-center text-muted-foreground">
          각 단계의 명령어를 <strong className="text-foreground">복사 버튼</strong>으로 복사해서 터미널에 붙여넣으세요
        </p>

        {/* 프로그레스 바 + 그룹 뱃지 (스크롤 시 상단 고정) */}
        <div className="sticky top-0 z-10 -mx-6 mb-10 bg-background/80 px-6 pt-3 pb-3 backdrop-blur-sm">
          {/* 프로그레스 바 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">진행률</span>
              <span className="text-xs font-medium text-foreground">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-success transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* 그룹별 진행 상황 */}
          <div className="flex justify-center gap-3">
          {GROUP_ORDER.filter((g) => steps.some((s) => s.group === g)).map((group) => {
            const groupSteps = steps.filter((s) => s.group === group);
            const groupDone = groupSteps.every((s) => completed.has(s.id));
            const groupActive = !groupDone && groupSteps.some((_, idx) => {
              const globalIdx = steps.indexOf(groupSteps[idx]);
              return isStepActive(globalIdx) && !completed.has(groupSteps[idx].id);
            });
            return (
              <div
                key={group}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                  groupDone
                    ? "bg-success text-success-foreground shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                    : groupActive
                      ? "animate-pulse bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/50"
                      : "bg-muted/50 text-muted-foreground/60"
                }`}
              >
                {groupDone ? "✓ " : ""}{group}
              </div>
            );
          })}
          </div>
        </div>

        {/* 스텝 리스트 */}
        <div className="flex flex-col gap-6">
          {steps.map((step, i) => {
            const active = isStepActive(i);
            const done = completed.has(step.id);
            const isFirstInGroup = i === 0 || steps[i - 1].group !== step.group;
            return (
              <div key={step.id}>
                {/* 그룹 헤더 */}
                {isFirstInGroup && (
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {step.group}
                    </span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                )}

              <div
                ref={(el) => setStepRef(step.id, el)}
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{step.title}</h3>
                        {step.environment && (
                          <Badge variant="outline" className="text-xs font-normal">
                            {step.environment}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 이게 뭔가요? */}
                {active && step.whyNeeded && (
                  <div className="mb-3">
                    <button
                      onClick={() => setOpenTroubleshooting((prev) => {
                        const key = `why-${step.id}`;
                        const next = new Set(prev);
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      })}
                      className="text-xs text-sky-400/70 hover:text-sky-400 transition-colors"
                    >
                      {openTroubleshooting.has(`why-${step.id}`) ? "▾ 닫기" : "▸ 이게 뭔가요?"}
                    </button>
                    {openTroubleshooting.has(`why-${step.id}`) && (
                      <div className="mt-2 rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-300/90">
                        {step.whyNeeded}
                      </div>
                    )}
                  </div>
                )}

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

                {/* 실행 결과 예시 */}
                {active && step.resultPreview && (
                  <div className="mb-4">
                    <p className="mb-1.5 text-xs text-muted-foreground/70">실행 결과 예시</p>
                    <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4">
                      <pre className="overflow-x-auto text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                        {step.resultPreview}
                      </pre>
                    </div>
                  </div>
                )}

                {/* CLAUDE.md 파일 저장 안내 */}
                {active && step.claudeMdContent && (
                  <div className="mb-4">
                    <div className="mb-2 rounded-lg bg-primary/5 p-3 text-sm text-muted-foreground">
                      아래 내용을 복사해서 프로젝트 루트에 <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">CLAUDE.md</code> 파일로 저장해주세요.
                    </div>
                    <ScriptBlock script={step.claudeMdContent} />
                  </div>
                )}

                {/* 트러블슈팅 */}
                {active && step.troubleshooting && step.troubleshooting.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => setOpenTroubleshooting((prev) => {
                        const next = new Set(prev);
                        if (next.has(step.id)) next.delete(step.id);
                        else next.add(step.id);
                        return next;
                      })}
                      className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {openTroubleshooting.has(step.id) ? "▾ 닫기" : "▸ 문제가 생겼어요?"}
                    </button>
                    {openTroubleshooting.has(step.id) && (
                      <div className="mt-3 flex flex-col gap-3">
                        {step.troubleshooting.map((item, idx) => (
                          <div key={idx} className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                            <p className="text-sm font-medium text-amber-400">{item.symptom}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{item.solution}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 완료 버튼 */}
                {(active || done) && (
                  <Button
                    variant={done ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => toggleComplete(step.id)}
                  >
                    {done ? "완료 취소" : "완료했어요!"}
                  </Button>
                )}
              </div>
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
              onClick={() => {
                const params = new URLSearchParams({ os, goal, project: projectName });
                router.push(`/complete?${params.toString()}`);
              }}
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
