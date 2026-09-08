"use client";

import { useState, useEffect } from "react";
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
import {
  OnboardingData,
  INITIAL_ONBOARDING,
  onboardingStepKeys,
  canProceedFrom,
  isValidProjectName,
  applySetupMode,
} from "@/lib/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations("Onboarding");
  const tc = useTranslations("Common");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING);
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("vibestart-onboarding") ?? "null");
      if (saved && typeof saved === 'object') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setData({
          mode: saved.mode === 'project-only' ? 'project-only' : 'full',
          os: saved.os === 'windows' || saved.os === 'macos' ? saved.os : null,
          goal: ['web-nextjs','web-python','web-java','mobile','data-ai','not-sure'].includes(saved.goal) ? saved.goal : null,
          aiTool: saved.aiTool === 'codex' || saved.aiTool === 'claude' ? saved.aiTool : null,
          projectName: typeof saved.projectName === 'string' && isValidProjectName(saved.projectName) ? saved.projectName : '',
          experience: ['first','prior','unsure'].includes(saved.experience) ? saved.experience : null,
        });
      }
    } catch { /* Missing or corrupt preferences are safe to ignore. */ }
    setRestored(true);
  }, []);
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
    if (step > 0) setStep(step - 1);
  }

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        {step === 0 && (
          <div className={`mb-8 rounded-xl border p-4 ${data.mode === "project-only" ? "border-primary/50 bg-primary/5" : "border-border/60 bg-card"}`}>
            <p className="font-semibold">{t("quickStart.title")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("quickStart.description")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setData({ ...data, mode: data.mode === "project-only" ? "full" : "project-only", experience: null })}
            >
              {t(data.mode === "project-only" ? "quickStart.useFullSetup" : "quickStart.cta")}
            </Button>
          </div>
        )}
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
          {step > 0 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              {tc("previous")}
            </Button>
          )}
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
