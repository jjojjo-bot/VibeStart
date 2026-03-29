export type OS = "windows" | "macos";

export type Goal = "web-nextjs" | "web-python" | "web-java" | "mobile" | "data-ai" | "not-sure";

export interface OnboardingData {
  os: OS | null;
  goal: Goal | null;
  projectName: string;
}

export const INITIAL_ONBOARDING: OnboardingData = {
  os: null,
  goal: null,
  projectName: "",
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
        recommended: true,
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

export const ONBOARDING_STEPS = [
  { id: "os", title: "운영체제", description: "어떤 컴퓨터를 사용하시나요?" },
  { id: "ai-intro", title: "AI 도구", description: "이런 도구와 함께해요" },
  { id: "goal", title: "목표", description: "어떤 걸 만들고 싶으세요?" },
  { id: "project-name", title: "프로젝트 이름", description: "프로젝트 이름을 지어주세요" },
] as const;
