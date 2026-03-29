import type { OS, Goal } from "./onboarding";

export interface SetupStep {
  id: string;
  title: string;
  description: string;
  detailedGuide?: string;
  script: string;
  /** 실행 환경 표시 — 초보자가 어디서 실행해야 하는지 알 수 있도록 */
  environment?: "PowerShell" | "Ubuntu 터미널" | "Mac 터미널" | "VS Code 터미널" | "어디서든";
  /** CLAUDE.md 파일 내용 — 이 필드가 있으면 웹에서 내용을 보여주고 직접 저장하도록 안내 */
  claudeMdContent?: string;
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
    ? "Windows 검색창(돋보기 아이콘)에 'PowerShell'을 입력하고, 'Windows PowerShell'을 클릭해서 열어주세요. WSL 설치 후에는 'Ubuntu'를 검색해서 열면 됩니다."
    : "Spotlight(Cmd + Space)를 열고 '터미널'을 입력한 후 Enter를 눌러주세요.";

  return {
    id: "terminal",
    title: "터미널 열기",
    description: "명령어를 실행할 창을 열어주세요",
    detailedGuide: guide,
    script: "",
  };
}

// ─── Windows (WSL2) 플로우 ───

function wslInstallStep(): SetupStep {
  return {
    id: "wsl",
    title: "WSL2 설치",
    description: "Windows에서 Claude Code를 사용하려면 Linux 환경이 필요해요",
    environment: "PowerShell",
    detailedGuide:
      "설치 후 컴퓨터를 재시작해야 합니다. 재시작 후 Ubuntu 창이 자동으로 열리며 사용자 이름과 비밀번호를 설정하게 됩니다.",
    script: "wsl --install",
  };
}

function wslOpenStep(): SetupStep {
  return {
    id: "wsl-open",
    title: "Ubuntu 터미널 열기",
    description: "이제부터는 Ubuntu 터미널에서 진행해요",
    environment: "PowerShell",
    detailedGuide:
      "아래 명령어를 입력하면 Ubuntu 터미널로 전환됩니다. 프롬프트가 바뀌면 성공!",
    script: "wsl",
  };
}

function wslGitStep(): SetupStep {
  return {
    id: "git",
    title: "Git 설치",
    description: "코드를 관리하는 도구를 설치해요",
    environment: "Ubuntu 터미널",
    script: "sudo apt update && sudo apt install -y git && git --version",
  };
}

function wslNodeStep(): SetupStep {
  return {
    id: "node",
    title: "Node.js 설치",
    description: "자바스크립트를 실행할 수 있게 해주는 도구예요",
    environment: "Ubuntu 터미널",
    script: "curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt install -y nodejs && node --version",
  };
}

function wslVscodeStep(): SetupStep {
  return {
    id: "editor",
    title: "VS Code 설치",
    description: "코드를 편집하는 프로그램을 설치해요",
    environment: "PowerShell",
    detailedGuide:
      "VS Code는 Windows에 설치하지만, WSL과 자동으로 연결됩니다. 새 PowerShell 창을 열어서 실행해주세요.",
    script: "winget install --id Microsoft.VisualStudioCode --accept-source-agreements --accept-package-agreements",
  };
}

function wslClaudeCodeStep(): SetupStep {
  return {
    id: "ai-tool",
    title: "Claude Code 설치",
    description: "AI 코딩 도우미를 설치해요",
    environment: "Ubuntu 터미널",
    detailedGuide: "CLI와 VS Code 확장이 함께 설치됩니다.",
    script: "npm install -g @anthropic-ai/claude-code && code --install-extension anthropic.claude-code",
  };
}

function wslClaudeLoginStep(): SetupStep {
  return {
    id: "ai-login",
    title: "Claude Code 로그인",
    description: "Claude 계정에 로그인해요",
    environment: "Ubuntu 터미널",
    detailedGuide: "명령어를 실행하면 브라우저가 열립니다. Claude 계정으로 로그인하면 터미널에 자동으로 연결돼요. 계정이 없으면 무료로 가입할 수 있습니다.",
    script: "claude login",
  };
}

// ─── Python 단계 ───

function wslPythonStep(): SetupStep {
  return {
    id: "python",
    title: "Python 설치",
    description: "프로그래밍 언어 Python을 설치해요",
    environment: "Ubuntu 터미널",
    script: "sudo apt update && sudo apt install -y python3 python3-pip python3-venv && python3 --version",
  };
}

function macPythonStep(): SetupStep {
  return {
    id: "python",
    title: "Python 설치",
    description: "프로그래밍 언어 Python을 설치해요",
    environment: "Mac 터미널",
    script: "brew install python && python3 --version",
  };
}

function pythonBackendProjectStep(projectName: string, env: SetupStep["environment"]): SetupStep {
  return {
    id: "project-backend",
    title: "백엔드 프로젝트 생성 (Python)",
    description: "Python FastAPI 서버 프로젝트를 만들어요",
    environment: env,
    detailedGuide: `~/${projectName}/backend 폴더에 프로젝트를 만듭니다.`,
    script: `mkdir -p ~/${projectName}/backend && cd ~/${projectName}/backend && python3 -m venv venv && . venv/bin/activate && pip install fastapi uvicorn && echo 'from fastapi import FastAPI\\napp = FastAPI()\\n\\n@app.get("/")\\ndef read_root():\\n    return {"message": "Hello, World!"}' > main.py`,
  };
}

// ─── Java 단계 ───

function wslJavaStep(): SetupStep {
  return {
    id: "java",
    title: "Java (JDK) 설치",
    description: "프로그래밍 언어 Java를 설치해요",
    environment: "Ubuntu 터미널",
    script: "sudo apt update && sudo apt install -y openjdk-21-jdk && java --version",
  };
}

function macJavaStep(): SetupStep {
  return {
    id: "java",
    title: "Java (JDK) 설치",
    description: "프로그래밍 언어 Java를 설치해요",
    environment: "Mac 터미널",
    script: "brew install openjdk@21 && java --version",
  };
}

function javaBackendProjectStep(projectName: string, env: SetupStep["environment"]): SetupStep {
  return {
    id: "project-backend",
    title: "백엔드 프로젝트 생성 (Java)",
    description: "Java Spring Boot 서버 프로젝트를 다운로드해요",
    environment: env,
    detailedGuide: `~/${projectName}/backend 폴더에 프로젝트를 만듭니다. Spring Initializr에서 실무에 필요한 기본 라이브러리가 포함된 프로젝트를 자동으로 다운로드합니다.`,
    script: `mkdir -p ~/${projectName} && cd ~/${projectName} && curl -s "https://start.spring.io/starter.zip?type=gradle-project&language=java&bootVersion=3.4.4&javaVersion=17&packaging=jar&baseDir=backend&groupId=com.example&artifactId=backend&name=backend&packageName=com.example.app&dependencies=web,lombok,devtools,validation,data-jpa,sqlserver" -o backend.zip && unzip backend.zip && rm backend.zip && mv backend/src/main/resources/application.properties backend/src/main/resources/application.yml`,
  };
}

// ─── Flutter 단계 ───

function wslFlutterStep(): SetupStep {
  return {
    id: "flutter",
    title: "Flutter 설치",
    description: "안드로이드 + iOS 앱을 동시에 만들 수 있는 도구예요",
    environment: "Ubuntu 터미널",
    detailedGuide: "설치 후 터미널을 닫고 다시 열어주세요.",
    script: "sudo snap install flutter --classic && flutter --version",
  };
}

function macFlutterStep(): SetupStep {
  return {
    id: "flutter",
    title: "Flutter 설치",
    description: "안드로이드 + iOS 앱을 동시에 만들 수 있는 도구예요",
    environment: "Mac 터미널",
    script: "brew install --cask flutter && flutter --version",
  };
}

function flutterProjectStep(projectName: string, env: SetupStep["environment"]): SetupStep {
  return {
    id: "project",
    title: "Flutter 프로젝트 생성",
    description: "나만의 모바일 앱 프로젝트를 만들어요",
    environment: env,
    script: `flutter create ${projectName}`,
  };
}

function flutterFirstRunStep(projectName: string, env: SetupStep["environment"]): SetupStep {
  return {
    id: "first-run",
    title: "첫 실행!",
    description: "VS Code에서 프로젝트를 열고 AI 코딩을 시작해요",
    environment: env,
    detailedGuide: "아래 명령어로 VS Code가 열립니다. VS Code 안에서 터미널(Ctrl+` 또는 Cmd+`)을 열고 claude를 입력하면 AI 코딩이 시작됩니다.",
    script: `code ~/${projectName}`,
  };
}

// ─── 데이터 분석 단계 ───

function dataAiProjectStep(projectName: string, env: SetupStep["environment"]): SetupStep {
  return {
    id: "project",
    title: "데이터 분석 환경 설정",
    description: "Jupyter Notebook을 설치해요",
    environment: env,
    detailedGuide: `~/${projectName} 폴더에 가상환경을 만들고 데이터 분석 라이브러리를 설치합니다.`,
    script: `mkdir ~/${projectName} && cd ~/${projectName} && python3 -m venv venv && . venv/bin/activate && pip install jupyter numpy pandas matplotlib`,
  };
}

function dataAiFirstRunStep(projectName: string, env: SetupStep["environment"]): SetupStep {
  return {
    id: "first-run",
    title: "첫 실행!",
    description: "VS Code에서 프로젝트를 열고 AI 코딩을 시작해요",
    environment: env,
    detailedGuide: "아래 명령어로 VS Code가 열립니다. VS Code 안에서 터미널(Ctrl+` 또는 Cmd+`)을 열고 claude를 입력하면 AI 코딩이 시작됩니다.",
    script: `code ~/${projectName}`,
  };
}

// ─── macOS 플로우 ───

function brewStep(): SetupStep {
  return {
    id: "brew",
    title: "Homebrew 설치",
    description: "Mac에서 프로그램을 쉽게 설치할 수 있게 해주는 도구예요",
    environment: "Mac 터미널",
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
    environment: "Mac 터미널",
    script: "brew install git && git --version",
  };
}

function macNodeStep(): SetupStep {
  return {
    id: "node",
    title: "Node.js 설치",
    description: "자바스크립트를 실행할 수 있게 해주는 도구예요",
    environment: "Mac 터미널",
    script: "brew install node && node --version",
  };
}

function macVscodeStep(): SetupStep {
  return {
    id: "editor",
    title: "VS Code 설치",
    description: "코드를 편집하는 프로그램을 설치해요",
    environment: "Mac 터미널",
    script: "brew install --cask visual-studio-code",
  };
}

function macClaudeCodeStep(): SetupStep {
  return {
    id: "ai-tool",
    title: "Claude Code 설치",
    description: "AI 코딩 도우미를 설치해요",
    environment: "Mac 터미널",
    detailedGuide: "CLI와 VS Code 확장이 함께 설치됩니다.",
    script: "npm install -g @anthropic-ai/claude-code && code --install-extension anthropic.claude-code",
  };
}

function macClaudeLoginStep(): SetupStep {
  return {
    id: "ai-login",
    title: "Claude Code 로그인",
    description: "Claude 계정에 로그인해요",
    environment: "Mac 터미널",
    detailedGuide: "명령어를 실행하면 브라우저가 열립니다. Claude 계정으로 로그인하면 터미널에 자동으로 연결돼요. 계정이 없으면 무료로 가입할 수 있습니다.",
    script: "claude login",
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
  const env: SetupStep["environment"] = variant === "wsl" ? "Ubuntu 터미널" : "Mac 터미널";

  return { id: "project-frontend", title: label, description: desc, environment: env, detailedGuide: `~/${path} 폴더에 프로젝트를 만듭니다.`, script: `npx create-next-app@latest ~/${path} --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm` };
}

function firstRunStep(projectName: string, goal: Goal, env: SetupStep["environment"]): SetupStep {
  const hasFeBe = goal === "web-python" || goal === "web-java";

  return {
    id: "first-run",
    title: "첫 실행!",
    description: "VS Code에서 프로젝트를 열고 AI 코딩을 시작해요",
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
  const env: SetupStep["environment"] = variant === "wsl" ? "Ubuntu 터미널" : "Mac 터미널";

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
  switch (goal) {
    case "mobile":
      steps.push(flutterFirstRunStep(projectName, env));
      break;
    case "data-ai":
      steps.push(dataAiFirstRunStep(projectName, env));
      break;
    default:
      steps.push(firstRunStep(projectName, goal, env));
      break;
  }
}

// ─── 메인 ───

export function getSetupSteps(
  os: OS,
  goal: Goal,
  projectName: string,
): SetupStep[] {
  const steps: SetupStep[] = [];
  const extra = extraRuntimeFor(goal);
  const nodeRequired = needsNode(goal);

  steps.push(terminalGuide(os));

  if (os === "windows") {
    // Windows는 항상 WSL2 플로우 (Claude Code 필수)
    steps.push(wslInstallStep());
    steps.push(wslOpenStep());
    steps.push(wslGitStep());

    if (nodeRequired) steps.push(wslNodeStep());
    if (extra === "python") steps.push(wslPythonStep());
    else if (extra === "java") steps.push(wslJavaStep());
    else if (extra === "flutter") steps.push(wslFlutterStep());

    steps.push(wslVscodeStep());
    steps.push(wslClaudeCodeStep());
    steps.push(wslClaudeLoginStep());

    appendProjectSteps(steps, goal, projectName, "wsl");
  } else {
    // macOS
    steps.push(brewStep());
    steps.push(macGitStep());

    if (nodeRequired) steps.push(macNodeStep());
    if (extra === "python") steps.push(macPythonStep());
    else if (extra === "java") steps.push(macJavaStep());
    else if (extra === "flutter") steps.push(macFlutterStep());

    steps.push(macVscodeStep());
    steps.push(macClaudeCodeStep());
    steps.push(macClaudeLoginStep());

    appendProjectSteps(steps, goal, projectName, "mac");
  }

  return steps;
}
