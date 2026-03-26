import type { OS, AITool, Goal, ExperienceLevel } from "./onboarding";

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  detailedGuide?: string;
  script: string;
}

/** Windows + Claude Code 조합인지 판별 — WSL2 플로우로 분기 */
function needsWSL(os: OS, tool: AITool): boolean {
  return os === "windows" && (tool === "claude-code" || tool === "undecided");
}

// ─── 공통 단계 ───

function terminalGuide(os: OS, tool: AITool, level: ExperienceLevel): SetupStep | null {
  if (level === "experienced") return null;

  let guide: string;
  if (needsWSL(os, tool)) {
    guide =
      "Windows 검색창(돋보기 아이콘)에 'PowerShell'을 입력하고, 'Windows PowerShell'을 클릭해서 열어주세요. WSL 설치 후에는 'Ubuntu'를 검색해서 열면 됩니다.";
  } else if (os === "windows") {
    guide =
      "Windows 검색창(돋보기 아이콘)에 'PowerShell'을 입력하고, 'Windows PowerShell'을 클릭해서 열어주세요.";
  } else {
    guide =
      "Spotlight(Cmd + Space)를 열고 '터미널'을 입력한 후 Enter를 눌러주세요.";
  }

  return {
    id: "terminal",
    title: "터미널 열기",
    description: "명령어를 실행할 창을 열어주세요",
    detailedGuide: guide,
    script: "",
  };
}

// ─── Windows + Claude Code → WSL2 플로우 ───

function wslInstallStep(): SetupStep {
  return {
    id: "wsl",
    title: "WSL2 설치",
    description: "Windows에서 Claude Code를 사용하려면 Linux 환경이 필요해요",
    detailedGuide:
      "이 명령어는 PowerShell에서 실행해주세요. 설치 후 컴퓨터를 재시작해야 합니다. 재시작 후 Ubuntu 창이 자동으로 열리며 사용자 이름과 비밀번호를 설정하게 됩니다.",
    script: "wsl --install",
  };
}

function wslOpenStep(): SetupStep {
  return {
    id: "wsl-open",
    title: "Ubuntu 터미널 열기",
    description: "이제부터는 Ubuntu 터미널에서 진행해요",
    detailedGuide:
      "Windows 검색창에 'Ubuntu'를 입력하고 클릭해서 열어주세요. 까만 창이 뜨면 성공!",
    script: "",
  };
}

function wslGitStep(): SetupStep {
  return {
    id: "git",
    title: "Git 설치",
    description: "코드를 관리하는 도구를 설치해요",
    script: "sudo apt update && sudo apt install -y git && git --version",
  };
}

function wslNodeStep(): SetupStep {
  return {
    id: "node",
    title: "Node.js 설치",
    description: "자바스크립트를 실행할 수 있게 해주는 도구예요",
    script: "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt install -y nodejs && node --version",
  };
}

function wslVscodeStep(): SetupStep {
  return {
    id: "editor",
    title: "VS Code 설치",
    description: "코드를 편집하는 프로그램을 설치해요",
    detailedGuide:
      "VS Code는 Windows에 설치하지만, WSL과 자동으로 연결됩니다. 이 명령어는 PowerShell에서 실행해주세요.",
    script: "winget install --id Microsoft.VisualStudioCode --accept-source-agreements --accept-package-agreements",
  };
}

function wslClaudeCodeStep(): SetupStep {
  return {
    id: "ai-tool",
    title: "Claude Code 설치",
    description: "AI 코딩 도우미를 설치해요",
    detailedGuide: "이 명령어는 Ubuntu 터미널에서 실행해주세요.",
    script: "npm install -g @anthropic-ai/claude-code",
  };
}

function wslProjectStep(projectName: string): SetupStep {
  return {
    id: "project",
    title: "프로젝트 생성",
    description: "나만의 웹사이트 프로젝트를 만들어요",
    script: `npx create-next-app@latest ~/${projectName} --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm`,
  };
}

function wslFirstRunStep(projectName: string): SetupStep {
  return {
    id: "first-run",
    title: "첫 실행!",
    description: "프로젝트 폴더에서 AI 코딩을 시작해요",
    script: `cd ~/${projectName} && claude`,
  };
}

// ─── Windows 네이티브 플로우 (Cursor/Copilot/Windsurf) ───

function winGitStep(): SetupStep {
  return {
    id: "git",
    title: "Git 설치",
    description: "코드를 관리하는 도구를 설치해요",
    detailedGuide: "설치 완료 후 터미널을 닫고 다시 열어주세요.",
    script: "winget install --id Git.Git --accept-source-agreements --accept-package-agreements",
  };
}

function winNodeStep(): SetupStep {
  return {
    id: "node",
    title: "Node.js 설치",
    description: "자바스크립트를 실행할 수 있게 해주는 도구예요",
    detailedGuide: "설치 완료 후 터미널을 닫고 다시 열어주세요.",
    script: "winget install --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements",
  };
}

function winEditorStep(tool: AITool): SetupStep {
  if (tool === "cursor") {
    return {
      id: "editor",
      title: "Cursor 설치",
      description: "AI가 내장된 코드 에디터를 설치해요",
      script: "winget install --id Anysphere.Cursor --accept-source-agreements --accept-package-agreements",
    };
  }

  if (tool === "windsurf") {
    return {
      id: "editor",
      title: "Windsurf 설치",
      description: "AI 기반 코드 에디터를 설치해요",
      script: "winget install --id Codeium.Windsurf --accept-source-agreements --accept-package-agreements",
    };
  }

  return {
    id: "editor",
    title: "VS Code 설치",
    description: "코드를 편집하는 프로그램을 설치해요",
    script: "winget install --id Microsoft.VisualStudioCode --accept-source-agreements --accept-package-agreements",
  };
}

function winCopilotStep(): SetupStep {
  return {
    id: "ai-tool",
    title: "GitHub Copilot 설치",
    description: "VS Code에 AI 코딩 확장을 추가해요",
    script: "code --install-extension GitHub.copilot",
  };
}

function winProjectStep(projectName: string): SetupStep {
  return {
    id: "project",
    title: "프로젝트 생성",
    description: "나만의 웹사이트 프로젝트를 만들어요",
    script: `npx create-next-app@latest "$HOME\\${projectName}" --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm`,
  };
}

function winFirstRunStep(tool: AITool, projectName: string): SetupStep {
  return {
    id: "first-run",
    title: "첫 실행!",
    description: "프로젝트를 브라우저에서 확인해요",
    script: `cd "$HOME\\${projectName}"; npm run dev`,
  };
}

// ─── macOS 플로우 ───

function brewStep(): SetupStep {
  return {
    id: "brew",
    title: "Homebrew 설치",
    description: "Mac에서 프로그램을 쉽게 설치할 수 있게 해주는 도구예요",
    detailedGuide:
      "설치 중 비밀번호를 물어볼 수 있습니다. Mac 로그인 비밀번호를 입력하세요. 설치 완료 후 터미널을 닫고 다시 열어주세요.",
    script: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
  };
}

function macGitStep(): SetupStep {
  return {
    id: "git",
    title: "Git 설치",
    description: "코드를 관리하는 도구를 설치해요",
    script: "brew install git && git --version",
  };
}

function macNodeStep(): SetupStep {
  return {
    id: "node",
    title: "Node.js 설치",
    description: "자바스크립트를 실행할 수 있게 해주는 도구예요",
    script: "brew install node && node --version",
  };
}

function macEditorStep(tool: AITool): SetupStep {
  if (tool === "cursor") {
    return {
      id: "editor",
      title: "Cursor 설치",
      description: "AI가 내장된 코드 에디터를 설치해요",
      script: "brew install --cask cursor",
    };
  }

  if (tool === "windsurf") {
    return {
      id: "editor",
      title: "Windsurf 설치",
      description: "AI 기반 코드 에디터를 설치해요",
      script: "brew install --cask windsurf",
    };
  }

  return {
    id: "editor",
    title: "VS Code 설치",
    description: "코드를 편집하는 프로그램을 설치해요",
    script: "brew install --cask visual-studio-code",
  };
}

function macAiToolStep(tool: AITool): SetupStep | null {
  if (tool === "claude-code" || tool === "undecided") {
    return {
      id: "ai-tool",
      title: "Claude Code 설치",
      description: "AI 코딩 도우미를 설치해요",
      script: "npm install -g @anthropic-ai/claude-code",
    };
  }

  if (tool === "copilot") {
    return {
      id: "ai-tool",
      title: "GitHub Copilot 설치",
      description: "VS Code에 AI 코딩 확장을 추가해요",
      script: "code --install-extension GitHub.copilot",
    };
  }

  return null;
}

function macProjectStep(projectName: string): SetupStep {
  return {
    id: "project",
    title: "프로젝트 생성",
    description: "나만의 웹사이트 프로젝트를 만들어요",
    script: `npx create-next-app@latest ~/${projectName} --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm`,
  };
}

function macFirstRunStep(tool: AITool, projectName: string): SetupStep {
  const isClaudeCode = tool === "claude-code" || tool === "undecided";

  return {
    id: "first-run",
    title: "첫 실행!",
    description: isClaudeCode
      ? "프로젝트 폴더에서 AI 코딩을 시작해요"
      : "프로젝트를 브라우저에서 확인해요",
    script: isClaudeCode
      ? `cd ~/${projectName} && claude`
      : `cd ~/${projectName} && npm run dev`,
  };
}

// ─── 메인 ───

export function getSetupSteps(
  os: OS,
  tool: AITool,
  goal: Goal,
  level: ExperienceLevel,
  projectName: string,
): SetupStep[] {
  const steps: SetupStep[] = [];

  const terminal = terminalGuide(os, tool, level);
  if (terminal) steps.push(terminal);

  if (needsWSL(os, tool)) {
    steps.push(wslInstallStep());
    steps.push(wslOpenStep());
    steps.push(wslGitStep());
    steps.push(wslNodeStep());
    steps.push(wslVscodeStep());
    steps.push(wslClaudeCodeStep());

    if (goal === "website" || goal === "not-sure") {
      steps.push(wslProjectStep(projectName));
      steps.push(wslFirstRunStep(projectName));
    }
  } else if (os === "windows") {
    steps.push(winGitStep());
    steps.push(winNodeStep());
    steps.push(winEditorStep(tool));

    if (tool === "copilot") steps.push(winCopilotStep());

    if (goal === "website" || goal === "not-sure") {
      steps.push(winProjectStep(projectName));
      steps.push(winFirstRunStep(tool, projectName));
    }
  } else {
    steps.push(brewStep());
    steps.push(macGitStep());
    steps.push(macNodeStep());
    steps.push(macEditorStep(tool));

    const aiStep = macAiToolStep(tool);
    if (aiStep) steps.push(aiStep);

    if (goal === "website" || goal === "not-sure") {
      steps.push(macProjectStep(projectName));
      steps.push(macFirstRunStep(tool, projectName));
    }
  }

  return steps;
}
