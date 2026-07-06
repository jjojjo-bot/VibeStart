"use client";
import { useState, useRef, useCallback, useEffect, Suspense, useMemo } from "react";
import confetti from "canvas-confetti";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScriptBlock } from "@/components/onboarding/script-block";
import { StuckHelper } from "@/components/diagnosis/stuck-helper";
import { ScanGate } from "@/components/setup/scan-gate";
import {
  getSetupSteps,
  diagnosisStepFor,
  scanPrecompletedStepIds,
  WINDOWS_SCAN_SCRIPT,
  type SetupGroup,
} from "@/lib/setup-steps";
import {
  type OS,
  type Goal,
} from "@/lib/onboarding";
import type { ScanResult } from "@vibestart/shared-types";
import { useTranslations } from "next-intl";
import {
  trackSetupStart,
  trackSetupComplete,
  trackSetupScanShown,
  trackSetupScanResult,
  trackSetupScanSkipped,
} from "@/lib/ga";

const GROUP_ORDER: SetupGroup[] = ["envPrep", "toolInstall", "aiSetup", "projectCreate"];

function SetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("Setup");
  const ts = useTranslations("SetupSteps");

  const os = (searchParams.get("os") ?? "windows") as OS;
  const goal = (searchParams.get("goal") ?? "web-nextjs") as Goal;
  const projectName = searchParams.get("project") ?? "my-first-app";
  // 설치 경험 — 이상값·부재는 first 폴백(기존 링크·북마크 하위호환)
  const rawExp = searchParams.get("exp");
  const exp = rawExp === "prior" || rawExp === "unsure" ? rawExp : "first";

  const steps = getSetupSteps(os, goal, projectName, ts);
  const storageKey = `vibestart-progress-${os}-${goal}-${projectName}`;
  const scanKey = `vibestart-scan-${os}-${goal}-${projectName}`;

  const [openTroubleshooting, setOpenTroubleshooting] = useState<Set<string>>(new Set());

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);
  const [scanResolved, setScanResolved] = useState(false);

  // Group name mapping for translations
  const groupNameMap: Record<string, string> = {
    envPrep: t("groups.envPrep"),
    toolInstall: t("groups.toolInstall"),
    aiSetup: t("groups.aiSetup"),
    projectCreate: t("groups.projectCreate"),
  };

  // 마운트 시 localStorage에서 복원. localStorage는 서버에서 접근 불가하므로
  // useEffect 내 setState가 불가피하다. 이 한 번의 하이드레이션은 cascading
  // render를 일으키지 않는다 (storageKey는 함수형 상수).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCompleted(new Set<string>(JSON.parse(saved) as string[]));
      }
      // 스캔을 이미 완료/스킵했으면 게이트를 다시 띄우지 않는다 (재부팅 복귀 포함)
      if (localStorage.getItem(scanKey)) {
        setScanResolved(true);
      }
    } catch { /* 무시 */ }
    setHydrated(true);
    trackSetupStart(os, goal, os === "windows" ? exp : undefined);
  }, [storageKey, scanKey, os, goal, exp]);

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

  // 스캔 게이트 — Windows + 설치 경험자(prior/unsure) + 스캔 미완료일 때만.
  // exp=first(절대초보 기본 경로)는 게이트를 아예 만나지 않는다.
  const showScanGate = os === "windows" && exp !== "first" && hydrated && !scanResolved;

  const scanShownTracked = useRef(false);
  useEffect(() => {
    if (showScanGate && !scanShownTracked.current) {
      scanShownTracked.current = true;
      trackSetupScanShown();
    }
  }, [showScanGate]);

  function handleScanDone(result: ScanResult | null): void {
    try {
      localStorage.setItem(
        scanKey,
        JSON.stringify(result ? { status: "done", ...result } : { status: "skipped" }),
      );
    } catch { /* 무시 */ }
    if (result) {
      trackSetupScanResult(result.wsl ? "ok" : "missing", result.vscode ? "ok" : "missing");
      const precompleted = scanPrecompletedStepIds(result);
      if (precompleted.length > 0) {
        // 기존 진행과 합집합 — 스캔이 사용자의 이전 진행을 되돌리지 않는다
        setCompleted((prev) => new Set([...prev, ...precompleted]));
      }
    } else {
      trackSetupScanSkipped();
    }
    setScanResolved(true);
  }

  const allDone = steps.every((s) => completed.has(s.id));
  const progressPercent = Math.round((completed.size / steps.length) * 100);

  // 모든 단계 완료 시 폭죽 애니메이션
  const hasFired = useRef(false);
  useEffect(() => {
    if (allDone && !hasFired.current) {
      hasFired.current = true;
      // 좌우에서 교차 발사
      const end = Date.now() + 1500;
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ["#7c3aed", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#fbbf24"],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ["#7c3aed", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#fbbf24"],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
    if (!allDone) hasFired.current = false;
  }, [allDone]);

  return (
    <main id="main-content" className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold">{t("title")}</h1>
        <p className="mb-6 text-center text-muted-foreground">
          {t.rich("subtitle", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
        </p>

        {showScanGate ? (
          <ScanGate script={WINDOWS_SCAN_SCRIPT} onDone={handleScanDone} />
        ) : (
          <>
        {/* 프로그레스 바 + 그룹 뱃지 (스크롤 시 상단 고정) */}
        <div className="sticky top-0 z-10 -mx-6 mb-10 bg-background/80 px-6 pt-3 pb-3 backdrop-blur-sm">
          {/* 프로그레스 바 */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">{t("progressLabel")}</span>
              <span className="text-xs font-medium text-foreground">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted/50" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={t("progressAriaLabel")}>
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
                {groupDone ? "✓ " : ""}{groupNameMap[group] ?? group}
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
                      {groupNameMap[step.group] ?? step.group}
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

                {/* 재시작 체크포인트 — 이탈 1순위 지점, "진행상황 저장됨" 안심 배너 */}
                {active && step.requiresReboot && (
                  <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl" aria-hidden>
                        🔄
                      </span>
                      <div>
                        <p className="font-semibold text-amber-200">{step.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-amber-100/80">
                          {ts("reboot.safeNote")}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 이게 뭔가요? */}
                {active && step.whyNeeded && (
                  <div className="mb-3">
                    <button
                      aria-expanded={openTroubleshooting.has(`why-${step.id}`)}
                      onClick={() => setOpenTroubleshooting((prev) => {
                        const key = `why-${step.id}`;
                        const next = new Set(prev);
                        if (next.has(key)) next.delete(key);
                        else next.add(key);
                        return next;
                      })}
                      className="text-xs text-sky-400/70 hover:text-sky-400 transition-colors"
                    >
                      {openTroubleshooting.has(`why-${step.id}`) ? t("whyNeededToggle.open") : t("whyNeededToggle.closed")}
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
                  <div className="mb-4 whitespace-pre-line rounded-lg bg-primary/5 p-4 text-sm text-muted-foreground">
                    {step.detailedGuide}
                    {step.guideImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={step.guideImage.src}
                        alt={step.guideImage.alt}
                        className="mt-3 w-full max-w-2xl rounded-md border border-border/40"
                      />
                    )}
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
                    <p className="mb-1.5 text-xs text-muted-foreground/70">{t("resultPreviewLabel")}</p>
                    <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4">
                      <pre className="overflow-x-auto text-xs text-zinc-400 whitespace-pre-wrap leading-relaxed">
                        {step.resultPreview}
                      </pre>
                    </div>
                  </div>
                )}

                {/* CLAUDE.md 자동 생성 안내 (내용은 명령어 heredoc에 이미 포함 — 중복 표시 안 함) */}
                {active && step.claudeMdContent && (
                  <div className="mb-4">
                    <div className="rounded-lg bg-primary/5 p-3 text-sm text-muted-foreground">
                      {t.rich("claudeMdGuide", { code: (chunks) => <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{chunks}</code> })}
                    </div>
                  </div>
                )}

                {/* 트러블슈팅 */}
                {active && step.troubleshooting && step.troubleshooting.length > 0 && (
                  <div className="mb-4">
                    <button
                      aria-expanded={openTroubleshooting.has(step.id)}
                      onClick={() => setOpenTroubleshooting((prev) => {
                        const next = new Set(prev);
                        if (next.has(step.id)) next.delete(step.id);
                        else next.add(step.id);
                        return next;
                      })}
                      className="text-sm text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      {openTroubleshooting.has(step.id) ? t("troubleshootingToggle.open") : t("troubleshootingToggle.closed")}
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
                    {done ? t("undoCompleteButton") : t("completeButton")}
                  </Button>
                )}

                {active && (
                  <div className="mt-3 border-t border-border/30 pt-3">
                    <StuckHelper step={diagnosisStepFor(step)} />
                  </div>
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
              className="h-12 px-8 text-base animate-pulse"
              onClick={() => {
                trackSetupComplete(os, goal);
                const params = new URLSearchParams({ os, goal, project: projectName });
                router.push(`/complete?${params.toString()}`);
              }}
            >
              {t("allDoneButton")}
            </Button>
          </div>
        )}
          </>
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
