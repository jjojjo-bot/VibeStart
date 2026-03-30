"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { incrementVisitors } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StepOS } from "@/components/onboarding/step-os";
import { StepAIIntro } from "@/components/onboarding/step-ai-intro";
import { StepGoal } from "@/components/onboarding/step-goal";
import { StepProjectName } from "@/components/onboarding/step-project-name";
import {
  OnboardingData,
  INITIAL_ONBOARDING,
  ONBOARDING_STEPS,
} from "@/lib/onboarding";

const STEP_KEYS = ["os", "aiIntro", "goal", "projectName"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations("Onboarding");
  const tc = useTranslations("Common");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING);
  useEffect(() => {
    if (!sessionStorage.getItem("vibestart_visited")) {
      sessionStorage.setItem("vibestart_visited", "1");
      incrementVisitors();
    }
  }, []);

  const totalSteps = ONBOARDING_STEPS.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const stepKey = STEP_KEYS[step];

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return data.os !== null;
      case 1:
        return true; // AI 소개 — 항상 진행 가능
      case 2:
        return data.goal !== null;
      case 3:
        return data.projectName.length >= 2;
      default:
        return false;
    }
  }

  function handleNext() {
    if (step < totalSteps - 1) {
      setStep(step + 1);
    } else {
      const params = new URLSearchParams({
        os: data.os!,
        goal: data.goal!,
        project: data.projectName,
      });
      router.push(`/plan?${params.toString()}`);
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
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
          {step === 0 && (
            <StepOS
              value={data.os}
              onChange={(os) => setData({ ...data, os })}
            />
          )}
          {step === 1 && <StepAIIntro />}
          {step === 2 && (
            <StepGoal
              value={data.goal}
              onChange={(goal) => setData({ ...data, goal })}
            />
          )}
          {step === 3 && (
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
