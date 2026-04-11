import type { OS, Goal } from "./onboarding";

export type SetupGroup = "envPrep" | "toolInstall" | "aiSetup" | "projectCreate";

export interface TroubleshootingItem {
  symptom: string;
  solution: string;
}

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  group: SetupGroup;
  detailedGuide?: string;
  script: string;
  /** 실행 환경 표시 — 초보자가 어디서 실행해야 하는지 알 수 있도록 */
  environment?: string;
  /** CLAUDE.md 파일 내용 — 이 필드가 있으면 웹에서 내용을 보여주고 직접 저장하도록 안내 */
  claudeMdContent?: string;
  /** 성공 시 예상 터미널 출력 — 사용자가 결과를 비교할 수 있도록 */
  resultPreview?: string;
  /** 흔한 에러와 해결 방법 */
  troubleshooting?: TroubleshootingItem[];
  /** 이 도구가 왜 필요한지 비전공자용 한줄 설명 */
  whyNeeded?: string;
}

/** Translation function type for SetupSteps namespace */
type T = (key: string, values?: Record<string, string>) => string;

/** Goal별 필요한 추가 런타임 판별 */
type ExtraRuntime = "python" | "java" | "expo" | null;
function extraRuntimeFor(goal: Goal): ExtraRuntime {
  if (goal === "web-python" || goal === "data-ai") return "python";
  if (goal === "web-java") return "java";
  if (goal === "mobile") return "expo";
  return null;
}

/** Node.js가 필요한 Goal인지 판별 */
function needsNode(goal: Goal): boolean {
  return goal === "web-nextjs" || goal === "web-python" || goal === "web-java" || goal === "mobile" || goal === "not-sure";
}

// ─── 공통 단계 ───

function terminalGuide(os: OS, t: T): SetupStep {
  const guide = os === "windows"
    ? t("terminal.detailedGuide.windows")
    : t("terminal.detailedGuide.macos");

  return {
    id: "terminal",
    title: t("terminal.title"),
    description: t("terminal.description"),
    group: "envPrep",
    detailedGuide: guide,
    script: "",
  };
}

// ─── Windows (WSL2) 플로우 ───

function wslInstallStep(t: T): SetupStep {
  return {
    id: "wsl",
    title: t("wsl.title"),
    description: t("wsl.description"),
    whyNeeded: t("wsl.whyNeeded"),
    group: "envPrep",
    environment: t("environments.windowsCmd"),
    detailedGuide: t("wsl.detailedGuide"),
    script: "wsl --install",
    resultPreview: `Installing: Ubuntu
Successfully installed: Ubuntu
The requested operation is successful.
Please restart your computer.`,
    troubleshooting: [
      { symptom: t("wsl.troubleshooting.0.symptom"), solution: t("wsl.troubleshooting.0.solution") },
      { symptom: t("wsl.troubleshooting.1.symptom"), solution: t("wsl.troubleshooting.1.solution") },
      { symptom: t("wsl.troubleshooting.2.symptom"), solution: t("wsl.troubleshooting.2.solution") },
      { symptom: t("wsl.troubleshooting.3.symptom"), solution: t("wsl.troubleshooting.3.solution") },
    ],
  };
}

function wslOpenStep(t: T): SetupStep {
  return {
    id: "wsl-open",
    title: t("wslOpen.title"),
    description: t("wslOpen.description"),
    whyNeeded: t("wslOpen.whyNeeded"),
    group: "envPrep",
    environment: t("environments.windowsCmd"),
    detailedGuide: t("wslOpen.detailedGuide"),
    script: "wsl",
    resultPreview: `yourname@DESKTOP-XXXXX:/mnt/c/Users/yourname$
$ cd ~
yourname@DESKTOP-XXXXX:~$`,
    troubleshooting: [
      { symptom: t("wslOpen.troubleshooting.0.symptom"), solution: t("wslOpen.troubleshooting.0.solution") },
      { symptom: t("wslOpen.troubleshooting.1.symptom"), solution: t("wslOpen.troubleshooting.1.solution") },
      { symptom: t("wslOpen.troubleshooting.2.symptom"), solution: t("wslOpen.troubleshooting.2.solution") },
    ],
  };
}

function buildDevToolsWhy(goal: Goal, t: T): string {
  const parts = [t("devTools.whyNeeded.git")];
  if (needsNode(goal)) parts.push(t("devTools.whyNeeded.nodejs"));
  const extra = extraRuntimeFor(goal);
  if (extra === "python") parts.push(t("devTools.whyNeeded.python"));
  else if (extra === "java") parts.push(t("devTools.whyNeeded.java"));
  else if (extra === "expo") parts.push(t("devTools.whyNeeded.expo"));
  return parts.join(" ");
}

// ─── 개발 도구 설치 (WSL) ───
//
// 이전에는 한 단계에서 apt + nodesource + python을 모두 체인으로 돌렸으나
// 두 가지 심각한 문제가 있었다:
//
//   1. 기본 bash는 pipefail이 off여서 `curl | sudo bash -` 에서 curl이 실패해도
//      파이프라인이 0을 반환 → && 체인이 계속 진행 → 결국 nodesource 없이
//      Ubuntu 기본 Node(18.x 등)가 조용히 설치되는 침묵 버그가 발생.
//   2. 7+단계 체인이 중간에 실패하면 비전공자가 어느 줄에서 멈췄는지 찾지 못함.
//
// 수정 방향:
//   - 두 단계로 분리 (기본 도구 / Node.js) — 독립 재시도 가능, 실패 지점 명확
//   - 모든 스크립트 앞에 `set -o pipefail` — pipe 실패 전파
//   - `DEBIAN_FRONTEND=noninteractive` — tzdata 등 대화상자 차단
//   - 단계마다 echo 마커 — 실패 시 마지막 마커가 중단 지점
//   - resultPreview는 구체 버전 번호 대신 `x.x.x` 형태 — stale 방지

/** 여러 줄을 `&&`로 이어 붙여 fail-fast 체인 스크립트를 만든다. */
function joinChain(lines: string[]): string {
  return lines.join(" && ");
}

/** 기본 개발 도구 설치 (Git + Python/Java). Node.js는 별도 단계. */
function wslBasicToolsStep(goal: Goal, t: T): SetupStep {
  const extra = extraRuntimeFor(goal);

  const pkgs: string[] = ["git"];
  const names: string[] = ["Git"];
  const versionChecks: string[] = ["git --version"];
  const resultLines: string[] = ["git version 2.x.x"];

  if (extra === "python") {
    pkgs.push("python3", "python3-pip", "python3-venv");
    names.push("Python");
    versionChecks.push("python3 --version");
    resultLines.push("Python 3.x.x");
  } else if (extra === "java") {
    pkgs.push("openjdk-21-jdk");
    names.push("Java");
    versionChecks.push("java --version");
    resultLines.push('openjdk version "21.x.x"');
  }

  const script = joinChain([
    "set -o pipefail",
    'echo "▶ (1/3) Updating package lists..."',
    "sudo DEBIAN_FRONTEND=noninteractive apt-get update",
    'echo "▶ (2/3) Installing tools..."',
    `sudo DEBIAN_FRONTEND=noninteractive apt-get install -y ${pkgs.join(" ")}`,
    'echo "▶ (3/3) Verifying versions..."',
    ...versionChecks,
    'echo "✅ Basic tools installed"',
  ]);

  return {
    id: "dev-tools-basic",
    title: t("devTools.title"),
    description: t("devTools.descriptionTemplate", { names: names.join(", ") }),
    whyNeeded: buildDevToolsWhy(goal, t),
    group: "toolInstall",
    environment: t("environments.linuxCmd"),
    detailedGuide: t("devTools.detailedGuide"),
    script,
    resultPreview: [
      "▶ (3/3) Verifying versions...",
      ...resultLines,
      "✅ Basic tools installed",
    ].join("\n"),
    troubleshooting: [
      { symptom: t("devTools.troubleshooting.wsl.0.symptom"), solution: t("devTools.troubleshooting.wsl.0.solution") },
      { symptom: t("devTools.troubleshooting.wsl.1.symptom"), solution: t("devTools.troubleshooting.wsl.1.solution") },
      { symptom: t("devTools.troubleshooting.wsl.2.symptom"), solution: t("devTools.troubleshooting.wsl.2.solution") },
    ],
  };
}

/**
 * Node.js 설치 (NodeSource setup_lts.x 스크립트 → apt install nodejs).
 *
 * ⚠️ `set -o pipefail`이 반드시 있어야 한다 — 없으면 curl 실패 시에도 `| sudo bash -`가
 * 빈 stdin으로 0을 반환해서 `&&`가 계속 진행되고, 결국 nodesource 레포 없이 Ubuntu
 * 기본 nodejs(대개 구버전)가 조용히 설치되는 침묵 버그가 생긴다.
 */
function wslNodejsStep(t: T): SetupStep {
  const script = joinChain([
    "set -o pipefail",
    'echo "▶ (1/3) Adding NodeSource repository..."',
    "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -",
    'echo "▶ (2/3) Installing Node.js..."',
    "sudo DEBIAN_FRONTEND=noninteractive apt-get install -y nodejs",
    'echo "▶ (3/3) Verifying version..."',
    "node --version",
    'echo "✅ Node.js installed"',
  ]);

  return {
    id: "dev-tools-nodejs",
    title: t("devTools.nodeTitle"),
    description: t("devTools.nodeDescription"),
    whyNeeded: t("devTools.whyNeeded.nodejs"),
    group: "toolInstall",
    environment: t("environments.linuxCmd"),
    detailedGuide: t("devTools.nodeDetailedGuide"),
    script,
    resultPreview: [
      "▶ (3/3) Verifying version...",
      "v24.x.x",
      "✅ Node.js installed",
    ].join("\n"),
    troubleshooting: [
      { symptom: t("devTools.troubleshooting.wsl.0.symptom"), solution: t("devTools.troubleshooting.wsl.0.solution") },
      { symptom: t("devTools.troubleshooting.wsl.2.symptom"), solution: t("devTools.troubleshooting.wsl.2.solution") },
      { symptom: t("devTools.troubleshooting.wsl.3.symptom"), solution: t("devTools.troubleshooting.wsl.3.solution") },
    ],
  };
}

function wslVscodeStep(t: T): SetupStep {
  return {
    id: "editor",
    title: t("editor.title"),
    description: t("editor.description"),
    whyNeeded: t("editor.whyNeeded"),
    group: "toolInstall",
    environment: t("environments.windowsCmd"),
    detailedGuide: t("editor.detailedGuide.windows"),
    script: "winget install --id Microsoft.VisualStudioCode --accept-source-agreements --accept-package-agreements",
    resultPreview: `Found Visual Studio Code [Microsoft.VisualStudioCode]
This application is licensed to you by its owner.
Downloading https://az764295.vo.msecnd.net/...
  ██████████████████████  100%
Successfully installed`,
    troubleshooting: [
      { symptom: t("editor.troubleshooting.windows.0.symptom"), solution: t("editor.troubleshooting.windows.0.solution") },
      { symptom: t("editor.troubleshooting.windows.1.symptom"), solution: t("editor.troubleshooting.windows.1.solution") },
    ],
  };
}

// ─── Claude Code 통합 (WSL) ───
//
// ⚠️ WSL + NodeSource Node에서는 `npm install -g`가 EACCES로 즉시 실패한다.
// NodeSource는 node/npm을 /usr/bin에 설치하고 npm prefix가 /usr이라
// 글로벌 모듈이 /usr/lib/node_modules(root-owned)에 들어가기 때문이다.
//
// 해결: user prefix($HOME/.npm-global)로 전환 → sudo 없이 글로벌 설치 가능 +
// PATH에 추가하면 이후 새 셸에서도 `claude` 바이너리 접근 가능.
// grep -q ... || echo ... >> ~/.bashrc 로 idempotent하게 PATH 라인 추가.

function wslClaudeStep(t: T): SetupStep {
  // 주의: `(grep ... || echo ...)`는 괄호 서브셸로 묶어야 한다.
  // 안 그러면 `set -o pipefail && A && B || C && D`의 우선순위가
  // `(A && B) || (C && D)`로 해석돼 체인이 깨진다.
  const script = joinChain([
    "set -o pipefail",
    'echo "▶ (1/4) Configuring npm user prefix..."',
    'mkdir -p "$HOME/.npm-global"',
    'npm config set prefix "$HOME/.npm-global"',
    "(grep -q 'npm-global/bin' \"$HOME/.bashrc\" || echo 'export PATH=\"$HOME/.npm-global/bin:$PATH\"' >> \"$HOME/.bashrc\")",
    'export PATH="$HOME/.npm-global/bin:$PATH"',
    'echo "▶ (2/4) Installing Claude Code CLI..."',
    "npm install -g @anthropic-ai/claude-code",
    'echo "▶ (3/4) Installing VS Code extension..."',
    "code --install-extension anthropic.claude-code",
    'echo "▶ (4/4) Logging in..."',
    "claude login",
  ]);

  return {
    id: "ai-setup",
    title: t("aiSetup.title"),
    description: t("aiSetup.description"),
    whyNeeded: t("aiSetup.whyNeeded"),
    group: "aiSetup",
    environment: t("environments.linuxCmd"),
    detailedGuide: t("aiSetup.detailedGuide"),
    script,
    resultPreview: `▶ (1/4) Configuring npm user prefix...
▶ (2/4) Installing Claude Code CLI...
added 1 package in 3s
▶ (3/4) Installing VS Code extension...
Extension 'anthropic.claude-code' was successfully installed.
▶ (4/4) Logging in...
Opening browser for authentication...
✓ Logged in as yourname@email.com`,
    troubleshooting: [
      { symptom: t("aiSetup.troubleshooting.0.symptom"), solution: t("aiSetup.troubleshooting.0.solution") },
      { symptom: t("aiSetup.troubleshooting.1.symptom"), solution: t("aiSetup.troubleshooting.1.solution") },
      { symptom: t("aiSetup.troubleshooting.2.symptom"), solution: t("aiSetup.troubleshooting.2.solution") },
      { symptom: t("aiSetup.troubleshooting.3.symptom"), solution: t("aiSetup.troubleshooting.3.solution") },
    ],
  };
}

// ─── Python 백엔드 프로젝트 ───

function pythonBackendProjectStep(projectName: string, env: string, t: T): SetupStep {
  return {
    id: "project-backend",
    title: t("projectBackendPython.title"),
    description: t("projectBackendPython.description"),
    group: "projectCreate",
    environment: env,
    detailedGuide: t("projectBackendPython.detailedGuideTemplate", { projectName }),
    script: `mkdir -p ~/${projectName}/backend && cd ~/${projectName}/backend && python3 -m venv venv && . venv/bin/activate && pip install fastapi uvicorn && echo 'from fastapi import FastAPI\\napp = FastAPI()\\n\\n@app.get("/")\\ndef read_root():\\n    return {"message": "Hello, World!"}' > main.py`,
  };
}

// ─── Java 백엔드 프로젝트 ───

function javaBackendProjectStep(projectName: string, env: string, t: T): SetupStep {
  return {
    id: "project-backend",
    title: t("projectBackendJava.title"),
    description: t("projectBackendJava.description"),
    group: "projectCreate",
    environment: env,
    detailedGuide: t("projectBackendJava.detailedGuideTemplate", { projectName }),
    script: `mkdir -p ~/${projectName} && cd ~/${projectName} && curl -s "https://start.spring.io/starter.zip?type=gradle-project&language=java&bootVersion=3.4.4&javaVersion=17&packaging=jar&baseDir=backend&groupId=com.example&artifactId=backend&name=backend&packageName=com.example.app&dependencies=web,lombok,devtools,validation,data-jpa,sqlserver" -o backend.zip && unzip backend.zip && rm backend.zip && mv backend/src/main/resources/application.properties backend/src/main/resources/application.yml`,
  };
}

// ─── Expo 프로젝트 ───

function expoProjectStep(projectName: string, env: string, t: T): SetupStep {
  return {
    id: "project",
    title: t("projectExpo.title"),
    description: t("projectExpo.description"),
    group: "projectCreate",
    environment: env,
    whyNeeded: t("projectExpo.whyNeeded"),
    detailedGuide: t("projectExpo.detailedGuideTemplate", { projectName }),
    script: `npx create-expo-app@latest ~/${projectName} --template blank-typescript`,
    resultPreview: `✔ Downloaded template.
📦 Installing dependencies...
✅ Your project is ready!

To run your project:
  cd ${projectName}
  npx expo start`,
    troubleshooting: [
      { symptom: t("projectExpo.troubleshooting.0.symptom"), solution: t("projectExpo.troubleshooting.0.solution", { projectName }) },
      { symptom: t("projectExpo.troubleshooting.1.symptom"), solution: t("projectExpo.troubleshooting.1.solution", { projectName }) },
    ],
  };
}

// ─── 데이터 분석 프로젝트 ───

function dataAiProjectStep(projectName: string, env: string, t: T): SetupStep {
  return {
    id: "project",
    title: t("projectDataAi.title"),
    description: t("projectDataAi.description"),
    group: "projectCreate",
    environment: env,
    detailedGuide: t("projectDataAi.detailedGuideTemplate", { projectName }),
    script: `mkdir ~/${projectName} && cd ~/${projectName} && python3 -m venv venv && . venv/bin/activate && pip install jupyter numpy pandas matplotlib`,
  };
}

// ─── macOS 플로우 ───

function brewStep(t: T): SetupStep {
  return {
    id: "brew",
    title: t("brew.title"),
    description: t("brew.description"),
    whyNeeded: t("brew.whyNeeded"),
    group: "envPrep",
    environment: t("environments.macTerminal"),
    detailedGuide: t("brew.detailedGuide"),
    script: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
    resultPreview: `==> Installation successful!
==> Homebrew has enabled anonymous aggregate formulae and cask analytics.
==> Next steps:
- Run brew help to get started`,
    troubleshooting: [
      { symptom: t("brew.troubleshooting.0.symptom"), solution: t("brew.troubleshooting.0.solution") },
      { symptom: t("brew.troubleshooting.1.symptom"), solution: t("brew.troubleshooting.1.solution") },
      { symptom: t("brew.troubleshooting.2.symptom"), solution: t("brew.troubleshooting.2.solution") },
    ],
  };
}

// ─── 개발 도구 통합 설치 (macOS) ───
//
// macOS는 brew만 쓰면 파이프 체인 버그는 없지만, 다음 이슈를 해결해야 한다:
//
//   1. `brew install openjdk@21`이 keg-only라 PATH에 자동 연결되지 않는다.
//      결과적으로 직후 `java --version`이 `command not found`로 실패 →
//      체인이 중단되고 사용자는 원인을 알지 못한다.
//      해결: Temurin cask (`brew install --cask temurin@21`)로 전환.
//      Temurin은 /Library/Java/JavaVirtualMachines에 정식 설치되어
//      system java_home이 자동 인식한다.
//   2. resultPreview의 구체 버전 번호(예: `v20.17.0`)는 brew가 업그레이드되면
//      금방 stale해진다. `v24.x.x` 같은 형태로 변경.
//   3. 중간 실패 시 가시성 부족 — echo 마커로 완화.

function macDevToolsStep(goal: Goal, t: T): SetupStep {
  const node = needsNode(goal);
  const extra = extraRuntimeFor(goal);

  const brewPkgs: string[] = ["git"];
  const caskPkgs: string[] = [];
  const names: string[] = ["Git"];
  const versionChecks: string[] = ["git --version"];
  const resultLines: string[] = ["git version 2.x.x"];

  if (node) {
    brewPkgs.push("node");
    names.push("Node.js");
    versionChecks.push("node --version");
    resultLines.push("v24.x.x");
  }

  if (extra === "python") {
    brewPkgs.push("python");
    names.push("Python");
    versionChecks.push("python3 --version");
    resultLines.push("Python 3.x.x");
  } else if (extra === "java") {
    // ⚠️ openjdk@21 (formula)는 keg-only → java가 PATH에 없어서 `java --version`이
    // 즉시 실패한다. Temurin cask는 /Library/Java에 정식 설치되어 system java_home이
    // 자동 인식한다. cask 설치 시 관리자 비밀번호를 한 번 물어본다.
    caskPkgs.push("temurin@21");
    names.push("Java");
    versionChecks.push("java --version");
    resultLines.push('openjdk version "21.x.x"');
  }

  const installCmds: string[] = [`brew install ${brewPkgs.join(" ")}`];
  if (caskPkgs.length > 0) {
    installCmds.push(`brew install --cask ${caskPkgs.join(" ")}`);
  }

  const script = joinChain([
    "set -o pipefail",
    'echo "▶ (1/2) Installing packages via Homebrew..."',
    ...installCmds,
    'echo "▶ (2/2) Verifying versions..."',
    ...versionChecks,
    'echo "✅ Dev tools installed"',
  ]);

  return {
    id: "dev-tools",
    title: t("devTools.title"),
    description: t("devTools.descriptionTemplate", { names: names.join(", ") }),
    whyNeeded: buildDevToolsWhy(goal, t),
    group: "toolInstall",
    environment: t("environments.macTerminal"),
    detailedGuide: t("devTools.detailedGuide"),
    script,
    resultPreview: [
      "▶ (2/2) Verifying versions...",
      ...resultLines,
      "✅ Dev tools installed",
    ].join("\n"),
    troubleshooting: [
      { symptom: t("devTools.troubleshooting.macos.0.symptom"), solution: t("devTools.troubleshooting.macos.0.solution") },
      { symptom: t("devTools.troubleshooting.macos.1.symptom"), solution: t("devTools.troubleshooting.macos.1.solution") },
      { symptom: t("devTools.troubleshooting.macos.2.symptom"), solution: t("devTools.troubleshooting.macos.2.solution") },
    ],
  };
}

function macVscodeStep(t: T): SetupStep {
  return {
    id: "editor",
    title: t("editor.title"),
    description: t("editor.description"),
    whyNeeded: t("editor.whyNeeded"),
    group: "toolInstall",
    environment: t("environments.macTerminal"),
    script: `brew install --cask visual-studio-code && sudo ln -sf "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code" /usr/local/bin/code`,
    resultPreview: `==> Installing Cask visual-studio-code
==> Moving App 'Visual Studio Code.app' to '/Applications/Visual Studio Code.app'
🍺  visual-studio-code was successfully installed!
code command linked to /usr/local/bin/code`,
    troubleshooting: [
      { symptom: t("editor.troubleshooting.macos.0.symptom"), solution: t("editor.troubleshooting.macos.0.solution") },
      { symptom: t("editor.troubleshooting.macos.1.symptom"), solution: t("editor.troubleshooting.macos.1.solution") },
    ],
  };
}

// ─── Claude Code 통합 (macOS) ───
//
// brew로 설치된 node는 /opt/homebrew/lib/node_modules(user-owned)에 글로벌
// 모듈이 들어가므로 EACCES 이슈가 없다 — WSL처럼 npm prefix를 따로 만질
// 필요 없음. 일관성을 위해 pipefail + echo 마커만 추가.

function macClaudeStep(t: T): SetupStep {
  const script = joinChain([
    "set -o pipefail",
    'echo "▶ (1/3) Installing Claude Code CLI..."',
    "npm install -g @anthropic-ai/claude-code",
    'echo "▶ (2/3) Installing VS Code extension..."',
    "code --install-extension anthropic.claude-code",
    'echo "▶ (3/3) Logging in..."',
    "claude login",
  ]);

  return {
    id: "ai-setup",
    title: t("aiSetup.title"),
    description: t("aiSetup.description"),
    whyNeeded: t("aiSetup.whyNeeded"),
    group: "aiSetup",
    environment: t("environments.macTerminal"),
    detailedGuide: t("aiSetup.detailedGuide"),
    script,
    resultPreview: `▶ (1/3) Installing Claude Code CLI...
added 1 package in 3s
▶ (2/3) Installing VS Code extension...
Extension 'anthropic.claude-code' was successfully installed.
▶ (3/3) Logging in...
Opening browser for authentication...
✓ Logged in as yourname@email.com`,
    troubleshooting: [
      { symptom: t("aiSetup.troubleshooting.0.symptom"), solution: t("aiSetup.troubleshooting.0.solution") },
      { symptom: t("aiSetup.troubleshooting.1.symptom"), solution: t("aiSetup.troubleshooting.1.solution") },
      { symptom: t("aiSetup.troubleshooting.2.symptom"), solution: t("aiSetup.troubleshooting.2.solution") },
    ],
  };
}

// ─── 아키텍처 스캐폴딩 (Goal별 1개의 통합 단계) ───
// script = mkdir로 폴더 구조만 생성
// claudeMdContent = 웹에서 보여주고 사용자가 직접 파일로 저장

const CLAUDE_MD_NEXTJS = `# Project Architecture Rules

## Hexagonal Architecture

This project follows the Hexagonal (Ports & Adapters) architecture.

### Folder Structure
- \`src/domain/models/\` — Core data types and business entities
- \`src/domain/services/\` — Business logic (pure functions, no external dependencies)
- \`src/ports/\` — Interface definitions (contracts for domain to communicate with the outside)
- \`src/adapters/api/\` — External API calls, data fetching implementations
- \`src/adapters/ui/\` — Reusable UI components
- \`src/app/\` — Next.js App Router pages and routing

### Rules
1. Code in the domain folder must not depend on external libraries or frameworks
2. Define interfaces in ports first, then implement in adapters
3. Keep page components in app thin; write logic in domain/services
4. File names: kebab-case, types/interfaces: PascalCase, variables/functions: camelCase
5. Use TypeScript strict mode, no any type`;

const CLAUDE_MD_WEB_PYTHON = `# Project Architecture Rules

This project follows the Hexagonal (Ports & Adapters) architecture.

## frontend/ (Next.js)

### Folder Structure
- \`frontend/src/domain/models/\` — Core data types and business entities
- \`frontend/src/domain/services/\` — Business logic (pure functions)
- \`frontend/src/ports/\` — Interface definitions
- \`frontend/src/adapters/api/\` — Backend API call implementations
- \`frontend/src/adapters/ui/\` — Reusable UI components
- \`frontend/src/app/\` — Next.js App Router pages

### Rules
1. Domain code must not depend on external libraries
2. File names: kebab-case, TypeScript strict mode, no any

## backend/ (Python FastAPI)

### Folder Structure
- \`backend/domain/models/\` — Core data models (Pydantic BaseModel)
- \`backend/domain/services/\` — Business logic (pure functions)
- \`backend/ports/inbound/\` — Use case interfaces (ABC)
- \`backend/ports/outbound/\` — Repository interfaces (ABC)
- \`backend/adapters/inbound/api/\` — FastAPI routers
- \`backend/adapters/outbound/persistence/\` — DB access implementations
- \`backend/main.py\` — FastAPI app entry point

### Rules
1. Domain code must not depend on FastAPI or DB libraries
2. Use type hints on all functions
3. File names: snake_case, classes: PascalCase`;

const CLAUDE_MD_WEB_JAVA = `# Project Architecture Rules

This project follows the Hexagonal (Ports & Adapters) architecture.

## frontend/ (Next.js)

### Folder Structure
- \`frontend/src/domain/models/\` — Core data types and business entities
- \`frontend/src/domain/services/\` — Business logic (pure functions)
- \`frontend/src/ports/\` — Interface definitions
- \`frontend/src/adapters/api/\` — Backend API call implementations
- \`frontend/src/adapters/ui/\` — Reusable UI components
- \`frontend/src/app/\` — Next.js App Router pages

### Rules
1. Domain code must not depend on external libraries
2. File names: kebab-case, TypeScript strict mode, no any

## backend/ (Java Spring Boot)

### Package Structure
- \`backend/.../domain/model/\` — Core entities (JPA Entity + Lombok)
- \`backend/.../domain/service/\` — Business logic (@Service)
- \`backend/.../port/in/\` — Inbound ports (use case interfaces)
- \`backend/.../port/out/\` — Outbound ports (repository interfaces)
- \`backend/.../adapter/in/web/\` — REST controllers (@RestController)
- \`backend/.../adapter/out/persistence/\` — JPA repository implementations

### Rules
1. Domain must not directly depend on external libraries other than Spring and JPA
2. Actively use Lombok (@Getter, @Builder, @RequiredArgsConstructor)
3. DTOs belong in the adapter layer, Entities in the domain layer
4. Manage configuration with application.yml`;

const CLAUDE_MD_EXPO = `# Project Architecture Rules

## Hexagonal Architecture

This project follows the Hexagonal (Ports & Adapters) architecture.

### Folder Structure
- \`src/domain/models/\` — Core data models (pure TypeScript)
- \`src/domain/services/\` — Business logic (no external dependencies)
- \`src/ports/\` — Interface definitions (TypeScript interface)
- \`src/adapters/api/\` — HTTP API call implementations
- \`src/adapters/ui/screens/\` — Screen-level components
- \`src/adapters/ui/components/\` — Reusable UI components
- \`App.tsx\` — App entry point

### Rules
1. Code in the domain folder must not depend on React Native or external packages
2. Define interfaces in ports first, then implement in adapters
3. Keep screens thin; write logic in domain/services
4. File names: kebab-case.ts, components: PascalCase
5. Use functional components only`;

const CLAUDE_MD_DATA_AI = `# Project Structure Rules

### Folder Structure
- \`data/\` — Raw data files (CSV, JSON, etc.)
- \`notebooks/\` — Jupyter Notebook files
- \`src/loaders/\` — Data loading and preprocessing
- \`src/analyzers/\` — Analysis logic
- \`src/visualizers/\` — Visualization functions

### Rules
1. Separate data loading from analysis logic
2. Notebooks are for experiments/visualization; extract reusable logic into src/
3. Use type hints on all functions
4. File names: snake_case`;

function architectureStep(goal: Goal, projectName: string, env: string, t: T): SetupStep {
  const home = `~/${projectName}`;
  const descKey = goal === "data-ai" ? "architecture.description.dataAi" : "architecture.description.default";

  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      return {
        id: "architecture",
        title: t("architecture.title"),
        description: t(descKey),
        group: "projectCreate",
        environment: env,
        detailedGuide: t("architecture.detailedGuide"),
        script: `cd ${home} && mkdir -p src/domain/models src/domain/services src/ports src/adapters/api src/adapters/ui`,
        claudeMdContent: CLAUDE_MD_NEXTJS,
      };
    case "web-python":
      return {
        id: "architecture",
        title: t("architecture.title"),
        description: t(descKey),
        group: "projectCreate",
        environment: env,
        detailedGuide: t("architecture.detailedGuide"),
        script: `cd ${home}/frontend && mkdir -p src/domain/models src/domain/services src/ports src/adapters/api src/adapters/ui && cd ${home}/backend && mkdir -p domain/models domain/services ports/inbound ports/outbound adapters/inbound/api adapters/outbound/persistence`,
        claudeMdContent: CLAUDE_MD_WEB_PYTHON,
      };
    case "web-java":
      return {
        id: "architecture",
        title: t("architecture.title"),
        description: t(descKey),
        group: "projectCreate",
        environment: env,
        detailedGuide: t("architecture.detailedGuide"),
        script: `cd ${home}/frontend && mkdir -p src/domain/models src/domain/services src/ports src/adapters/api src/adapters/ui && cd ${home}/backend && mkdir -p src/main/java/com/example/app/domain/model src/main/java/com/example/app/domain/service src/main/java/com/example/app/port/in src/main/java/com/example/app/port/out src/main/java/com/example/app/adapter/in/web src/main/java/com/example/app/adapter/out/persistence`,
        claudeMdContent: CLAUDE_MD_WEB_JAVA,
      };
    case "mobile":
      return {
        id: "architecture",
        title: t("architecture.title"),
        description: t(descKey),
        group: "projectCreate",
        environment: env,
        detailedGuide: t("architecture.detailedGuide"),
        script: `cd ${home} && mkdir -p src/domain/models src/domain/services src/ports src/adapters/api src/adapters/ui/screens src/adapters/ui/components`,
        claudeMdContent: CLAUDE_MD_EXPO,
      };
    case "data-ai":
      return {
        id: "architecture",
        title: t("architecture.title"),
        description: t(descKey),
        group: "projectCreate",
        environment: env,
        detailedGuide: t("architecture.detailedGuide"),
        script: `cd ${home} && mkdir -p data notebooks src/loaders src/analyzers src/visualizers`,
        claudeMdContent: CLAUDE_MD_DATA_AI,
      };
  }
}

// ─── 프로젝트 + 첫 실행 단계 (Goal별) ───

function nextjsProjectStep(projectName: string, variant: "wsl" | "mac", isFrontendOnly: boolean, t: T): SetupStep {
  const titleKey = isFrontendOnly ? "projectFrontend.title.withBackend" : "projectFrontend.title.standalone";
  const descKey = isFrontendOnly ? "projectFrontend.description.withBackend" : "projectFrontend.description.standalone";
  const path = isFrontendOnly ? `${projectName}/frontend` : projectName;
  const env = variant === "wsl" ? t("environments.linuxCmd") : t("environments.macTerminal");

  return {
    id: "project-frontend",
    title: t(titleKey),
    description: t(descKey),
    group: "projectCreate",
    environment: env,
    detailedGuide: t("projectFrontend.detailedGuideTemplate", { path }),
    script: isFrontendOnly
      ? `mkdir -p ~/${projectName} && npx create-next-app@latest ~/${path} --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm`
      : `npx create-next-app@latest ~/${path} --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm`,
    resultPreview: `✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … Yes
...
Success! Created ${path}
  npm run dev    (개발 서버 시작)
  npm run build  (배포용 빌드)`,
    troubleshooting: [
      { symptom: t("projectFrontend.troubleshooting.0.symptom"), solution: t("projectFrontend.troubleshooting.0.solution") },
      { symptom: t("projectFrontend.troubleshooting.1.symptom"), solution: t("projectFrontend.troubleshooting.1.solution") },
      { symptom: t("projectFrontend.troubleshooting.2.symptom"), solution: t("projectFrontend.troubleshooting.2.solution", { path }) },
    ],
  };
}

function firstRunStep(projectName: string, goal: Goal, env: string, t: T): SetupStep {
  const hasFeBe = goal === "web-python" || goal === "web-java";

  return {
    id: "first-run",
    title: t("firstRun.title"),
    description: t("firstRun.description"),
    group: "projectCreate",
    environment: env,
    detailedGuide: hasFeBe
      ? t("firstRun.detailedGuide.withBackend")
      : t("firstRun.detailedGuide.simple"),
    script: `code ~/${projectName}`,
  };
}

function appendProjectSteps(
  steps: SetupStep[],
  goal: Goal,
  projectName: string,
  variant: "wsl" | "mac",
  t: T,
): void {
  const env = variant === "wsl" ? t("environments.linuxCmd") : t("environments.macTerminal");

  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      steps.push(nextjsProjectStep(projectName, variant, false, t));
      break;
    case "web-python":
      steps.push(nextjsProjectStep(projectName, variant, true, t));
      steps.push(pythonBackendProjectStep(projectName, env, t));
      break;
    case "web-java":
      steps.push(nextjsProjectStep(projectName, variant, true, t));
      steps.push(javaBackendProjectStep(projectName, env, t));
      break;
    case "mobile":
      steps.push(expoProjectStep(projectName, env, t));
      break;
    case "data-ai":
      steps.push(dataAiProjectStep(projectName, env, t));
      break;
  }

  // 아키텍처 스캐폴딩 (CLAUDE.md는 프로젝트 루트에 1개)
  steps.push(architectureStep(goal, projectName, env, t));

  // 첫 실행
  steps.push(firstRunStep(projectName, goal, env, t));
}

// ─── 메인 ───

export function getSetupSteps(
  os: OS,
  goal: Goal,
  projectName: string,
  t: T,
): SetupStep[] {
  const steps: SetupStep[] = [];

  steps.push(terminalGuide(os, t));

  if (os === "windows") {
    // 환경 준비
    steps.push(wslInstallStep(t));
    steps.push(wslOpenStep(t));

    // 도구 설치 — Basic(Git+Python/Java)과 Node.js를 분리 (실패 시 재시도 용이)
    steps.push(wslBasicToolsStep(goal, t));
    if (needsNode(goal)) {
      steps.push(wslNodejsStep(t));
    }
    steps.push(wslVscodeStep(t));

    // AI 설정
    steps.push(wslClaudeStep(t));

    // 프로젝트 생성
    appendProjectSteps(steps, goal, projectName, "wsl", t);
  } else {
    // 환경 준비
    steps.push(brewStep(t));

    // 도구 설치
    steps.push(macDevToolsStep(goal, t));
    steps.push(macVscodeStep(t));

    // AI 설정
    steps.push(macClaudeStep(t));

    // 프로젝트 생성
    appendProjectSteps(steps, goal, projectName, "mac", t);
  }

  return steps;
}
