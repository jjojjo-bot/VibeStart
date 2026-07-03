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
import { StepProjectName } from "@/components/onboarding/step-project-name";
import {
  OnboardingData,
  INITIAL_ONBOARDING,
  onboardingStepKeys,
  canProceedFrom,
} from "@/lib/onboarding";

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

  // OS에 따라 단계 구성이 달라진다 — Windows는 설치 경험 질문 포함 5단계
  const stepKeys = onboardingStepKeys(data.os);
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
      const params = new URLSearchParams({
        os: data.os!,
        goal: data.goal!,
        project: data.projectName,
      });
      if (data.os === "windows") {
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
