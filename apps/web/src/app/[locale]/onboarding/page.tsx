"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { incrementVisitors } from "@/lib/stats";
import { trackOnboardingStart, trackOnboardingComplete } from "@/lib/ga";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StepOS } from "@/components/onboarding/step-os";
import { StepExperience } from "@/components/onboarding/step-experience";
import { StepGoal } from "@/components/onboarding/step-goal";
import { StepAiTool } from "@/components/onboarding/step-ai-tool";
import { StepProjectName } from "@/components/onboarding/step-project-name";
import { SetupModePicker } from "@/components/onboarding/setup-mode-picker";
import { SetupModeIcon } from "@/components/onboarding/setup-mode-icon";
import {
  OnboardingData,
  INITIAL_ONBOARDING,
  onboardingStepKeys,
  canProceedFrom,
  isValidProjectName,
  applySetupMode,
  type SetupMode,
} from "@/lib/onboarding";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("Onboarding");
  const tc = useTranslations("Common");
  const requestedMode = searchParams.get("mode") === "project-only"
    ? "project-only"
    : searchParams.get("mode") === "full"
      ? "full"
      : null;
  const requestedOs = searchParams.get("os") === "macos"
    ? "macos"
    : searchParams.get("os") === "windows"
      ? "windows"
      : null;
  const rawRequestedProject = searchParams.get("project");
  const requestedProject = rawRequestedProject && isValidProjectName(rawRequestedProject)
    ? rawRequestedProject
    : null;
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING);
  const [selectingMode, setSelectingMode] = useState(true);
  const [draftMode, setDraftMode] = useState<SetupMode | null>(requestedMode);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("vibestart-onboarding") ?? "null");
      if (saved && typeof saved === 'object') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setData({
          mode: requestedMode ?? (saved.mode === 'project-only' ? 'project-only' : 'full'),
          os: requestedOs ?? (saved.os === 'windows' || saved.os === 'macos' ? saved.os : null),
          goal: ['web-nextjs','web-python','web-java','mobile','data-ai','not-sure'].includes(saved.goal) ? saved.goal : null,
          aiTool: saved.aiTool === 'codex' || saved.aiTool === 'claude' ? saved.aiTool : null,
          projectName: requestedProject ?? (typeof saved.projectName === 'string' && isValidProjectName(saved.projectName) ? saved.projectName : ''),
          experience: ['first','prior','unsure'].includes(saved.experience) ? saved.experience : null,
        });
      } else if (requestedMode || requestedOs || requestedProject) {
        setData({
          ...INITIAL_ONBOARDING,
          mode: requestedMode ?? "full",
          os: requestedOs,
          projectName: requestedProject ?? "",
        });
      }
    } catch { /* Missing or corrupt preferences are safe to ignore. */ }
    setRestored(true);
  }, [requestedMode, requestedOs, requestedProject]);
  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem("vibestart-onboarding", JSON.stringify(data)); } catch { /* Optional persistence. */ }
  }, [data, restored]);
  useEffect(() => {
    try { if (!sessionStorage.getItem("vibestart_visited")) {
      sessionStorage.setItem("vibestart_visited", "1");
      incrementVisitors();
    } } catch { /* Private browsing must not block setup. */ }
  }, []);

  // OS에 따라 단계 구성이 달라진다 — Windows는 설치 경험 질문 포함 5단계
  const stepKeys = onboardingStepKeys(data.os, data.mode);
  const totalSteps = stepKeys.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const stepKey = stepKeys[step];

  function canProceed(): boolean {
    return canProceedFrom(stepKey, data);
  }

  function handleNext() {
    if (step < totalSteps - 1) {
      // OS 선택 완료 시
      if (stepKey === "os" && data.os) {
        trackOnboardingStart(data.os);
      }
      setStep(step + 1);
    } else {
      trackOnboardingComplete(data.os!, data.goal!);
      const params = applySetupMode(new URLSearchParams({
        os: data.os!,
        goal: data.goal!,
        project: data.projectName,
        ai: data.aiTool!,
      }), data.mode);
      if (data.os === "windows" && data.mode === "full") {
        params.set("exp", data.experience ?? "first");
      }
      router.push(`/plan?${params.toString()}`);
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
      return;
    }
    setDraftMode(data.mode);
    setSelectingMode(true);
  }

  function confirmMode() {
    if (!draftMode) return;
    setData((current) => ({
      ...current,
      mode: draftMode,
      experience: draftMode === "project-only" ? null : current.experience,
    }));
    setStep(0);
    setSelectingMode(false);
  }

  if (selectingMode) {
    return (
      <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-3xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-sm font-semibold text-primary">VibeStart</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("quickStart.selectorTitle")}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">{t("quickStart.selectorDescription")}</p>
          </div>

          <SetupModePicker value={draftMode} onChange={setDraftMode} />

          <div className="mx-auto mt-8 max-w-md">
            <Button className="h-12 w-full text-base" disabled={!draftMode} onClick={confirmMode}>
              {t("quickStart.continue")}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">{t("quickStart.changeNote")}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-8 flex items-center gap-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <SetupModeIcon mode={data.mode} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground">{t("quickStart.current")}</p>
            <p className="font-semibold text-foreground">
              {t(data.mode === "project-only" ? "quickStart.projectOnly.title" : "quickStart.full.title")}
            </p>
            <p className="mt-0.5 text-xs font-medium text-primary">
              {t(data.mode === "project-only" ? "quickStart.projectOnly.steps" : "quickStart.full.steps")}
              <span className="mx-1.5" aria-hidden="true">·</span>
              {t(data.mode === "project-only" ? "quickStart.projectOnly.time" : "quickStart.full.time")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => {
              setDraftMode(data.mode);
              setSelectingMode(true);
            }}
          >
            {t("quickStart.change")}
          </Button>
        </div>

        <p className="mb-4 text-center text-sm text-muted-foreground">{t("quickStart.infoNote")}</p>
        {/* 진행 바 */}
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {t("progressLabel", { current: step + 1, total: totalSteps })}
          </span>
          <span>{t(`steps.${stepKey}.title`)}</span>
        </div>
        <Progress value={progress} className="mb-10 h-2" />

        {/* 질문 */}
        <h2 className="mb-8 text-center text-2xl font-bold">
          {t(`steps.${stepKey}.description`)}
        </h2>

        {/* 단계별 컴포넌트 */}
        <div className="mb-10">
          {stepKey === "os" && (
            <StepOS
              value={data.os}
              onChange={(os) => setData({ ...data, os })}
            />
          )}
          {stepKey === "experience" && (
            <StepExperience
              value={data.experience}
              onChange={(experience) => setData({ ...data, experience })}
            />
          )}
          {stepKey === "goal" && (
            <StepGoal
              value={data.goal}
              onChange={(goal) => setData({ ...data, goal })}
            />
          )}
          {stepKey === "aiTool" && (
            <StepAiTool
              value={data.aiTool}
              onChange={(aiTool) => setData({ ...data, aiTool })}
            />
          )}
          {stepKey === "projectName" && (
            <StepProjectName
              value={data.projectName}
              onChange={(projectName) => setData({ ...data, projectName })}
            />
          )}
        </div>

        {/* 네비게이션 */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBack} className="flex-1">
            {tc("previous")}
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1"
          >
            {step === totalSteps - 1 ? t("lastStepButton") : tc("next")}
          </Button>
        </div>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingContent />
    </Suspense>
  );
}
