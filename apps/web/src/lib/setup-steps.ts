import type { OS, Goal } from "./onboarding";

export type SetupGroup = "환경 준비" | "도구 설치" | "AI 설정" | "프로젝트 생성";

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
  environment?: "Windows 명령창" | "리눅스 명령창" | "Mac 터미널" | "VS Code 터미널" | "어디서든";
  /** CLAUDE.md 파일 내용 — 이 필드가 있으면 웹에서 내용을 보여주고 직접 저장하도록 안내 */
  claudeMdContent?: string;
  /** 성공 시 예상 터미널 출력 — 사용자가 결과를 비교할 수 있도록 */
  resultPreview?: string;
  /** 흔한 에러와 해결 방법 */
  troubleshooting?: TroubleshootingItem[];
  /** 이 도구가 왜 필요한지 비전공자용 한줄 설명 */
  whyNeeded?: string;
}

/** Goal별 필요한 추가 런타임 판별 */
type ExtraRuntime = "python" | "java" | "flutter" | null;
function extraRuntimeFor(goal: Goal): ExtraRuntime {
  if (goal === "web-python" || goal === "data-ai") return "python";
  if (goal === "web-java") return "java";
  if (goal === "mobile") return "flutter";
  return null;
}

/** Node.js가 필요한 Goal인지 판별 */
function needsNode(goal: Goal): boolean {
  return goal === "web-nextjs" || goal === "web-python" || goal === "web-java" || goal === "not-sure";
}

// ─── 공통 단계 ───

function terminalGuide(os: OS): SetupStep {
  const guide = os === "windows"
    ? "Windows 검색창(돋보기 아이콘)에 'PowerShell'을 입력하고, 'Windows PowerShell'을 클릭해서 열어주세요. 리눅스 환경 설치 후에는 'Ubuntu'를 검색해서 열면 됩니다."
    : "Spotlight(Cmd + Space)를 열고 '터미널'을 입력한 후 Enter를 눌러주세요.";

  return {
    id: "terminal",
    title: "터미널 열기",
    description: "명령어를 실행할 창을 열어주세요",
    group: "환경 준비",
    detailedGuide: guide,
    script: "",
  };
}

// ─── Windows (WSL2) 플로우 ───

function wslInstallStep(): SetupStep {
  return {
    id: "wsl",
    title: "리눅스 환경 설치 (WSL2)",
    description: "Windows에서 AI 코딩 도구를 쓰려면 리눅스가 필요해요",
    whyNeeded: "AI 코딩 도구(Claude Code)는 리눅스에서만 작동해요. WSL2는 Windows 안에서 돌아가는 미니 리눅스 컴퓨터예요. 설치하면 Windows를 쓰면서 리눅스 명령어를 사용할 수 있어요.",
    group: "환경 준비",
    environment: "Windows 명령창",
    detailedGuide:
      "설치 후 컴퓨터를 재시작해야 합니다. 재시작 후 Ubuntu 창이 자동으로 열리며 사용자 이름과 비밀번호를 설정하게 됩니다.",
    script: "wsl --install",
    resultPreview: `설치 중: Ubuntu
설치를 완료했습니다: Ubuntu
요청한 작업이 완료되었습니다.
컴퓨터를 다시 시작해 주세요.`,
    troubleshooting: [
      { symptom: "'wsl'은(는) 인식할 수 없는 명령입니다", solution: "Windows 10 버전 2004 이상이 필요합니다. 설정 → 시스템 → 정보에서 OS 빌드를 확인하고, Windows 업데이트를 실행해주세요." },
      { symptom: "가상화 기능이 활성화되지 않았다는 에러", solution: "BIOS 설정에서 가상화(Virtualization Technology)를 켜야 합니다. 컴퓨터 재시작 시 F2 또는 Del 키를 눌러 BIOS에 진입하세요." },
      { symptom: "이미 설치되어 있다는 메시지", solution: "정상입니다! wsl --update 를 실행해서 최신 버전으로 업데이트한 후 다음 단계로 넘어가세요." },
      { symptom: "재시작 후에도 Ubuntu가 열리지 않음", solution: "Windows 검색에서 'Ubuntu'를 검색해보세요. 없으면 Microsoft Store에서 'Ubuntu'를 검색해서 설치해주세요." },
    ],
  };
}

function wslOpenStep(): SetupStep {
  return {
    id: "wsl-open",
    title: "리눅스 명령창 열기 (Ubuntu)",
    description: "이제부터는 리눅스 명령창에서 진행해요",
    whyNeeded: "방금 설치한 리눅스 환경에 들어가는 거예요. 프롬프트(입력 표시)가 바뀌면 리눅스 세계에 들어온 거예요.",
    group: "환경 준비",
    environment: "Windows 명령창",
    detailedGuide:
      "아래 명령어를 입력하면 리눅스 명령창으로 전환됩니다. 프롬프트가 바뀌면 성공! 전환 후 cd ~ 를 입력해서 홈 폴더로 이동해주세요.",
    script: "wsl",
    resultPreview: `yourname@DESKTOP-XXXXX:/mnt/c/Users/yourname$
$ cd ~
yourname@DESKTOP-XXXXX:~$`,
    troubleshooting: [
      { symptom: "사용자 이름과 비밀번호를 물어봐요", solution: "정상입니다! 원하는 사용자 이름과 비밀번호를 입력하세요. 비밀번호 입력 시 화면에 아무것도 안 보이는 게 정상이에요." },
      { symptom: "'wsl' 입력 후 아무 반응이 없어요", solution: "WSL 설치 후 재시작을 안 했을 수 있어요. 컴퓨터를 재시작한 후 다시 시도해주세요." },
      { symptom: "cd ~ 후에도 /mnt/c/... 경로에 있어요", solution: "프롬프트 끝부분이 :~$로 바뀌었는지 확인하세요. pwd 를 입력해서 /home/사용자이름 이 나오면 성공입니다." },
    ],
  };
}

function buildDevToolsWhy(goal: Goal): string {
  const parts = ["Git은 코드의 변경 이력을 저장하는 '타임머신'이에요."];
  if (needsNode(goal)) parts.push("Node.js는 웹사이트를 만들 때 필요한 자바스크립트 실행기예요.");
  const extra = extraRuntimeFor(goal);
  if (extra === "python") parts.push("Python은 AI/데이터 분석에 많이 쓰이는 프로그래밍 언어예요.");
  else if (extra === "java") parts.push("Java는 대규모 서비스에서 많이 쓰이는 안정적인 프로그래밍 언어예요.");
  else if (extra === "flutter") parts.push("Flutter는 하나의 코드로 안드로이드와 iOS 앱을 동시에 만드는 도구예요.");
  return parts.join(" ");
}

// ─── 개발 도구 통합 설치 (WSL) ───

function wslDevToolsStep(goal: Goal): SetupStep {
  const node = needsNode(goal);
  const extra = extraRuntimeFor(goal);

  const parts: string[] = [];
  const names: string[] = [];
  const results: string[] = [];

  // Git (항상 포함)
  parts.push("sudo apt update && sudo apt install -y git");
  names.push("Git");
  results.push("git version 2.43.0");

  // Node.js
  if (node) {
    parts.push("curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt install -y nodejs");
    names.push("Node.js");
    results.push("v20.17.0");
  }

  // 추가 런타임
  if (extra === "python") {
    parts.push("sudo apt install -y python3 python3-pip python3-venv");
    names.push("Python");
    results.push("Python 3.12.3");
  } else if (extra === "java") {
    parts.push("sudo apt install -y openjdk-21-jdk");
    names.push("Java");
    results.push('openjdk version "21.0.3" 2024-04-16');
  } else if (extra === "flutter") {
    parts.push("sudo snap install flutter --classic");
    names.push("Flutter");
    results.push("Flutter 3.22.2 • channel stable");
  }

  // 버전 확인
  const versionChecks: string[] = ["git --version"];
  if (node) versionChecks.push("node --version");
  if (extra === "python") versionChecks.push("python3 --version");
  else if (extra === "java") versionChecks.push("java --version");
  else if (extra === "flutter") versionChecks.push("flutter --version");

  const script = parts.join(" && ") + " && " + versionChecks.join(" && ");

  return {
    id: "dev-tools",
    title: "개발 도구 설치",
    description: `${names.join(", ")}을 설치해요`,
    whyNeeded: buildDevToolsWhy(goal),
    group: "도구 설치",
    environment: "리눅스 명령창",
    detailedGuide: "여러 도구를 한번에 설치합니다. 시간이 조금 걸릴 수 있어요.",
    script,
    resultPreview: results.join("\n"),
    troubleshooting: [
      { symptom: "sudo 비밀번호를 물어보는데 입력이 안 돼요", solution: "비밀번호를 입력하면 화면에 아무것도 안 보이는 게 정상이에요. 그냥 비밀번호를 타이핑하고 Enter를 누르세요." },
      { symptom: "Unable to locate package 에러", solution: "sudo apt update 를 먼저 실행한 후 다시 시도해주세요." },
      { symptom: "dpkg lock 또는 다른 프로세스가 사용 중이라는 에러", solution: "다른 설치 작업이 진행 중이에요. 잠시 기다린 후(1~2분) 다시 시도해주세요." },
      { symptom: "curl: command not found", solution: "sudo apt update && sudo apt install -y curl 을 먼저 실행한 후 다시 시도해주세요." },
    ],
  };
}

function wslVscodeStep(): SetupStep {
  return {
    id: "editor",
    title: "코드 편집기 설치 (VS Code)",
    description: "코드를 편집하는 프로그램을 설치해요",
    whyNeeded: "VS Code는 코드를 작성하는 전용 편집기예요. 메모장과 비슷하지만, 코드 자동 완성, 오류 표시, AI 도우미 연결 등 개발에 특화된 기능이 있어요.",
    group: "도구 설치",
    environment: "Windows 명령창",
    detailedGuide:
      "VS Code는 Windows에 설치하지만, WSL과 자동으로 연결됩니다. 새 PowerShell 창을 열어서 실행해주세요.",
    script: "winget install --id Microsoft.VisualStudioCode --accept-source-agreements --accept-package-agreements",
    resultPreview: `Found Visual Studio Code [Microsoft.VisualStudioCode]
This application is licensed to you by its owner.
Downloading https://az764295.vo.msecnd.net/...
  ██████████████████████  100%
Successfully installed`,
    troubleshooting: [
      { symptom: "'winget'이 인식되지 않습니다", solution: "Microsoft Store에서 '앱 설치 관리자'를 검색해서 업데이트해주세요. 그래도 안 되면 code.visualstudio.com 에서 직접 다운로드하세요." },
      { symptom: "이미 설치되어 있다는 메시지", solution: "정상입니다! 이미 VS Code가 설치되어 있으니 다음 단계로 넘어가세요." },
    ],
  };
}

// ─── Claude Code 통합 (WSL) ───

function wslClaudeStep(): SetupStep {
  return {
    id: "ai-setup",
    title: "AI 코딩 도우미 설치 (Claude Code)",
    description: "AI 코딩 도우미를 설치하고 계정에 연결해요",
    whyNeeded: "Claude Code는 대화하듯이 코딩을 도와주는 AI예요. '로그인 페이지 만들어줘'처럼 말하면 코드를 대신 작성해줍니다.",
    group: "AI 설정",
    environment: "리눅스 명령창",
    detailedGuide: "설치 후 자동으로 로그인이 진행됩니다. 브라우저가 열리면 Claude 계정으로 로그인해주세요. 계정이 없으면 무료로 가입할 수 있습니다.",
    script: "npm install -g @anthropic-ai/claude-code && code --install-extension anthropic.claude-code && claude login",
    resultPreview: `added 1 package in 3s
Extension 'anthropic.claude-code' was successfully installed.
Opening browser for authentication...
✓ Logged in as yourname@email.com`,
    troubleshooting: [
      { symptom: "npm: command not found", solution: "Node.js가 설치되지 않았어요. '개발 도구 설치' 단계를 다시 확인해주세요." },
      { symptom: "EACCES permission denied 에러", solution: "sudo npm install -g @anthropic-ai/claude-code 로 다시 시도해주세요." },
      { symptom: "브라우저가 자동으로 열리지 않아요", solution: "터미널에 표시된 URL을 복사해서 브라우저 주소창에 직접 붙여넣으세요." },
      { symptom: "로그인 후 터미널에 반응이 없어요", solution: "브라우저에서 로그인을 완료하면 터미널이 자동으로 인식합니다. 잠시 기다려주세요." },
    ],
  };
}

// ─── Python 백엔드 프로젝트 ───

function pythonBackendProjectStep(projectName: string, env: SetupStep["environment"]): SetupStep {
  return {
    id: "project-backend",
    title: "백엔드 프로젝트 생성 (Python)",
    description: "Python FastAPI 서버 프로젝트를 만들어요",
    group: "프로젝트 생성",
    environment: env,
    detailedGuide: `~/${projectName}/backend 폴더에 프로젝트를 만듭니다.`,
    script: `mkdir -p ~/${projectName}/backend && cd ~/${projectName}/backend && python3 -m venv venv && . venv/bin/activate && pip install fastapi uvicorn && echo 'from fastapi import FastAPI\\napp = FastAPI()\\n\\n@app.get("/")\\ndef read_root():\\n    return {"message": "Hello, World!"}' > main.py`,
  };
}

// ─── Java 백엔드 프로젝트 ───

function javaBackendProjectStep(projectName: string, env: SetupStep["environment"]): SetupStep {
  return {
    id: "project-backend",
    title: "백엔드 프로젝트 생성 (Java)",
    description: "Java Spring Boot 서버 프로젝트를 다운로드해요",
    group: "프로젝트 생성",
    environment: env,
    detailedGuide: `~/${projectName}/backend 폴더에 프로젝트를 만듭니다. Spring Initializr에서 실무에 필요한 기본 라이브러리가 포함된 프로젝트를 자동으로 다운로드합니다.`,
    script: `mkdir -p ~/${projectName} && cd ~/${projectName} && curl -s "https://start.spring.io/starter.zip?type=gradle-project&language=java&bootVersion=3.4.4&javaVersion=17&packaging=jar&baseDir=backend&groupId=com.example&artifactId=backend&name=backend&packageName=com.example.app&dependencies=web,lombok,devtools,validation,data-jpa,sqlserver" -o backend.zip && unzip backend.zip && rm backend.zip && mv backend/src/main/resources/application.properties backend/src/main/resources/application.yml`,
  };
}

// ─── Flutter 프로젝트 ───

function flutterProjectStep(projectName: string, env: SetupStep["environment"]): SetupStep {
  return {
    id: "project",
    title: "Flutter 프로젝트 생성",
    description: "나만의 모바일 앱 프로젝트를 만들어요",
    group: "프로젝트 생성",
    environment: env,
    script: `flutter create ${projectName}`,
  };
}

// ─── 데이터 분석 프로젝트 ───

function dataAiProjectStep(projectName: string, env: SetupStep["environment"]): SetupStep {
  return {
    id: "project",
    title: "데이터 분석 환경 설정",
    description: "Jupyter Notebook을 설치해요",
    group: "프로젝트 생성",
    environment: env,
    detailedGuide: `~/${projectName} 폴더에 가상환경을 만들고 데이터 분석 라이브러리를 설치합니다.`,
    script: `mkdir ~/${projectName} && cd ~/${projectName} && python3 -m venv venv && . venv/bin/activate && pip install jupyter numpy pandas matplotlib`,
  };
}

// ─── macOS 플로우 ───

function brewStep(): SetupStep {
  return {
    id: "brew",
    title: "패키지 관리자 설치 (Homebrew)",
    description: "Mac에서 프로그램을 쉽게 설치할 수 있게 해주는 도구예요",
    whyNeeded: "Homebrew는 Mac의 '앱 스토어 터미널 버전'이에요. 명령어 한 줄로 개발 도구를 설치하고 관리할 수 있어요.",
    group: "환경 준비",
    environment: "Mac 터미널",
    detailedGuide:
      "설치 중 비밀번호를 물어볼 수 있습니다. Mac 로그인 비밀번호를 입력하세요. 설치 완료 후 터미널을 닫고 다시 열어주세요.",
    script: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
    resultPreview: `==> Installation successful!
==> Homebrew has enabled anonymous aggregate formulae and cask analytics.
==> Next steps:
- Run brew help to get started`,
    troubleshooting: [
      { symptom: "Command Line Tools 설치 팝업이 떠요", solution: "정상입니다! '설치' 버튼을 눌러서 설치를 진행하세요. 설치 후 Homebrew 설치가 계속됩니다." },
      { symptom: "비밀번호를 물어봐요", solution: "Mac 로그인 비밀번호를 입력하세요. 입력 시 화면에 아무것도 안 보이는 게 정상이에요." },
      { symptom: "설치 후 brew 명령어가 안 돼요", solution: "터미널을 닫고 새로 열어주세요. 그래도 안 되면 eval \"$(/opt/homebrew/bin/brew shellenv)\" 를 실행해주세요." },
    ],
  };
}

// ─── 개발 도구 통합 설치 (macOS) ───

function macDevToolsStep(goal: Goal): SetupStep {
  const node = needsNode(goal);
  const extra = extraRuntimeFor(goal);

  const brewPkgs: string[] = ["git"];
  const names: string[] = ["Git"];
  const results: string[] = ["git version 2.45.2"];
  const versionChecks: string[] = ["git --version"];

  if (node) {
    brewPkgs.push("node");
    names.push("Node.js");
    results.push("v20.17.0");
    versionChecks.push("node --version");
  }

  const parts: string[] = [`brew install ${brewPkgs.join(" ")}`];

  if (extra === "python") {
    parts.push("brew install python");
    names.push("Python");
    results.push("Python 3.12.3");
    versionChecks.push("python3 --version");
  } else if (extra === "java") {
    parts.push("brew install openjdk@21");
    names.push("Java");
    results.push('openjdk version "21.0.3" 2024-04-16');
    versionChecks.push("java --version");
  } else if (extra === "flutter") {
    parts.push("brew install --cask flutter");
    names.push("Flutter");
    results.push("Flutter 3.22.2 • channel stable");
    versionChecks.push("flutter --version");
  }

  const script = parts.join(" && ") + " && " + versionChecks.join(" && ");

  return {
    id: "dev-tools",
    title: "개발 도구 설치",
    description: `${names.join(", ")}을 설치해요`,
    whyNeeded: buildDevToolsWhy(goal),
    group: "도구 설치",
    environment: "Mac 터미널",
    detailedGuide: "여러 도구를 한번에 설치합니다. 시간이 조금 걸릴 수 있어요.",
    script,
    resultPreview: results.join("\n"),
    troubleshooting: [
      { symptom: "brew: command not found", solution: "Homebrew가 설치되지 않았어요. 이전 단계(Homebrew 설치)를 먼저 완료해주세요." },
      { symptom: "already installed 메시지", solution: "이미 설치되어 있으니 정상입니다! 다음 단계로 넘어가세요." },
      { symptom: "Error: No available formula 에러", solution: "brew update 를 실행한 후 다시 시도해주세요." },
    ],
  };
}

function macVscodeStep(): SetupStep {
  return {
    id: "editor",
    title: "코드 편집기 설치 (VS Code)",
    description: "코드를 편집하는 프로그램을 설치해요",
    whyNeeded: "VS Code는 코드를 작성하는 전용 편집기예요. 메모장과 비슷하지만, 코드 자동 완성, 오류 표시, AI 도우미 연결 등 개발에 특화된 기능이 있어요.",
    group: "도구 설치",
    environment: "Mac 터미널",
    script: "brew install --cask visual-studio-code",
    resultPreview: `==> Installing Cask visual-studio-code
==> Moving App 'Visual Studio Code.app' to '/Applications/Visual Studio Code.app'
🍺  visual-studio-code was successfully installed!`,
    troubleshooting: [
      { symptom: "이미 설치되어 있다는 메시지", solution: "정상입니다! 다음 단계로 넘어가세요." },
      { symptom: "brew: command not found", solution: "터미널을 닫고 새로 열어주세요. 그래도 안 되면 Homebrew 설치 단계를 다시 확인해주세요." },
    ],
  };
}

// ─── Claude Code 통합 (macOS) ───

function macClaudeStep(): SetupStep {
  return {
    id: "ai-setup",
    title: "AI 코딩 도우미 설치 (Claude Code)",
    description: "AI 코딩 도우미를 설치하고 계정에 연결해요",
    whyNeeded: "Claude Code는 대화하듯이 코딩을 도와주는 AI예요. '로그인 페이지 만들어줘'처럼 말하면 코드를 대신 작성해줍니다.",
    group: "AI 설정",
    environment: "Mac 터미널",
    detailedGuide: "설치 후 자동으로 로그인이 진행됩니다. 브라우저가 열리면 Claude 계정으로 로그인해주세요. 계정이 없으면 무료로 가입할 수 있습니다.",
    script: "npm install -g @anthropic-ai/claude-code && code --install-extension anthropic.claude-code && claude login",
    resultPreview: `added 1 package in 3s
Extension 'anthropic.claude-code' was successfully installed.
Opening browser for authentication...
✓ Logged in as yourname@email.com`,
    troubleshooting: [
      { symptom: "npm: command not found", solution: "Node.js가 설치되지 않았어요. '개발 도구 설치' 단계를 다시 확인해주세요." },
      { symptom: "EACCES permission denied 에러", solution: "sudo npm install -g @anthropic-ai/claude-code 로 다시 시도해주세요." },
      { symptom: "브라우저가 자동으로 열리지 않아요", solution: "터미널에 표시된 URL을 복사해서 브라우저 주소창에 직접 붙여넣으세요." },
    ],
  };
}

// ─── 아키텍처 스캐폴딩 (Goal별 1개의 통합 단계) ───
// script = mkdir로 폴더 구조만 생성
// claudeMdContent = 웹에서 보여주고 사용자가 직접 파일로 저장

const CLAUDE_MD_NEXTJS = `# 프로젝트 아키텍처 규칙

## 헥사고날 아키텍처

이 프로젝트는 헥사고날(포트 & 어댑터) 아키텍처를 따릅니다.

### 폴더 구조
- \`src/domain/models/\` — 핵심 데이터 타입 및 비즈니스 엔티티
- \`src/domain/services/\` — 비즈니스 로직 (외부 의존성 없이 순수 함수로 작성)
- \`src/ports/\` — 인터페이스 정의 (domain이 외부와 소통하는 계약)
- \`src/adapters/api/\` — 외부 API 호출, 데이터 fetching 구현
- \`src/adapters/ui/\` — 재사용 가능한 UI 컴포넌트
- \`src/app/\` — Next.js App Router 페이지 및 라우팅

### 규칙
1. domain 폴더의 코드는 외부 라이브러리나 프레임워크에 의존하지 않는다
2. ports에 인터페이스를 먼저 정의하고, adapters에서 구현한다
3. app 폴더의 페이지 컴포넌트는 얇게 유지하고, 로직은 domain/services에 작성한다
4. 파일명은 kebab-case, 타입/인터페이스는 PascalCase, 함수/변수는 camelCase
5. TypeScript strict 모드 사용, any 타입 금지`;

const CLAUDE_MD_WEB_PYTHON = `# 프로젝트 아키텍처 규칙

이 프로젝트는 헥사고날(포트 & 어댑터) 아키텍처를 따릅니다.

## frontend/ (Next.js)

### 폴더 구조
- \`frontend/src/domain/models/\` — 핵심 데이터 타입 및 비즈니스 엔티티
- \`frontend/src/domain/services/\` — 비즈니스 로직 (순수 함수)
- \`frontend/src/ports/\` — 인터페이스 정의
- \`frontend/src/adapters/api/\` — 백엔드 API 호출 구현
- \`frontend/src/adapters/ui/\` — 재사용 가능한 UI 컴포넌트
- \`frontend/src/app/\` — Next.js App Router 페이지

### 규칙
1. domain 코드는 외부 라이브러리에 의존하지 않는다
2. 파일명은 kebab-case, TypeScript strict 모드, any 금지

## backend/ (Python FastAPI)

### 폴더 구조
- \`backend/domain/models/\` — 핵심 데이터 모델 (Pydantic BaseModel)
- \`backend/domain/services/\` — 비즈니스 로직 (순수 함수)
- \`backend/ports/inbound/\` — 유스케이스 인터페이스 (ABC)
- \`backend/ports/outbound/\` — 리포지토리 인터페이스 (ABC)
- \`backend/adapters/inbound/api/\` — FastAPI 라우터
- \`backend/adapters/outbound/persistence/\` — DB 접근 구현체
- \`backend/main.py\` — FastAPI 앱 진입점

### 규칙
1. domain 코드는 FastAPI, DB 라이브러리에 의존하지 않는다
2. 타입 힌트를 모든 함수에 사용한다
3. 파일명은 snake_case, 클래스는 PascalCase`;

const CLAUDE_MD_WEB_JAVA = `# 프로젝트 아키텍처 규칙

이 프로젝트는 헥사고날(포트 & 어댑터) 아키텍처를 따릅니다.

## frontend/ (Next.js)

### 폴더 구조
- \`frontend/src/domain/models/\` — 핵심 데이터 타입 및 비즈니스 엔티티
- \`frontend/src/domain/services/\` — 비즈니스 로직 (순수 함수)
- \`frontend/src/ports/\` — 인터페이스 정의
- \`frontend/src/adapters/api/\` — 백엔드 API 호출 구현
- \`frontend/src/adapters/ui/\` — 재사용 가능한 UI 컴포넌트
- \`frontend/src/app/\` — Next.js App Router 페이지

### 규칙
1. domain 코드는 외부 라이브러리에 의존하지 않는다
2. 파일명은 kebab-case, TypeScript strict 모드, any 금지

## backend/ (Java Spring Boot)

### 패키지 구조
- \`backend/.../domain/model/\` — 핵심 엔티티 (JPA Entity + Lombok)
- \`backend/.../domain/service/\` — 비즈니스 로직 (@Service)
- \`backend/.../port/in/\` — 인바운드 포트 (유스케이스 인터페이스)
- \`backend/.../port/out/\` — 아웃바운드 포트 (리포지토리 인터페이스)
- \`backend/.../adapter/in/web/\` — REST 컨트롤러 (@RestController)
- \`backend/.../adapter/out/persistence/\` — JPA 리포지토리 구현체

### 규칙
1. domain은 Spring, JPA 외 외부 라이브러리에 직접 의존하지 않는다
2. Lombok(@Getter, @Builder, @RequiredArgsConstructor)을 적극 활용한다
3. DTO는 adapter 레이어에, Entity는 domain 레이어에 위치한다
4. application.yml로 설정을 관리한다`;

const CLAUDE_MD_FLUTTER = `# 프로젝트 아키텍처 규칙

## 헥사고날 아키텍처

이 프로젝트는 헥사고날(포트 & 어댑터) 아키텍처를 따릅니다.

### 폴더 구조
- \`lib/domain/models/\` — 핵심 데이터 모델 (순수 Dart 클래스)
- \`lib/domain/services/\` — 비즈니스 로직 (외부 의존성 없음)
- \`lib/ports/\` — 인터페이스 정의 (abstract class)
- \`lib/adapters/api/\` — HTTP API 호출 구현
- \`lib/adapters/ui/screens/\` — 화면 단위 위젯
- \`lib/adapters/ui/widgets/\` — 재사용 가능한 위젯 컴포넌트
- \`lib/main.dart\` — 앱 진입점

### 규칙
1. domain 폴더의 코드는 Flutter/외부 패키지에 의존하지 않는다
2. ports에 abstract class를 먼저 정의하고, adapters에서 구현한다
3. 화면(Screen)은 얇게 유지하고, 로직은 domain/services에 작성한다
4. 파일명은 snake_case, 클래스는 PascalCase
5. StatelessWidget을 기본으로 사용하고, 상태가 필요할 때만 StatefulWidget 사용`;

const CLAUDE_MD_DATA_AI = `# 프로젝트 구조 규칙

### 폴더 구조
- \`data/\` — 원본 데이터 파일 (CSV, JSON 등)
- \`notebooks/\` — Jupyter Notebook 파일
- \`src/loaders/\` — 데이터 로딩 및 전처리
- \`src/analyzers/\` — 분석 로직
- \`src/visualizers/\` — 시각화 함수

### 규칙
1. 데이터 로딩과 분석 로직을 분리한다
2. 노트북은 실험/시각화용, 재사용 로직은 src/에 함수로 추출한다
3. 타입 힌트를 모든 함수에 사용한다
4. 파일명은 snake_case`;

function architectureStep(goal: Goal, projectName: string, env: SetupStep["environment"]): SetupStep {
  const home = `~/${projectName}`;

  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      return {
        id: "architecture",
        title: "프로젝트 구조 설정",
        description: "AI 도구가 따를 아키텍처 규칙을 세팅해요",
        group: "프로젝트 생성",
        environment: env,
        detailedGuide: "아래 명령어로 폴더 구조를 생성한 뒤, CLAUDE.md 내용을 프로젝트 루트에 저장해주세요.",
        script: `cd ${home} && mkdir -p src/domain/models src/domain/services src/ports src/adapters/api src/adapters/ui`,
        claudeMdContent: CLAUDE_MD_NEXTJS,
      };
    case "web-python":
      return {
        id: "architecture",
        title: "프로젝트 구조 설정",
        description: "AI 도구가 따를 아키텍처 규칙을 세팅해요",
        group: "프로젝트 생성",
        environment: env,
        detailedGuide: "아래 명령어로 폴더 구조를 생성한 뒤, CLAUDE.md 내용을 프로젝트 루트에 저장해주세요.",
        script: `cd ${home}/frontend && mkdir -p src/domain/models src/domain/services src/ports src/adapters/api src/adapters/ui && cd ${home}/backend && mkdir -p domain/models domain/services ports/inbound ports/outbound adapters/inbound/api adapters/outbound/persistence`,
        claudeMdContent: CLAUDE_MD_WEB_PYTHON,
      };
    case "web-java":
      return {
        id: "architecture",
        title: "프로젝트 구조 설정",
        description: "AI 도구가 따를 아키텍처 규칙을 세팅해요",
        group: "프로젝트 생성",
        environment: env,
        detailedGuide: "아래 명령어로 폴더 구조를 생성한 뒤, CLAUDE.md 내용을 프로젝트 루트에 저장해주세요.",
        script: `cd ${home}/frontend && mkdir -p src/domain/models src/domain/services src/ports src/adapters/api src/adapters/ui && cd ${home}/backend && mkdir -p src/main/java/com/example/app/domain/model src/main/java/com/example/app/domain/service src/main/java/com/example/app/port/in src/main/java/com/example/app/port/out src/main/java/com/example/app/adapter/in/web src/main/java/com/example/app/adapter/out/persistence`,
        claudeMdContent: CLAUDE_MD_WEB_JAVA,
      };
    case "mobile":
      return {
        id: "architecture",
        title: "프로젝트 구조 설정",
        description: "AI 도구가 따를 아키텍처 규칙을 세팅해요",
        group: "프로젝트 생성",
        environment: env,
        detailedGuide: "아래 명령어로 폴더 구조를 생성한 뒤, CLAUDE.md 내용을 프로젝트 루트에 저장해주세요.",
        script: `cd ${home} && mkdir -p lib/domain/models lib/domain/services lib/ports lib/adapters/api lib/adapters/ui/screens lib/adapters/ui/widgets`,
        claudeMdContent: CLAUDE_MD_FLUTTER,
      };
    case "data-ai":
      return {
        id: "architecture",
        title: "프로젝트 구조 설정",
        description: "AI 도구가 따를 분석 프로젝트 규칙을 세팅해요",
        group: "프로젝트 생성",
        environment: env,
        detailedGuide: "아래 명령어로 폴더 구조를 생성한 뒤, CLAUDE.md 내용을 프로젝트 루트에 저장해주세요.",
        script: `cd ${home} && mkdir -p data notebooks src/loaders src/analyzers src/visualizers`,
        claudeMdContent: CLAUDE_MD_DATA_AI,
      };
  }
}

// ─── 프로젝트 + 첫 실행 단계 (Goal별) ───

function nextjsProjectStep(projectName: string, variant: "wsl" | "mac", isFrontendOnly: boolean): SetupStep {
  const label = isFrontendOnly ? "프론트엔드 프로젝트 생성 (Next.js)" : "프로젝트 생성";
  const desc = isFrontendOnly ? "화면을 담당하는 Next.js 프로젝트를 만들어요" : "나만의 웹사이트 프로젝트를 만들어요";
  const path = isFrontendOnly ? `${projectName}/frontend` : projectName;
  const env: SetupStep["environment"] = variant === "wsl" ? "리눅스 명령창" : "Mac 터미널";

  return {
    id: "project-frontend",
    title: label,
    description: desc,
    group: "프로젝트 생성",
    environment: env,
    detailedGuide: `~/${path} 폴더에 프로젝트를 만듭니다.`,
    script: `npx create-next-app@latest ~/${path} --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm`,
    resultPreview: `✔ Would you like to use TypeScript? … Yes
✔ Would you like to use ESLint? … Yes
✔ Would you like to use Tailwind CSS? … Yes
...
Success! Created ${path}
  npm run dev    (개발 서버 시작)
  npm run build  (배포용 빌드)`,
    troubleshooting: [
      { symptom: "The application path is not writable 에러", solution: "다시 한번 시도해주세요. 처음 실행 시 다운로드 과정에서 일시적으로 실패할 수 있어요." },
      { symptom: "npx: command not found", solution: "Node.js가 설치되지 않았어요. '개발 도구 설치' 단계를 다시 확인해주세요." },
      { symptom: "directory already exists 에러", solution: "이전 시도 흔적이 남아있어요. rm -rf ~/${path} 를 실행해서 삭제한 후 다시 시도해주세요." },
    ],
  };
}

function firstRunStep(projectName: string, goal: Goal, env: SetupStep["environment"]): SetupStep {
  const hasFeBe = goal === "web-python" || goal === "web-java";

  return {
    id: "first-run",
    title: "첫 실행!",
    description: "VS Code에서 프로젝트를 열고 AI 코딩을 시작해요",
    group: "프로젝트 생성",
    environment: env,
    detailedGuide: hasFeBe
      ? "아래 명령어로 VS Code가 열립니다. VS Code 안에서 터미널(Ctrl+` 또는 Cmd+`)을 열고 claude를 입력하면 AI 코딩이 시작됩니다. frontend/와 backend/ 폴더가 함께 보여요."
      : "아래 명령어로 VS Code가 열립니다. VS Code 안에서 터미널(Ctrl+` 또는 Cmd+`)을 열고 claude를 입력하면 AI 코딩이 시작됩니다.",
    script: `code ~/${projectName}`,
  };
}

function appendProjectSteps(
  steps: SetupStep[],
  goal: Goal,
  projectName: string,
  variant: "wsl" | "mac",
): void {
  const env: SetupStep["environment"] = variant === "wsl" ? "리눅스 명령창" : "Mac 터미널";

  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      steps.push(nextjsProjectStep(projectName, variant, false));
      break;
    case "web-python":
      steps.push(nextjsProjectStep(projectName, variant, true));
      steps.push(pythonBackendProjectStep(projectName, env));
      break;
    case "web-java":
      steps.push(nextjsProjectStep(projectName, variant, true));
      steps.push(javaBackendProjectStep(projectName, env));
      break;
    case "mobile":
      steps.push(flutterProjectStep(projectName, env));
      break;
    case "data-ai":
      steps.push(dataAiProjectStep(projectName, env));
      break;
  }

  // 아키텍처 스캐폴딩 (CLAUDE.md는 프로젝트 루트에 1개)
  steps.push(architectureStep(goal, projectName, env));

  // 첫 실행
  steps.push(firstRunStep(projectName, goal, env));
}

// ─── 메인 ───

export function getSetupSteps(
  os: OS,
  goal: Goal,
  projectName: string,
): SetupStep[] {
  const steps: SetupStep[] = [];

  steps.push(terminalGuide(os));

  if (os === "windows") {
    // 환경 준비
    steps.push(wslInstallStep());
    steps.push(wslOpenStep());

    // 도구 설치
    steps.push(wslDevToolsStep(goal));
    steps.push(wslVscodeStep());

    // AI 설정
    steps.push(wslClaudeStep());

    // 프로젝트 생성
    appendProjectSteps(steps, goal, projectName, "wsl");
  } else {
    // 환경 준비
    steps.push(brewStep());

    // 도구 설치
    steps.push(macDevToolsStep(goal));
    steps.push(macVscodeStep());

    // AI 설정
    steps.push(macClaudeStep());

    // 프로젝트 생성
    appendProjectSteps(steps, goal, projectName, "mac");
  }

  return steps;
}
