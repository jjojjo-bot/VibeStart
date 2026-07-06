import { hardenScript, type HardenShell } from "@vibestart/script-generator";
import type { DiagnosisStep, ScanResult } from "@vibestart/shared-types";
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
  /** detailedGuide 아래에 함께 보여줄 참고 이미지 (스크린샷/다이어그램) */
  guideImage?: { src: string; alt: string };
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
  /** 진단 단계 — 그룹 기본값과 다를 때만 지정(예: mac brew는 envPrep지만 tools-install). */
  diagnosisStep?: DiagnosisStep;
  /** 재시작 체크포인트 — 켜면 /setup이 "진행상황 저장됨" 안심 배너를 강조 렌더. */
  requiresReboot?: boolean;
}

/** 셋업 그룹 → 진단 단계 기본 매핑. per-step diagnosisStep으로 덮어쓸 수 있다. */
export const GROUP_TO_DIAGNOSIS_STEP: Record<SetupGroup, DiagnosisStep> = {
  envPrep: "wsl-install",
  toolInstall: "tools-install",
  aiSetup: "claude-install",
  projectCreate: "clone-project",
};

/** 한 단계의 진단 단계(마커 step·StuckHelper 둘 다 이걸 단일 출처로 쓴다). */
export function diagnosisStepFor(step: SetupStep): DiagnosisStep {
  return step.diagnosisStep ?? GROUP_TO_DIAGNOSIS_STEP[step.group];
}

// ─── 환경 스캔 ("내 컴퓨터 확인하기") ───
//
// 설치 경험자(exp=prior|unsure)용 사전 스캔. 검사 항목당 마커 1개를 내서
// 기존 parseMarkers(step/result만 파싱)를 무변경 재사용한다.
//
// WSL 판정 주의점:
//   - `wsl -l -q`는 Docker Desktop 배포판(docker-desktop 등)도 나열하므로
//     "목록 비어있지 않음"이 아니라 Ubuntu 매칭으로 판정 (오탐 방지)
//   - 출력이 UTF-16이라 null 문자(`0)를 제거한 뒤 매칭
//   - WSL 내부 명령(wsl -e 등)은 절대 실행하지 않음 — 미초기화 배포판이면
//     계정 생성 화면이 떠버린다
//   - 관리자 권한 불필요 (preflight와 다름 — 일반 PowerShell에서 동작)
export const WINDOWS_SCAN_SCRIPT = [
  "$w='fail'",
  "if (Get-Command wsl.exe -ErrorAction SilentlyContinue) { try { $d=(wsl.exe -l -q 2>$null) -replace \"`0\",''; if ($LASTEXITCODE -eq 0 -and ($d | Where-Object { $_ -match 'Ubuntu' })) { $w='ok' } } catch {} }",
  "$v='fail'",
  "if (Get-Command code -ErrorAction SilentlyContinue) { $v='ok' }",
  "Write-Output \"VIBESTART::step=scan-wsl::result=$w\"",
  "Write-Output \"VIBESTART::step=scan-vscode::result=$v\"",
].join("; ");

/** 스캔 결과로 사전 완료 처리할 단계 id. wsl-open은 제외 — WSL이 있어도 창은 열어야 한다. */
export function scanPrecompletedStepIds(result: ScanResult): string[] {
  const ids: string[] = [];
  if (result.wsl) ids.push("preflight", "wsl", "reboot");
  if (result.vscode) ids.push("editor");
  return ids;
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

/**
 * pre-flight — wsl --install 전에 막힐 요인을 먼저 잡는다(관리자 권한·Windows 버전).
 * 스스로 preflight 마커를 방출하므로 하드닝 대상이 아니다(hardenShellFor에서 제외).
 * 관리자 실패는 code=needs-admin → 진단의 needs-admin 규칙(run-as-admin 가이드)으로 연결.
 */
function windowsPreflightStep(t: T): SetupStep {
  const script = [
    "$ok = $true; $code = ''",
    'if (([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { Write-Host "[OK] Administrator" } else { Write-Host "[X] Not Administrator - reopen PowerShell as Administrator"; $ok = $false; $code = "needs-admin" }',
    "$build = [int][Environment]::OSVersion.Version.Build",
    'if ($build -ge 19041) { Write-Host "[OK] Windows build $build" } else { Write-Host "[X] Windows build $build - need 19041+, run Windows Update"; $ok = $false; if (-not $code) { $code = "winver" } }',
    'if ($ok) { Write-Output "VIBESTART::step=preflight::result=ok" } else { Write-Output "VIBESTART::step=preflight::result=fail::code=$code" }',
  ].join("\n");

  return {
    id: "preflight",
    title: t("preflight.title"),
    description: t("preflight.description"),
    whyNeeded: t("preflight.whyNeeded"),
    group: "envPrep",
    diagnosisStep: "preflight",
    environment: t("environments.windowsCmd"),
    detailedGuide: t("preflight.detailedGuide"),
    script,
    resultPreview: `[OK] Administrator
[OK] Windows build 22631
VIBESTART::step=preflight::result=ok`,
  };
}

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

/**
 * 재시작 체크포인트 — wsl --install 직후. 비전공자 이탈 1순위 지점이라
 * 명령 없이 "재시작 + 진행상황 저장됨" 안심 메시지를 전담하는 단계로 분리한다.
 */
function windowsRebootStep(t: T): SetupStep {
  return {
    id: "reboot",
    title: t("reboot.title"),
    description: t("reboot.description"),
    whyNeeded: t("reboot.whyNeeded"),
    group: "envPrep",
    requiresReboot: true,
    detailedGuide: t("reboot.detailedGuide"),
    script: "",
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

  // curl: 신선한 WSL Ubuntu는 curl 기본 미포함. 뒤 단계인 nodejs(NodeSource 스크립트 다운로드)와
  // java 백엔드(start.spring.io 다운로드)의 첫 명령이 curl이라, 없으면 command not found로 즉사한다.
  // basic-tools는 모든 WSL 흐름에서 그 단계들보다 먼저 실행되므로 여기서 미리 깐다(ca-certificates는
  // curl의 Recommends로 함께 설치). 버전 확인 대상은 아니라 names/versionChecks엔 넣지 않는다.
  const pkgs: string[] = ["git", "curl"];
  const names: string[] = ["Git"];
  const versionChecks: string[] = ["git --version"];
  const resultLines: string[] = ["git version 2.x.x"];

  if (extra === "python") {
    pkgs.push("python3", "python3-pip", "python3-venv");
    names.push("Python");
    versionChecks.push("python3 --version");
    resultLines.push("Python 3.x.x");
  } else if (extra === "java") {
    // unzip: WSL Ubuntu는 --no-install-recommends라 기본 미설치. javaBackendProjectStep의
    // `unzip backend.zip`(Spring starter 압축 해제)이 command not found로 죽는 걸 막는다.
    pkgs.push("openjdk-21-jdk", "unzip");
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

// VS Code는 System 인스톨러를 직접 받아 무음 설치한다. 이 단계는 preflight(관리자 강제)
// 직후 같은 관리자 PowerShell에서 도는데, winget의 Microsoft.VisualStudioCode는 *User*
// 인스톨러라 관리자 컨텍스트에서 "not meant to be run as an Administrator"로 거부당해
// 자주 실패했다(winget으론 VS Code System 설치가 불가해 우회도 안 됨). System 인스톨러는
// 관리자용이라 이 컨텍스트에서 정상 동작하고, winget 의존성·창을 닫던 exit 1도 사라진다.
//   1) `code`가 PATH에 있으면 이미 설치됨 → 건너뜀
//   2) 아니면 update.code.visualstudio.com에서 System x64 안정판을 받아 /SILENT 설치
//      (/MERGETASKS=!runcode,addtopath: 자동실행 끄고 code를 PATH에 등록 → 뒤 단계 유지)
// 단일 라인 세미콜론 체인 — 복붙 시 PowerShell이 `>>` 프롬프트로 멈추는 걸 피한다.
function wslVscodeStep(t: T): SetupStep {
  const script = [
    "if (Get-Command code -ErrorAction SilentlyContinue) { Write-Host 'VS Code already installed - skipping.' }",
    "else { $ProgressPreference='SilentlyContinue'; $f=\"$env:TEMP\\VSCodeSetup.exe\"; Invoke-WebRequest -UseBasicParsing -Uri 'https://update.code.visualstudio.com/latest/win32-x64/stable' -OutFile $f; Start-Process -Wait -FilePath $f -ArgumentList '/SILENT','/NORESTART','/MERGETASKS=!runcode,addtopath'; Remove-Item $f -ErrorAction SilentlyContinue; Write-Host 'VS Code installed.' }",
  ].join(" ");

  return {
    id: "editor",
    title: t("editor.title"),
    description: t("editor.description"),
    whyNeeded: t("editor.whyNeeded"),
    group: "envPrep",
    // group을 envPrep로 옮겼지만 진단 규칙은 도구 설치 계열이 맞다.
    // 그룹 기본 매핑(envPrep→wsl-install)을 그대로 두면 StuckHelper가
    // WSL 설치 규칙으로 진단하는 회귀가 생긴다.
    diagnosisStep: "tools-install",
    environment: t("environments.windowsCmd"),
    detailedGuide: t("editor.detailedGuide.windows"),
    script,
    resultPreview: `VS Code installed.`,
    troubleshooting: [
      { symptom: t("editor.troubleshooting.windows.0.symptom"), solution: t("editor.troubleshooting.windows.0.solution") },
      { symptom: t("editor.troubleshooting.windows.1.symptom"), solution: t("editor.troubleshooting.windows.1.solution") },
    ],
  };
}

// ─── Claude Code 통합 (WSL) ───
//
// ⚠️ WSL + NodeSource Node에서는 기본 `npm install -g`가 EACCES로 즉시 실패한다.
// NodeSource는 node/npm을 /usr/bin에 설치하고 npm prefix가 /usr이라 글로벌 모듈이
// /usr/lib/node_modules(root-owned)에 들어가기 때문. 해결: user prefix($HOME/.npm-global)
// 전환 → sudo 없이 글로벌 설치 + PATH 추가로 `claude` 접근. (grep||echo로 .bashrc 멱등 추가)
//
// ⚠️ 이 단계는 맨 `wsl` 터미널(VS Code 통합 터미널 아님)에서 돈다. 그래서 `code`는 VS Code
// Server의 remote-cli가 아니라 Windows VS Code bin(System: "/mnt/c/Program Files/…",
// User: /mnt/c/Users/*/…)이 WSL interop PATH에 실려야만 잡힌다. WSL은 Windows PATH를
// 인스턴스 부팅 때 한 번만 읽으므로 창을 닫았다 여는 걸로는 갱신 안 되고 `wsl --shutdown`/
// 재부팅이라야 갱신된다 → 이 PATH 스테일이 이 단계 최대 실패 원인이었다.
//
// 그래서 (C): (1) `code`를 PATH→System→User 경로 순으로 견고 해석해 스테일해도 설치되게,
// (2) 그래도 못 찾으면 창 닫기 대신 `wsl --shutdown` 안내 후 실패, (3) `claude auth login`을
// 확장 설치보다 앞에 둬서 확장/코드 문제로 로그인이 막히지 않게 한다.

function wslClaudeStep(t: T): SetupStep {
  // `(grep ... || echo ...)`는 괄호 서브셸로 묶는다 — 안 그러면 `&& A || B && C`의
  // 좌결합 우선순위로 체인이 깨진다.
  //
  // `code` 견고 해석 블록: `{ …; }` 그룹의 종료코드가 이 단계의 성공/실패다. not-found
  // 분기는 exit 대신 `false`로 체인을 멈춰(대화형 창 보존) 하드닝 마커가 fail을 낸다.
  const script = joinChain([
    "set -o pipefail",
    'echo "▶ (1/4) Configuring npm user prefix..."',
    'mkdir -p "$HOME/.npm-global"',
    'npm config set prefix "$HOME/.npm-global"',
    "(grep -q 'npm-global/bin' \"$HOME/.bashrc\" || echo 'export PATH=\"$HOME/.npm-global/bin:$PATH\"' >> \"$HOME/.bashrc\")",
    'export PATH="$HOME/.npm-global/bin:$PATH"',
    'echo "▶ (2/4) Installing Claude Code CLI..."',
    "npm install -g @anthropic-ai/claude-code",
    // 로그인을 확장 설치 앞으로 — 확장(코드 CLI 의존)이 실패해도 인증은 끝나 있게 한다.
    'echo "▶ (3/4) Logging in..."',
    "claude auth login",
    // WSL 확장(ms-vscode-remote.remote-wsl)은 필수 — 없으면 `code ~/proj`가 WSL Remote로
    // 안 열리고 UNC 경로 로드로 떨어져 통합 터미널이 Windows PowerShell이 된다.
    'echo "▶ (4/4) Installing VS Code extensions..."',
    "{ CODE=\"$(command -v code 2>/dev/null)\"; if [ -z \"$CODE\" ]; then for p in \"/mnt/c/Program Files/Microsoft VS Code/bin/code\" /mnt/c/Users/*/AppData/Local/Programs/\"Microsoft VS Code\"/bin/code; do [ -x \"$p\" ] && CODE=\"$p\" && break; done; fi; if [ -z \"$CODE\" ]; then echo \"⚠️ VS Code(code)를 찾지 못했어요. 'VS Code 설치' 단계를 마쳤는지 확인하고, 그래도 안 되면 PowerShell에서 wsl --shutdown 실행 후 Ubuntu를 다시 열어 이 단계만 다시 실행하세요.\"; false; else \"$CODE\" --install-extension ms-vscode-remote.remote-wsl && \"$CODE\" --install-extension anthropic.claude-code; fi; }",
    'echo "✅ Claude Code setup complete"',
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
▶ (3/4) Logging in...
Opening browser for authentication...
✓ Logged in as yourname@email.com
▶ (4/4) Installing VS Code extensions...
Extension 'ms-vscode-remote.remote-wsl' was successfully installed.
Extension 'anthropic.claude-code' was successfully installed.
✅ Claude Code setup complete`,
    troubleshooting: [
      { symptom: t("aiSetup.troubleshooting.0.symptom"), solution: t("aiSetup.troubleshooting.0.solution") },
      { symptom: t("aiSetup.troubleshooting.1.symptom"), solution: t("aiSetup.troubleshooting.1.solution") },
      { symptom: t("aiSetup.troubleshooting.2.symptom"), solution: t("aiSetup.troubleshooting.2.solution") },
      { symptom: t("aiSetup.troubleshooting.3.symptom"), solution: t("aiSetup.troubleshooting.3.solution") },
      { symptom: t("aiSetup.troubleshooting.4.symptom"), solution: t("aiSetup.troubleshooting.4.solution") },
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
    // main.py는 heredoc으로 쓴다. bash `echo '...\n...'`는 \n을 문자 그대로 출력해
    // (xpg_echo off) 한 줄짜리 깨진 파이썬 파일이 만들어진다. single-quote 구분자로
    // 감싸 $·백틱 전개 없이 리터럴로 기록한다(withClaudeMd와 동일 패턴).
    script: `mkdir -p ~/${projectName}/backend && cd ~/${projectName}/backend && python3 -m venv venv && . venv/bin/activate && pip install fastapi uvicorn && cat > main.py << 'VIBESTART_MAIN_PY_EOF'
from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, World!"}
VIBESTART_MAIN_PY_EOF`,
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
    // bootVersion을 pin하지 않아 start.spring.io의 현재 기본값(지원되는 최신 Spring Boot)을
    // 항상 받는다 — 특정 패치를 박아두면 EOL·미지원으로 stale해진다. javaVersion=21은
    // 설치되는 JDK 21과 맞춰 Gradle 툴체인이 다른 JDK를 따로 받으려는 마찰을 없앤다.
    script: `mkdir -p ~/${projectName} && cd ~/${projectName} && curl -fsSL "https://start.spring.io/starter.zip?type=gradle-project&language=java&javaVersion=21&packaging=jar&baseDir=backend&groupId=com.example&artifactId=backend&name=backend&packageName=com.example.app&dependencies=web,lombok,devtools,validation,data-jpa,sqlserver" -o backend.zip && unzip backend.zip && rm backend.zip && mv backend/src/main/resources/application.properties backend/src/main/resources/application.yml`,
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
  // brew 설치 후 PATH 배선 — Apple Silicon은 /opt/homebrew/bin이 로그인 PATH에
  // 자동 등록되지 않아, 직후 macDevToolsStep의 `brew install`이 command not found로
  // 실패한다. shellenv를 현재 세션(eval)과 ~/.zprofile(다음 세션) 양쪽에 반영한다.
  // Intel은 /usr/local/bin. printf로 .zprofile 라인을 쓰되 $(...)는 리터럴로 남겨
  // 매 셸 시작 시 평가되게 한다(grep 가드로 idempotent).
  const script = [
    '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
    "if [ -x /opt/homebrew/bin/brew ]; then BREW=/opt/homebrew/bin/brew; else BREW=/usr/local/bin/brew; fi",
    "( grep -q 'brew shellenv' ~/.zprofile 2>/dev/null || printf 'eval \"$(%s shellenv)\"\\n' \"$BREW\" >> ~/.zprofile )",
    'eval "$($BREW shellenv)"',
  ].join(" && ");

  return {
    id: "brew",
    title: t("brew.title"),
    description: t("brew.description"),
    whyNeeded: t("brew.whyNeeded"),
    group: "envPrep",
    // brew 실패(네트워크·권한 등)는 도구설치 진단 규칙에 해당 → 그룹 기본값을 덮어쓴다.
    diagnosisStep: "tools-install",
    environment: t("environments.macTerminal"),
    detailedGuide: t("brew.detailedGuide"),
    script,
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
    // cask의 binary 스탠자가 `code`를 $(brew --prefix)/bin(Apple Silicon: /opt/homebrew/bin,
    // on PATH)에 자동 심링크한다. 수동 `sudo ln … /usr/local/bin/code`는 불필요할 뿐 아니라,
    // Apple Silicon은 /usr/local/bin이 없을 수 있어(Homebrew가 /opt/homebrew 사용) ln이 "No such
    // file or directory"로 실패 → VS Code는 멀쩡히 깔렸는데 마커가 fail이 되던 버그였다. 제거.
    script: `brew install --cask visual-studio-code`,
    resultPreview: `==> Installing Cask visual-studio-code
==> Moving App 'Visual Studio Code.app' to '/Applications/Visual Studio Code.app'
==> Linking Binary 'code' to '/opt/homebrew/bin/code'
🍺  visual-studio-code was successfully installed!`,
    troubleshooting: [
      { symptom: t("editor.troubleshooting.macos.0.symptom"), solution: t("editor.troubleshooting.macos.0.solution") },
      { symptom: t("editor.troubleshooting.macos.1.symptom"), solution: t("editor.troubleshooting.macos.1.solution") },
    ],
  };
}

// ─── Claude Code 통합 (macOS) ───
//
// brew로 설치된 node는 /opt/homebrew/lib/node_modules(user-owned)에 글로벌 모듈이
// 들어가므로 EACCES 이슈가 없다 — WSL처럼 npm prefix를 만질 필요 없음.
// `code`는 VS Code cask의 binary 스탠자가 $(brew --prefix)/bin(/opt/homebrew/bin, brew
// shellenv로 이미 PATH에 있음)에 자동 심링크하므로, WSL 같은 interop PATH 취약성이
// 없다(셸 재시작·Command Palette 불필요). login은 확장 설치 앞에 둬서 확장 문제로
// 인증이 막히지 않게 한다(WSL ai-setup과 일관).

function macClaudeStep(t: T): SetupStep {
  const script = joinChain([
    "set -o pipefail",
    'echo "▶ (1/3) Installing Claude Code CLI..."',
    "npm install -g @anthropic-ai/claude-code",
    // 로그인을 확장 설치 앞으로 — 확장 문제로 인증까지 막히지 않게 한다.
    'echo "▶ (2/3) Logging in..."',
    "claude auth login",
    'echo "▶ (3/3) Installing VS Code extension..."',
    "code --install-extension anthropic.claude-code",
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
▶ (2/3) Logging in...
Opening browser for authentication...
✓ Logged in as yourname@email.com
▶ (3/3) Installing VS Code extension...
Extension 'anthropic.claude-code' was successfully installed.`,
    troubleshooting: [
      { symptom: t("aiSetup.troubleshooting.0.symptom"), solution: t("aiSetup.troubleshooting.0.solution") },
      { symptom: t("aiSetup.troubleshooting.1.symptom"), solution: t("aiSetup.troubleshooting.1.solution") },
      { symptom: t("aiSetup.troubleshooting.2.symptom"), solution: t("aiSetup.troubleshooting.2.solution") },
    ],
  };
}

// ─── 아키텍처 스캐폴딩 (Goal별 1개의 통합 단계) ───
// script = 폴더 구조 생성 + heredoc으로 CLAUDE.md 파일까지 자동 작성(withClaudeMd)
// claudeMdContent = 이 단계가 CLAUDE.md를 만든다는 게이트 플래그(원본 상수 보관).
//   UI는 내용을 다시 표시하지 않고 "자동 생성됨" 안내만 띄운다(명령어 heredoc과 중복 방지).

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

/**
 * 주어진 디렉토리 목록을 `mkdir -p` + 각 디렉토리에 `.gitkeep` 빈 파일 생성
 * 명령으로 변환한다.
 *
 * Git은 빈 디렉토리를 추적하지 않으므로 헥사고날 아키텍처 스캐폴딩(domain/
 * ports/adapters 하위 폴더)만 만들어 두면 git push 시 전부 사라진다.
 * 각 leaf 디렉토리에 `.gitkeep`을 넣어 Git이 추적하게 한다.
 */
function mkdirWithGitkeep(dirs: ReadonlyArray<string>): string {
  const mkdirs = `mkdir -p ${dirs.join(" ")}`;
  const touches = `touch ${dirs.map((d) => `${d}/.gitkeep`).join(" ")}`;
  return `${mkdirs} && ${touches}`;
}

/**
 * 주어진 폴더 생성 명령 뒤에 `cd <projectRoot> && cat > CLAUDE.md << 'EOF' ...`
 * heredoc을 붙여 폴더 스캐폴딩과 CLAUDE.md 자동 생성을 한 스크립트로 묶는다.
 *
 * heredoc 구분자는 single-quote(`'EOF'`)로 감싸 내부 `$`, 백틱, 변수 전개를
 * 모두 비활성화한다. CLAUDE_MD_* 상수 본문은 순수 마크다운이므로 안전하게
 * 리터럴로 기록된다. 구분자 이름은 본문과 충돌하지 않는 고유 값 사용.
 *
 * 비전공자는 파일을 "새로 만드는" 심리적 부담이 크기 때문에 미리 파일이
 * 존재하도록 만들어 두고, 필요하면 VS Code에서 열어 편집하게 유도한다.
 */
function withClaudeMd(mkdirChain: string, projectRoot: string, content: string): string {
  return `${mkdirChain} && cd ${projectRoot} && cat > CLAUDE.md << 'VIBESTART_CLAUDE_MD_EOF'
${content}
VIBESTART_CLAUDE_MD_EOF`;
}

function architectureStep(goal: Goal, projectName: string, env: string, t: T): SetupStep {
  const home = `~/${projectName}`;
  const descKey = goal === "data-ai" ? "architecture.description.dataAi" : "architecture.description.default";

  switch (goal) {
    case "web-nextjs":
    case "not-sure": {
      const feCmd = mkdirWithGitkeep([
        "src/domain/models",
        "src/domain/services",
        "src/ports",
        "src/adapters/api",
        "src/adapters/ui",
      ]);
      return {
        id: "architecture",
        title: t("architecture.title"),
        description: t(descKey),
        group: "projectCreate",
        environment: env,
        detailedGuide: t("architecture.detailedGuide"),
        script: withClaudeMd(
          `cd ${home} && ${feCmd}`,
          home,
          CLAUDE_MD_NEXTJS,
        ),
        claudeMdContent: CLAUDE_MD_NEXTJS,
      };
    }
    case "web-python": {
      const feCmd = mkdirWithGitkeep([
        "src/domain/models",
        "src/domain/services",
        "src/ports",
        "src/adapters/api",
        "src/adapters/ui",
      ]);
      const beCmd = mkdirWithGitkeep([
        "domain/models",
        "domain/services",
        "ports/inbound",
        "ports/outbound",
        "adapters/inbound/api",
        "adapters/outbound/persistence",
      ]);
      return {
        id: "architecture",
        title: t("architecture.title"),
        description: t(descKey),
        group: "projectCreate",
        environment: env,
        detailedGuide: t("architecture.detailedGuide"),
        script: withClaudeMd(
          `cd ${home}/frontend && ${feCmd} && cd ${home}/backend && ${beCmd}`,
          home,
          CLAUDE_MD_WEB_PYTHON,
        ),
        claudeMdContent: CLAUDE_MD_WEB_PYTHON,
      };
    }
    case "web-java": {
      const feCmd = mkdirWithGitkeep([
        "src/domain/models",
        "src/domain/services",
        "src/ports",
        "src/adapters/api",
        "src/adapters/ui",
      ]);
      const beCmd = mkdirWithGitkeep([
        "src/main/java/com/example/app/domain/model",
        "src/main/java/com/example/app/domain/service",
        "src/main/java/com/example/app/port/in",
        "src/main/java/com/example/app/port/out",
        "src/main/java/com/example/app/adapter/in/web",
        "src/main/java/com/example/app/adapter/out/persistence",
      ]);
      return {
        id: "architecture",
        title: t("architecture.title"),
        description: t(descKey),
        group: "projectCreate",
        environment: env,
        detailedGuide: t("architecture.detailedGuide"),
        script: withClaudeMd(
          `cd ${home}/frontend && ${feCmd} && cd ${home}/backend && ${beCmd}`,
          home,
          CLAUDE_MD_WEB_JAVA,
        ),
        claudeMdContent: CLAUDE_MD_WEB_JAVA,
      };
    }
    case "mobile": {
      const cmd = mkdirWithGitkeep([
        "src/domain/models",
        "src/domain/services",
        "src/ports",
        "src/adapters/api",
        "src/adapters/ui/screens",
        "src/adapters/ui/components",
      ]);
      return {
        id: "architecture",
        title: t("architecture.title"),
        description: t(descKey),
        group: "projectCreate",
        environment: env,
        detailedGuide: t("architecture.detailedGuide"),
        script: withClaudeMd(
          `cd ${home} && ${cmd}`,
          home,
          CLAUDE_MD_EXPO,
        ),
        claudeMdContent: CLAUDE_MD_EXPO,
      };
    }
    case "data-ai": {
      const cmd = mkdirWithGitkeep([
        "data",
        "notebooks",
        "src/loaders",
        "src/analyzers",
        "src/visualizers",
      ]);
      return {
        id: "architecture",
        title: t("architecture.title"),
        description: t(descKey),
        group: "projectCreate",
        environment: env,
        detailedGuide: t("architecture.detailedGuide"),
        script: withClaudeMd(
          `cd ${home} && ${cmd}`,
          home,
          CLAUDE_MD_DATA_AI,
        ),
        claudeMdContent: CLAUDE_MD_DATA_AI,
      };
    }
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
    // create-next-app@latest(Next.js 16+)는 --agents-md 기본값으로 AGENTS.md와 CLAUDE.md를
    // 함께 자동 생성한다. 그 안의 "This is NOT the Next.js you know" 문구가 Phase 1 테스트
    // 단계에서 Claude Code를 혼란스럽게 만든다(사용자는 평범한 랜딩 페이지만 원하는데 Claude가
    // docs부터 읽으러 감). 둘 다 비전공자 프로젝트엔 불필요하므로 스캐폴딩 직후 제거한다.
    // VibeStart용 CLAUDE.md는 architectureStep이 프로젝트 루트에 별도로 쓴다(frontendOnly면
    // frontend/에 생성된 CLAUDE.md는 루트 가이드와 어긋나므로 반드시 지운다).
    // --yes: 향후 create-next-app이 추가하는 프롬프트(react-compiler 등)에서 비전공자가 멈추지
    // 않도록 미지정 옵션을 전부 기본값으로 넘긴다(명시한 플래그가 우선).
    script: isFrontendOnly
      ? `mkdir -p ~/${projectName} && npx create-next-app@latest ~/${path} --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm --yes && rm -f ~/${path}/AGENTS.md ~/${path}/CLAUDE.md`
      : `npx create-next-app@latest ~/${path} --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm --yes && rm -f ~/${path}/AGENTS.md ~/${path}/CLAUDE.md`,
    resultPreview: `Creating a new Next.js app in ~/${path}.

Using npm.

Installing dependencies:
- react
- react-dom
- next

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

function firstRunStep(projectName: string, goal: Goal, variant: "wsl" | "mac", env: string, t: T): SetupStep {
  const hasFeBe = goal === "web-python" || goal === "web-java";
  const openCmd = variant === "mac"
    ? `open -a "Visual Studio Code" ~/${projectName}`
    : `code ~/${projectName}`;

  // WSL 변형에서는 비전공자에게 프로젝트 폴더가 Windows 어디에 있는지
  // (Linux 사이드바 → Ubuntu → home → 계정 → 프로젝트명) 안내하고,
  // 파일 탐색기 예시 이미지를 함께 보여준다.
  const guideKey = variant === "wsl"
    ? (hasFeBe ? "firstRun.detailedGuide.wsl.withBackend" : "firstRun.detailedGuide.wsl.simple")
    : (hasFeBe ? "firstRun.detailedGuide.withBackend" : "firstRun.detailedGuide.simple");

  return {
    id: "first-run",
    title: t("firstRun.title"),
    description: t("firstRun.description"),
    group: "projectCreate",
    environment: env,
    detailedGuide: t(guideKey, { projectName }),
    ...(variant === "wsl" && {
      guideImage: {
        src: "/setup/wsl-file-explorer.svg",
        alt: t("firstRun.detailedGuide.wsl.imageAlt"),
      },
    }),
    script: openCmd,
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
  steps.push(firstRunStep(projectName, goal, variant, env, t));
}

// ─── 메인 ───

/**
 * D′ 하드닝 셸 — 진단 규칙이 있는 단계에만 마커를 심는다(null = 하드닝 안 함).
 * Windows의 wsl/editor만 powershell, 나머지는 bash(WSL/mac). 진단 step은
 * diagnosisStepFor로 따로 구한다(마커 step·StuckHelper 단일 출처).
 */
function hardenShellFor(stepId: string, os: OS): HardenShell | null {
  switch (stepId) {
    case "wsl":
      return "powershell";
    case "editor":
      // Windows editor는 if/else 분기 + Start-Process(-Wait는 $LASTEXITCODE를 세팅하지 않음)라
      // trailing 마커의 $LASTEXITCODE가 설치 성공/실패를 신뢰성 있게 반영하지 못한다 → 하드닝
      // 제외. mac은 깔끔한 체인.
      return os === "windows" ? null : "bash";
    case "dev-tools-basic":
    case "dev-tools-nodejs":
    case "dev-tools":
    case "brew":
    case "ai-setup":
      return "bash";
    default:
      return null;
  }
}

export function getSetupSteps(
  os: OS,
  goal: Goal,
  projectName: string,
  t: T,
): SetupStep[] {
  const steps: SetupStep[] = [];

  steps.push(terminalGuide(os, t));

  if (os === "windows") {
    // 환경 준비 — VS Code를 재부팅 앞에 배치:
    //   1) PowerShell 구간(preflight~wsl)이 연속돼 창 왕복이 줄고
    //   2) Ubuntu 첫 실행 전에 VS Code가 깔려 새 셸 PATH에 code가 포함됨
    //      → ai-setup의 code --install-extension 실패 원인(PATH 스테일) 소멸
    //   3) 재부팅 전 쉬운 성공 1개를 적립해 이탈을 완충
    steps.push(windowsPreflightStep(t));
    steps.push(wslVscodeStep(t));
    steps.push(wslInstallStep(t));
    steps.push(windowsRebootStep(t));
    steps.push(wslOpenStep(t));

    // 도구 설치 — Basic(Git+Python/Java)과 Node.js를 분리 (실패 시 재시도 용이)
    steps.push(wslBasicToolsStep(goal, t));
    if (needsNode(goal)) {
      steps.push(wslNodejsStep(t));
    }

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

  // 진단 마커 하드닝 — 실패-진단 규칙이 있는 단계의 스크립트에만 적용.
  return steps.map((step) => {
    const shell = hardenShellFor(step.id, os);
    if (!shell || step.script.trim().length === 0) return step;
    return { ...step, script: hardenScript(step.script, { step: diagnosisStepFor(step), shell }) };
  });
}
