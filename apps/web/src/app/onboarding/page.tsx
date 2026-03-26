"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StepOS } from "@/components/onboarding/step-os";
import { StepAITool } from "@/components/onboarding/step-ai-tool";
import { StepGoal } from "@/components/onboarding/step-goal";
import { StepExperience } from "@/components/onboarding/step-experience";
import { StepProjectName } from "@/components/onboarding/step-project-name";
import {
  OnboardingData,
  INITIAL_ONBOARDING,
  ONBOARDING_STEPS,
} from "@/lib/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING);

  const currentStep = ONBOARDING_STEPS[step];
  const totalSteps = ONBOARDING_STEPS.length;
  const progress = ((step + 1) / totalSteps) * 100;

  function canProceed(): boolean {
    switch (step) {
      case 0:
        return data.os !== null;
      case 1:
        return data.aiTool !== null;
      case 2:
        return data.goal !== null;
      case 3:
        return data.experiences.length > 0;
      case 4:
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
        tool: data.aiTool!,
        goal: data.goal!,
        exp: data.experiences.join(","),
        project: data.projectName,
      });
      router.push(`/plan?${params.toString()}`);
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        {/* 진행 바 */}
        <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {step + 1} / {totalSteps}
          </span>
          <span>{currentStep?.title}</span>
        </div>
        <Progress value={progress} className="mb-10 h-2" />

        {/* 질문 */}
        <h2 className="mb-8 text-center text-2xl font-bold">
          {currentStep?.description}
        </h2>

        {/* 단계별 컴포넌트 */}
        <div className="mb-10">
          {step === 0 && (
            <StepOS
              value={data.os}
              onChange={(os) => setData({ ...data, os })}
            />
          )}
          {step === 1 && (
            <StepAITool
              value={data.aiTool}
              onChange={(aiTool) => setData({ ...data, aiTool })}
            />
          )}
          {step === 2 && (
            <StepGoal
              value={data.goal}
              onChange={(goal) => setData({ ...data, goal })}
            />
          )}
          {step === 3 && (
            <StepExperience
              value={data.experiences}
              onChange={(experiences) => setData({ ...data, experiences })}
            />
          )}
          {step === 4 && (
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
              이전
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex-1"
          >
            {step === totalSteps - 1 ? "플랜 확인하기" : "다음"}
          </Button>
        </div>
      </div>
    </main>
  );
}
