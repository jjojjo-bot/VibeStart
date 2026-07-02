export type OS = "windows" | "macos";

export type Goal = "web-nextjs" | "web-python" | "web-java" | "mobile" | "data-ai" | "not-sure";

/** 이 컴퓨터에 개발 도구를 설치해본 경험 — Windows 스캔 게이트 분기용. */
export type InstallExperience = "first" | "prior" | "unsure";

export interface OnboardingData {
  os: OS | null;
  goal: Goal | null;
  projectName: string;
  /** Windows에서만 질문. macOS 플로우에선 null 유지. */
  experience: InstallExperience | null;
}

export const INITIAL_ONBOARDING: OnboardingData = {
  os: null,
  goal: null,
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
        recommended: true,
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

export type OnboardingStepKey = "os" | "experience" | "aiIntro" | "goal" | "projectName";

/** OS에 따른 온보딩 단계 구성. 설치 경험 질문은 Windows에만 (스캔 게이트가 Windows 전용). */
export function onboardingStepKeys(os: OS | null): readonly OnboardingStepKey[] {
  return os === "windows"
    ? (["os", "experience", "aiIntro", "goal", "projectName"] as const)
    : (["os", "aiIntro", "goal", "projectName"] as const);
}

/** 단계별 진행 가능 조건 — 온보딩 페이지의 '다음' 버튼 활성화 규칙. */
export function canProceedFrom(stepKey: OnboardingStepKey, data: OnboardingData): boolean {
  switch (stepKey) {
    case "os":
      return data.os !== null;
    case "experience":
      return data.experience !== null;
    case "aiIntro":
      return true;
    case "goal":
      return data.goal !== null;
    case "projectName":
      return data.projectName.length >= 2;
  }
}
