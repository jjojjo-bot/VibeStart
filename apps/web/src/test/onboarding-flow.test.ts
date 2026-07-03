// @vitest-environment node
/**
 * 온보딩 단계 구성 헬퍼 테스트.
 * Windows에만 설치 경험(experience) 질문이 끼어든다.
 */
import { describe, expect, it } from "vitest";
import {
  onboardingStepKeys,
  canProceedFrom,
  INITIAL_ONBOARDING,
  type OnboardingData,
} from "@/lib/onboarding";

describe("onboardingStepKeys", () => {
  it("Windows는 experience 단계를 포함한 4단계다", () => {
    expect(onboardingStepKeys("windows")).toEqual([
      "os",
      "experience",
      "goal",
      "projectName",
    ]);
  });

  it("macOS는 3단계다", () => {
    expect(onboardingStepKeys("macos")).toEqual(["os", "goal", "projectName"]);
  });

  it("OS 미선택 상태는 3단계다 (선택 시 재계산)", () => {
    expect(onboardingStepKeys(null)).toEqual(["os", "goal", "projectName"]);
  });
});

describe("canProceedFrom", () => {
  const base: OnboardingData = { ...INITIAL_ONBOARDING };

  it("os 단계는 os 선택 후 진행 가능", () => {
    expect(canProceedFrom("os", base)).toBe(false);
    expect(canProceedFrom("os", { ...base, os: "windows" })).toBe(true);
  });

  it("experience 단계는 응답 후 진행 가능", () => {
    expect(canProceedFrom("experience", base)).toBe(false);
    expect(canProceedFrom("experience", { ...base, experience: "first" })).toBe(true);
  });

  it("goal 단계는 goal 선택 후 진행 가능", () => {
    expect(canProceedFrom("goal", base)).toBe(false);
    expect(canProceedFrom("goal", { ...base, goal: "web-nextjs" })).toBe(true);
  });

  it("projectName 단계는 2자 이상 입력 후 진행 가능", () => {
    expect(canProceedFrom("projectName", { ...base, projectName: "a" })).toBe(false);
    expect(canProceedFrom("projectName", { ...base, projectName: "ab" })).toBe(true);
  });
});
