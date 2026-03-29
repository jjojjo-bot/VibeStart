export type OS = "windows" | "macos";

export type AITool = "claude-code" | "cursor" | "copilot" | "windsurf" | "undecided";

export type Goal = "website" | "mobile-app" | "data-ai" | "not-sure";

export interface OnboardingData {
  os: OS | null;
  aiTool: AITool | null;
  goal: Goal | null;
  projectName: string;
}

export const INITIAL_ONBOARDING: OnboardingData = {
  os: null,
  aiTool: null,
  goal: null,
  projectName: "",
};

export const OS_OPTIONS = [
  { value: "windows" as OS, label: "Windows", icon: "🪟" },
  { value: "macos" as OS, label: "Mac", icon: "🍎" },
] as const;

export const AI_TOOL_OPTIONS = [
  {
    value: "claude-code" as AITool,
    label: "Claude Code",
    description: "초보자에게 가장 쉽고, 무료로 시작할 수 있어요",
    recommended: true,
  },
  {
    value: "cursor" as AITool,
    label: "Cursor",
    description: "AI가 내장된 코드 에디터",
    recommended: false,
  },
  {
    value: "copilot" as AITool,
    label: "GitHub Copilot",
    description: "VS Code에서 사용하는 AI 코딩 도우미",
    recommended: false,
  },
  {
    value: "windsurf" as AITool,
    label: "Windsurf",
    description: "AI 기반 코드 에디터",
    recommended: false,
  },
  {
    value: "undecided" as AITool,
    label: "아직 안 정했어요",
    description: "추천 도구로 안내해드릴게요",
    recommended: false,
  },
] as const;

export const GOAL_OPTIONS = [
  { value: "website" as Goal, label: "웹사이트 / 웹서비스", icon: "🌐" },
  { value: "mobile-app" as Goal, label: "모바일 앱", icon: "📱", comingSoon: true },
  { value: "data-ai" as Goal, label: "데이터 분석 / AI", icon: "📊", comingSoon: true },
  { value: "not-sure" as Goal, label: "아직 잘 모르겠어요", icon: "🤔" },
] as const;

export const ONBOARDING_STEPS = [
  { id: "os", title: "운영체제", description: "어떤 컴퓨터를 사용하시나요?" },
  { id: "ai-tool", title: "AI 도구", description: "어떤 AI 코딩 도구를 사용할까요?" },
  { id: "goal", title: "목표", description: "어떤 걸 만들고 싶으세요?" },
  { id: "project-name", title: "프로젝트 이름", description: "프로젝트 이름을 지어주세요" },
] as const;
