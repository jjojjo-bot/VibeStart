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
  applySetupMode,
  parseSetupParams,
  setupProgressKey,
  type OnboardingData,
} from "@/lib/onboarding";

describe("onboardingStepKeys", () => {
  it("Windows는 experience와 AI 도구 선택을 포함한 5단계다", () => {
    expect(onboardingStepKeys("windows")).toEqual([
      "os",
      "experience",
      "goal",
      "aiTool",
      "projectName",
    ]);
  });

  it("macOS는 AI 도구 선택을 포함한 4단계다", () => {
    expect(onboardingStepKeys("macos")).toEqual(["os", "goal", "aiTool", "projectName"]);
  });

  it("OS 미선택 상태는 4단계다 (선택 시 재계산)", () => {
    expect(onboardingStepKeys(null)).toEqual(["os", "goal", "aiTool", "projectName"]);
  });

  it("빠른 시작은 Windows에서도 설치 경험 단계를 제외한다", () => {
    expect(onboardingStepKeys("windows", "project-only")).toEqual([
      "os",
      "goal",
      "aiTool",
      "projectName",
    ]);
  });
});

describe("setup mode routing and progress", () => {
  const base = "os=macos&goal=web-nextjs&project=demo&ai=codex";

  it("누락되거나 알 수 없는 mode는 전체 설정으로 안전하게 폴백한다", () => {
    expect(parseSetupParams(new URLSearchParams(base))?.mode).toBe("full");
    expect(parseSetupParams(new URLSearchParams(`${base}&mode=unexpected`))?.mode).toBe("full");
    expect(parseSetupParams(new URLSearchParams(`${base}&mode=project-only`))?.mode).toBe("project-only");
  });

  it("URL에는 빠른 시작 모드만 명시하고 전체 설정은 기존 링크 형태를 유지한다", () => {
    expect(applySetupMode(new URLSearchParams(base), "project-only").get("mode")).toBe("project-only");
    expect(applySetupMode(new URLSearchParams(`${base}&mode=project-only`), "full").has("mode")).toBe(false);
  });

  it("진행률 키는 모드와 AI 도구별로 격리된다", () => {
    const fullCodex = setupProgressKey("full", "macos", "web-nextjs", "codex", "demo");
    expect(setupProgressKey("project-only", "macos", "web-nextjs", "codex", "demo")).not.toBe(fullCodex);
    expect(setupProgressKey("full", "macos", "web-nextjs", "claude", "demo")).not.toBe(fullCodex);
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

  it("aiTool 단계는 도구 선택 후 진행 가능", () => {
    expect(canProceedFrom("aiTool", base)).toBe(false);
    expect(canProceedFrom("aiTool", { ...base, aiTool: "codex" })).toBe(true);
  });

  it("projectName 단계는 2자 이상 입력 후 진행 가능", () => {
    expect(canProceedFrom("projectName", { ...base, projectName: "a" })).toBe(false);
    expect(canProceedFrom("projectName", { ...base, projectName: "ab" })).toBe(true);
  });
});
