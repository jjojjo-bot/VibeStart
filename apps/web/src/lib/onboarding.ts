import type { AiTool } from "./ai-tools";

export type OS = "windows" | "macos";

export type Goal = "web-nextjs" | "web-python" | "web-java" | "mobile" | "data-ai" | "not-sure";

/** 이 컴퓨터에 개발 도구를 설치해본 경험 — Windows 스캔 게이트 분기용. */
export type InstallExperience = "first" | "prior" | "unsure";

/** 전체 개발환경 설정 또는 이미 준비된 환경에서 프로젝트만 구성하는 빠른 시작. */
export type SetupMode = "full" | "project-only";

export interface OnboardingData {
  mode: SetupMode;
  os: OS | null;
  goal: Goal | null;
  aiTool: AiTool | null;
  projectName: string;
  /** Windows에서만 질문. macOS 플로우에선 null 유지. */
  experience: InstallExperience | null;
}

export const INITIAL_ONBOARDING: OnboardingData = {
  mode: "full",
  os: null,
  goal: null,
  aiTool: null,
  projectName: "",
  experience: null,
};

export const OS_OPTIONS = [
  { value: "windows" as OS, label: "Windows", icon: "🪟" },
  { value: "macos" as OS, label: "Mac", icon: "🍎" },
] as const;

export const GOAL_OPTIONS = [
  {
    value: "website" as const,
    label: "웹사이트 / 웹서비스",
    icon: "🌐",
    subOptions: [
      {
        value: "web-nextjs" as Goal,
        label: "Next.js 하나로 완성",
        recommended: true,
        icon: "⚡",
        description:
          "화면과 서버를 한번에 만들 수 있어요.\n빠르게 완성하고 바로 배포하기 좋습니다.\nAirbnb, TikTok 웹, 트위치가 사용하고 있어요.",
      },
      {
        value: "web-python" as Goal,
        label: "Next.js + Python 백엔드",
        icon: "🐍",
        description:
          "화면은 Next.js, 서버는 Python으로 나눠서 만들어요.\nAI 챗봇이나 데이터 분석 기능을 붙이기 좋습니다.\nInstagram, Pinterest, Netflix가 사용하고 있어요.",
      },
      {
        value: "web-java" as Goal,
        label: "Next.js + Java 백엔드",
        icon: "☕",
        description:
          "화면은 Next.js, 서버는 Java로 나눠서 만들어요.\n대규모 트래픽을 안정적으로 처리하는 데 강해요.\n카카오톡, 배달의민족, 쿠팡이 사용하고 있어요.",
      },
    ],
  },
  { value: "mobile" as Goal, label: "모바일 앱", icon: "📱" },
  { value: "data-ai" as Goal, label: "데이터 분석 / AI", icon: "📊" },
  { value: "not-sure" as Goal, label: "아직 잘 모르겠어요", icon: "🤔" },
] as const;

export type OnboardingStepKey = "os" | "experience" | "goal" | "aiTool" | "projectName";

/** OS에 따른 온보딩 단계 구성. 설치 경험 질문은 Windows에만 (스캔 게이트가 Windows 전용). */
export function onboardingStepKeys(os: OS | null, mode: SetupMode = "full"): readonly OnboardingStepKey[] {
  return os === "windows" && mode === "full"
    ? (["os", "experience", "goal", "aiTool", "projectName"] as const)
    : (["os", "goal", "aiTool", "projectName"] as const);
}

/** 단계별 진행 가능 조건 — 온보딩 페이지의 '다음' 버튼 활성화 규칙. */
export function canProceedFrom(stepKey: OnboardingStepKey, data: OnboardingData): boolean {
  switch (stepKey) {
    case "os":
      return data.os !== null;
    case "experience":
      return data.experience !== null;
    case "goal":
      return data.goal !== null;
    case "aiTool":
      return data.aiTool !== null;
    case "projectName":
      return isValidProjectName(data.projectName);
  }
}

/** Validate before interpolation into commands, including direct/bookmarked URLs. */
export function isValidProjectName(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(value) && !["node_modules", "npm", "test"].includes(value);
}

export function parseSetupParams(params: { get(key: string): string | null }) {
  const os = params.get("os");
  const goal = params.get("goal");
  const projectName = params.get("project");
  const rawAiTool = params.get("ai");
  const rawMode = params.get("mode");
  const mode: SetupMode = rawMode === "project-only" ? "project-only" : "full";
  if ((os !== "windows" && os !== "macos") ||
      !["web-nextjs", "web-python", "web-java", "mobile", "data-ai", "not-sure"].includes(goal ?? "") ||
      !projectName || !isValidProjectName(projectName)) return null;
  if (rawAiTool !== null && rawAiTool !== "claude" && rawAiTool !== "codex") return null;
  return { os: os as OS, goal: goal as Goal, projectName, aiTool: (rawAiTool ?? "claude") as AiTool, mode };
}

/** 전체 설정 URL은 기존 링크 형태를 유지하고, 빠른 시작만 명시적으로 기록한다. */
export function applySetupMode(params: URLSearchParams, mode: SetupMode): URLSearchParams {
  if (mode === "project-only") params.set("mode", mode);
  else params.delete("mode");
  return params;
}

/** 모드·AI 도구가 다른 진행 기록은 절대 공유하지 않는다. */
export function setupProgressKey(
  mode: SetupMode,
  os: OS,
  goal: Goal,
  aiTool: AiTool,
  projectName: string,
): string {
  // 전체 설정은 배포 전 진행 중인 사용자의 v3 기록을 그대로 이어간다.
  if (mode === "full") return `vibestart-progress-v3-${os}-${goal}-${aiTool}-${projectName}`;
  return `vibestart-progress-v4-project-only-${os}-${goal}-${aiTool}-${projectName}`;
}

export function detectOS(userAgent: string): OS | "linux" | "mobile" | null {
  if (/Android|iPhone|iPad|Mobile/i.test(userAgent)) return "mobile";
  if (/Windows/i.test(userAgent)) return "windows";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "macos";
  if (/Linux/i.test(userAgent)) return "linux";
  return null;
}
