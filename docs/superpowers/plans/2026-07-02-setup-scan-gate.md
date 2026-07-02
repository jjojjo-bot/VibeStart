# 설치 경험 분기 + 환경 스캔 게이트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Windows 온보딩에 "설치 경험" 질문을 추가하고, 경험자에겐 환경 스캔(Ubuntu·VS Code 설치 여부)으로 설치 단계를 사전 완료 처리하며, VS Code 단계를 재부팅 앞으로 재배치한다.

**Architecture:** 스캔 해석(비즈니스 규칙)은 `@vibestart/diagnosis-catalog`에, 타입은 `@vibestart/shared-types`에 둔다(헥사고날). 웹은 기존 메커니즘을 재사용한다 — 마커 파싱은 `parseMarkers`, 결과 회수는 stuck-helper식 "출력 붙여넣기", 플랜 반영은 기존 `completed: Set<stepId>`에 union 병합(단계 생성 로직 무변경).

**Tech Stack:** Next.js(App Router) + next-intl, vitest(+jsdom/@testing-library), pnpm 모노레포

**Spec:** `docs/superpowers/specs/2026-07-02-setup-scan-gate-design.md`

## Global Constraints

- 패키지 매니저는 **pnpm만** 사용 (`pnpm --filter @vibestart/web <cmd>`)
- TypeScript strict: `any` 금지, 공개 함수에 반환 타입 명시
- i18n: `ko.json`이 원본, en/ja/zh/es/hi 5개 파일에 동일 키·동등 내용 반영 (`i18n-sync.test.ts`가 키 패리티를 기계 검증)
- 커밋 메시지: `<type>(<scope>): <subject>` 규칙. **Co-Authored-By / Claude-Session 트레일러 절대 금지** (Vercel Hobby가 배포를 차단함)
- **커밋 스텝은 사용자가 실행 시작 시점에 태스크별 커밋을 승인한 경우에만 수행** (이 프로젝트는 자동 커밋 금지 규칙 있음)
- 붙여넣은 터미널 출력은 신뢰 불가 — 마커 매칭에만 사용, 출력에서 명령을 합성하지 않음
- 스캔 스크립트는 정적 문자열 — 사용자 입력 삽입 금지
- macOS 플로우는 어떤 동작 변화도 없어야 함

## File Structure

| 파일 | 작업 | 책임 |
|---|---|---|
| `packages/shared-types/src/diagnosis.types.ts` | 수정 | `ScanResult` 타입 |
| `packages/diagnosis-catalog/src/scan.ts` | 생성 | `parseScanOutput` — 스캔 출력 해석 (도메인) |
| `packages/diagnosis-catalog/src/index.ts` | 수정 | `parseScanOutput` re-export |
| `apps/web/src/lib/setup-steps.ts` | 수정 | 스캔 스크립트 상수, 사전완료 매핑, editor 재배치 |
| `apps/web/src/lib/ga.ts` | 수정 | 스캔 이벤트 3종 + `trackSetupStart` exp 파라미터 |
| `apps/web/src/lib/onboarding.ts` | 수정 | `InstallExperience` 타입, 단계 키/진행 가능 헬퍼 |
| `apps/web/src/components/onboarding/step-experience.tsx` | 생성 | 경험 질문 UI |
| `apps/web/src/components/setup/scan-gate.tsx` | 생성 | 스캔 게이트 UI (어댑터 — 렌더만) |
| `apps/web/src/app/[locale]/onboarding/page.tsx` | 수정 | 동적 단계 배열 + exp 전달 |
| `apps/web/src/app/[locale]/plan/page.tsx` | 수정 | exp 파라미터 포워딩 |
| `apps/web/src/app/[locale]/setup/page.tsx` | 수정 | 게이트 렌더 + union 병합 + GA |
| `apps/web/messages/{ko,en,ja,zh,es,hi}.json` | 수정 | 신규 키 + editor 가이드 재작성 |
| `apps/web/src/test/scan-parse.test.ts` | 생성 | parseScanOutput 단위 테스트 |
| `apps/web/src/test/setup-scan-steps.test.ts` | 생성 | 단계 순서·매핑·스크립트 동기화 테스트 |
| `apps/web/src/test/onboarding-flow.test.ts` | 생성 | 온보딩 단계 헬퍼 테스트 |
| `apps/web/src/test/scan-gate.test.tsx` | 생성 | ScanGate 컴포넌트 테스트 |

---

### Task 1: ScanResult 타입 + parseScanOutput (도메인)

**Files:**
- Modify: `packages/shared-types/src/diagnosis.types.ts` (ParsedMarker 정의 아래, 83-87행 부근)
- Create: `packages/diagnosis-catalog/src/scan.ts`
- Modify: `packages/diagnosis-catalog/src/index.ts`
- Test: `apps/web/src/test/scan-parse.test.ts`

**Interfaces:**
- Consumes: `parseMarkers(output: string): ParsedMarker[]` (기존, `./matcher`)
- Produces: `interface ScanResult { wsl: boolean; vscode: boolean }` (shared-types), `parseScanOutput(output: string): ScanResult | null` (diagnosis-catalog 패키지 루트 export)

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/web/src/test/scan-parse.test.ts` 생성:

```ts
// @vitest-environment node
/**
 * 환경 스캔 출력 해석 테스트.
 * 두 마커(scan-wsl/scan-vscode)가 모두 있어야 판정하고,
 * 하나라도 없거나 오염되면 null(풀 트랙 폴백)이어야 한다.
 */
import { describe, expect, it } from "vitest";
import { parseScanOutput } from "@vibestart/diagnosis-catalog";

const line = (step: string, result: string): string =>
  `VIBESTART::step=${step}::result=${result}`;

describe("parseScanOutput", () => {
  it.each([
    ["ok", "ok", { wsl: true, vscode: true }],
    ["ok", "fail", { wsl: true, vscode: false }],
    ["fail", "ok", { wsl: false, vscode: true }],
    ["fail", "fail", { wsl: false, vscode: false }],
  ])("wsl=%s vscode=%s 조합을 해석한다", (w, v, expected) => {
    const output = `${line("scan-wsl", w)}\n${line("scan-vscode", v)}`;
    expect(parseScanOutput(output)).toEqual(expected);
  });

  it("PowerShell 프롬프트 등 노이즈 사이에 있어도 해석한다", () => {
    const output = [
      "PS C:\\Users\\me> $w='fail'; ...",
      line("scan-wsl", "ok"),
      line("scan-vscode", "fail"),
      "PS C:\\Users\\me>",
    ].join("\n");
    expect(parseScanOutput(output)).toEqual({ wsl: true, vscode: false });
  });

  it("마커가 하나만 있으면 null(판정 불가)", () => {
    expect(parseScanOutput(line("scan-wsl", "ok"))).toBeNull();
  });

  it("마커가 없는 임의 텍스트면 null", () => {
    expect(parseScanOutput("복사가 잘못된 아무 텍스트")).toBeNull();
  });

  it("result 값이 오염된 마커는 없는 것으로 취급한다", () => {
    const output = `${line("scan-wsl", "banana")}\n${line("scan-vscode", "ok")}`;
    expect(parseScanOutput(output)).toBeNull();
  });

  it("빈 문자열이면 null", () => {
    expect(parseScanOutput("")).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @vibestart/web test -- src/test/scan-parse.test.ts`
Expected: FAIL — `parseScanOutput`이 `@vibestart/diagnosis-catalog`에 없음 (import 에러)

- [ ] **Step 3: ScanResult 타입 추가**

`packages/shared-types/src/diagnosis.types.ts`의 `ParsedMarker` 인터페이스 정의 바로 아래에 추가:

```ts
/** 환경 스캔("내 컴퓨터 확인하기") 판정 결과. true = 이미 설치됨. */
export interface ScanResult {
  wsl: boolean;
  vscode: boolean;
}
```

참고: `packages/shared-types/src/index.ts`가 `diagnosis.types`를 re-export하는지 확인 (`grep -n "diagnosis.types" packages/shared-types/src/index.ts`). `export * from './diagnosis.types'` 형태면 추가 작업 없음. 개별 named export면 `ScanResult`를 목록에 추가.

- [ ] **Step 4: parseScanOutput 구현**

`packages/diagnosis-catalog/src/scan.ts` 생성:

```ts
import type { ScanResult } from '@vibestart/shared-types';
import { parseMarkers } from './matcher';

/**
 * 환경 스캔 출력 해석. 두 마커(scan-wsl/scan-vscode)가 모두 있어야 판정한다.
 * 하나라도 없거나 오염됐으면 null — 호출부는 풀 트랙으로 폴백한다.
 */
export function parseScanOutput(output: string): ScanResult | null {
  const markers = parseMarkers(output);
  const wsl = markers.find((m) => m.step === 'scan-wsl' && m.result !== undefined);
  const vscode = markers.find((m) => m.step === 'scan-vscode' && m.result !== undefined);
  if (!wsl || !vscode) return null;
  return { wsl: wsl.result === 'ok', vscode: vscode.result === 'ok' };
}
```

`packages/diagnosis-catalog/src/index.ts`에 추가 (기존 `export { maskSensitive }` 줄 근처):

```ts
export { parseScanOutput } from './scan';
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm --filter @vibestart/web test -- src/test/scan-parse.test.ts`
Expected: PASS (7 tests)

주의 — "오염된 result" 테스트가 통과하는 이유: `parseMarkers`는 `result` 키를 `ok`/`fail`일 때만 채우므로 `result=banana`는 `result === undefined`가 되어 미존재 취급된다. 만약 이 테스트가 실패하면 `find` 조건의 `m.result !== undefined`가 빠졌는지 확인할 것.

- [ ] **Step 6: 커밋** (사용자가 태스크별 커밋을 승인한 경우)

```bash
git add packages/shared-types/src/diagnosis.types.ts packages/shared-types/src/index.ts packages/diagnosis-catalog/src/scan.ts packages/diagnosis-catalog/src/index.ts apps/web/src/test/scan-parse.test.ts
git commit -m "feat(diagnosis-catalog): 환경 스캔 출력 해석 parseScanOutput 추가"
```

---

### Task 2: 스캔 스크립트 상수 + 사전완료 매핑 + editor 재배치

**Files:**
- Modify: `apps/web/src/lib/setup-steps.ts`
- Test: `apps/web/src/test/setup-scan-steps.test.ts`

**Interfaces:**
- Consumes: `ScanResult` (`@vibestart/shared-types`), `parseScanOutput` (`@vibestart/diagnosis-catalog`, 테스트에서 라운드트립 검증용)
- Produces: `WINDOWS_SCAN_SCRIPT: string` (named export), `scanPrecompletedStepIds(result: ScanResult): string[]` (named export), Windows 단계 순서 `terminal → preflight → editor → wsl → reboot → wsl-open → …`

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/web/src/test/setup-scan-steps.test.ts` 생성:

```ts
// @vitest-environment node
/**
 * 스캔 게이트 관련 setup-steps 규칙 테스트.
 * 1) Windows 단계 순서: editor가 재부팅 앞(preflight와 wsl 사이)에 위치
 * 2) editor group 변경이 진단 매핑을 깨지 않음 (tools-install 유지)
 * 3) 스캔 결과 → 사전완료 단계 id 매핑
 * 4) 스캔 스크립트와 parseScanOutput의 마커 계약 동기화
 */
import { describe, expect, it } from "vitest";
import { parseScanOutput } from "@vibestart/diagnosis-catalog";
import {
  WINDOWS_SCAN_SCRIPT,
  scanPrecompletedStepIds,
  getSetupSteps,
  diagnosisStepFor,
} from "@/lib/setup-steps";

const t = (key: string): string => key;

describe("Windows 단계 순서", () => {
  it("editor가 preflight와 wsl 사이(재부팅 앞)에 온다", () => {
    const ids = getSetupSteps("windows", "web-nextjs", "demo", t).map((s) => s.id);
    expect(ids.slice(0, 6)).toEqual([
      "terminal",
      "preflight",
      "editor",
      "wsl",
      "reboot",
      "wsl-open",
    ]);
  });

  it("editor는 envPrep 그룹이지만 진단 단계는 tools-install을 유지한다", () => {
    const editor = getSetupSteps("windows", "web-nextjs", "demo", t).find(
      (s) => s.id === "editor",
    );
    expect(editor?.group).toBe("envPrep");
    expect(editor && diagnosisStepFor(editor)).toBe("tools-install");
  });

  it("macOS 단계 순서는 변하지 않는다", () => {
    const ids = getSetupSteps("macos", "web-nextjs", "demo", t).map((s) => s.id);
    expect(ids.slice(0, 4)).toEqual(["terminal", "brew", "dev-tools", "editor"]);
  });
});

describe("scanPrecompletedStepIds", () => {
  it("wsl 보유 시 preflight/wsl/reboot을 사전완료한다 (wsl-open 제외)", () => {
    expect(scanPrecompletedStepIds({ wsl: true, vscode: false })).toEqual([
      "preflight",
      "wsl",
      "reboot",
    ]);
  });

  it("vscode 보유 시 editor를 사전완료한다", () => {
    expect(scanPrecompletedStepIds({ wsl: false, vscode: true })).toEqual(["editor"]);
  });

  it("둘 다 보유 시 4개 단계를 사전완료한다", () => {
    expect(scanPrecompletedStepIds({ wsl: true, vscode: true })).toEqual([
      "preflight",
      "wsl",
      "reboot",
      "editor",
    ]);
  });

  it("둘 다 없으면 빈 배열", () => {
    expect(scanPrecompletedStepIds({ wsl: false, vscode: false })).toEqual([]);
  });

  it("사전완료 id는 모두 실제 Windows 단계에 존재한다", () => {
    const ids = new Set(getSetupSteps("windows", "web-nextjs", "demo", t).map((s) => s.id));
    for (const id of scanPrecompletedStepIds({ wsl: true, vscode: true })) {
      expect(ids.has(id)).toBe(true);
    }
  });
});

describe("WINDOWS_SCAN_SCRIPT ↔ parseScanOutput 계약", () => {
  it("스크립트가 두 마커 템플릿을 모두 포함한다", () => {
    expect(WINDOWS_SCAN_SCRIPT).toContain("VIBESTART::step=scan-wsl::result=$w");
    expect(WINDOWS_SCAN_SCRIPT).toContain("VIBESTART::step=scan-vscode::result=$v");
  });

  it("스크립트가 낼 수 있는 출력 형태를 parseScanOutput이 해석한다", () => {
    // 스크립트의 Write-Output 결과를 시뮬레이션 ($w/$v 치환)
    const simulated =
      "VIBESTART::step=scan-wsl::result=ok\nVIBESTART::step=scan-vscode::result=fail";
    expect(parseScanOutput(simulated)).toEqual({ wsl: true, vscode: false });
  });

  it("스크립트는 한 줄 세미콜론 체인이다 (복붙 시 >> 프롬프트 방지)", () => {
    expect(WINDOWS_SCAN_SCRIPT).not.toContain("\n");
  });

  it("스크립트는 WSL 내부 명령을 실행하지 않는다 (미초기화 배포판 부작용 차단)", () => {
    // `wsl -l -q`(목록 조회)만 허용, `wsl -e`/`wsl bash` 등 실행형 금지
    expect(WINDOWS_SCAN_SCRIPT).not.toMatch(/wsl(\.exe)?\s+(-e|--exec|bash)/);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @vibestart/web test -- src/test/setup-scan-steps.test.ts`
Expected: FAIL — `WINDOWS_SCAN_SCRIPT`, `scanPrecompletedStepIds` export 없음 + 순서 불일치

- [ ] **Step 3: setup-steps.ts 수정**

3-1. 파일 상단 import에 `ScanResult` 타입 추가:

```ts
import type { DiagnosisStep, ScanResult } from "@vibestart/shared-types";
```

3-2. `GROUP_TO_DIAGNOSIS_STEP` 정의 아래(파일 상단부)에 스캔 상수·매핑 추가:

```ts
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
```

3-3. `wslVscodeStep`의 반환 객체 수정 — group 변경 + 진단 단계 명시 오버라이드 (이게 빠지면 StuckHelper가 wsl-install 규칙을 적용하는 회귀 발생):

```ts
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
    ...
```

(`resultPreview`, `troubleshooting`은 기존 그대로 유지)

3-4. `getSetupSteps`의 Windows 분기에서 `steps.push(wslVscodeStep(t))` 호출을 이동:

```ts
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
```

(macOS 분기 무변경. `hardenShellFor`는 수정하지 않음 — Windows editor는 원래 하드닝 제외 대상이고 id 기반이라 순서 이동의 영향 없음)

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @vibestart/web test -- src/test/setup-scan-steps.test.ts`
Expected: PASS (12 tests)

- [ ] **Step 5: 기존 테스트 회귀 확인**

Run: `pnpm --filter @vibestart/web test`
Expected: 전체 PASS. 만약 `harden-diagnosis.test.ts` 등이 단계 순서에 의존해 실패하면, 실패한 어서션이 "순서 자체"를 검증하는지 "하드닝 규칙"을 검증하는지 판단하고 — 순서 의존이면 새 순서(`terminal, preflight, editor, wsl, reboot, wsl-open, …`)로 기대값을 갱신, 하드닝 규칙 실패면 구현을 재검토(하드닝은 건드리지 않았어야 정상).

- [ ] **Step 6: 커밋** (사용자가 태스크별 커밋을 승인한 경우)

```bash
git add apps/web/src/lib/setup-steps.ts apps/web/src/test/setup-scan-steps.test.ts
git commit -m "feat(web): 환경 스캔 스크립트·사전완료 매핑 추가 + VS Code 단계 재부팅 앞 재배치"
```

---

### Task 3: GA4 이벤트 추가

**Files:**
- Modify: `apps/web/src/lib/ga.ts`

**Interfaces:**
- Produces: `trackSetupScanShown(): void`, `trackSetupScanResult(wsl: string, vscode: string): void`, `trackSetupScanSkipped(): void`, `trackSetupStart(os: string, goal: string, exp?: string): void` (기존 시그니처에 optional 파라미터 추가 — 기존 호출부 무영향)

- [ ] **Step 1: ga.ts 수정**

`trackSetupStart`를 다음으로 교체:

```ts
export function trackSetupStart(os: string, goal: string, exp?: string): void {
  trackEvent({ action: "setup_start", params: exp ? { os, goal, exp } : { os, goal } });
}
```

`trackSetupComplete` 아래에 추가:

```ts
/* ── 환경 스캔("내 컴퓨터 확인하기") 게이트 ── */

export function trackSetupScanShown(): void {
  trackEvent({ action: "setup_scan_shown" });
}

export function trackSetupScanResult(wsl: string, vscode: string): void {
  trackEvent({ action: "setup_scan_result", params: { wsl, vscode } });
}

export function trackSetupScanSkipped(): void {
  trackEvent({ action: "setup_scan_skipped" });
}
```

- [ ] **Step 2: 타입 체크**

Run: `pnpm --filter @vibestart/web typecheck`
Expected: PASS (에러 0)

- [ ] **Step 3: 커밋** (사용자가 태스크별 커밋을 승인한 경우)

```bash
git add apps/web/src/lib/ga.ts
git commit -m "feat(web): 환경 스캔 게이트 GA4 이벤트 3종 + setup_start exp 파라미터"
```

---

### Task 4: i18n 메시지 — 6개 언어

**Files:**
- Modify: `apps/web/messages/ko.json`, `en.json`, `ja.json`, `zh.json`, `es.json`, `hi.json`

**Interfaces:**
- Produces: `Onboarding.steps.experience.*`, `Onboarding.experienceAriaLabel`, `Onboarding.experienceOptions.*`, `Setup.scanGate.*` 키 트리 (아래 컴포넌트들이 `useTranslations("Onboarding")`, `useTranslations("Setup.scanGate")`로 소비)
- 변경: `SetupSteps.editor.detailedGuide.windows` 값 재작성 (키 무변경)

- [ ] **Step 1: ko.json에 신규 키 추가**

`Onboarding.steps`에 `experience` 추가 (기존 `os`와 `aiIntro` 사이):

```json
"experience": {
  "title": "설치 경험",
  "description": "이 컴퓨터에 개발 도구를 설치해본 적 있나요?"
}
```

`Onboarding` 네임스페이스에 추가 (`osAriaLabel` 근처):

```json
"experienceAriaLabel": "설치 경험 선택",
"experienceOptions": {
  "first": {
    "label": "처음이에요",
    "description": "괜찮아요! 처음부터 하나씩 차근차근 안내해드릴게요."
  },
  "prior": {
    "label": "해본 적 있어요",
    "description": "이미 설치된 도구가 있는지 확인하고, 있으면 그 단계를 건너뛰어요."
  },
  "unsure": {
    "label": "모르겠어요",
    "description": "간단한 확인 한 번으로 알려드릴게요. 1분이면 충분해요."
  }
}
```

`Setup` 네임스페이스에 `scanGate` 추가:

```json
"scanGate": {
  "title": "내 컴퓨터 확인하기",
  "subtitle": "이미 설치된 도구가 있는지 1분 만에 확인해요. 있으면 그 단계는 건너뜁니다!",
  "adminNote": "이번 확인은 관리자 권한이 필요 없어요.",
  "openGuideToggle": "PowerShell 여는 법",
  "openGuide": "키보드의 Windows 키를 누르고 'PowerShell'을 입력한 뒤 Enter를 눌러주세요. 파란색(또는 검은색) 명령창이 열리면 준비 완료!",
  "scriptLabel": "아래 명령어를 복사해서 PowerShell에 붙여넣고 Enter를 눌러주세요.",
  "pasteLabel": "실행 결과를 그대로 복사해서 아래에 붙여넣어주세요.",
  "pastePlaceholder": "VIBESTART:: 로 시작하는 줄이 포함된 결과를 붙여넣어주세요",
  "submit": "확인하기",
  "skip": "그냥 처음부터 할래요",
  "parseError": "결과를 인식하지 못했어요. 출력 전체를 다시 복사해서 붙여넣어주세요. 잘 안 되면 아래 '그냥 처음부터 할래요'로 진행해도 괜찮아요.",
  "resultTitle": "확인 결과",
  "wslFound": "✓ Ubuntu(WSL) — 이미 설치돼 있어요",
  "wslMissing": "Ubuntu(WSL) — 설치가 필요해요",
  "vscodeFound": "✓ VS Code — 이미 설치돼 있어요",
  "vscodeMissing": "VS Code — 설치가 필요해요",
  "resultNote": "이미 설치된 항목은 완료로 표시해뒀어요. 진행바가 채워진 채로 시작합니다!",
  "continueButton": "내 플랜 보기"
}
```

`SetupSteps.editor.detailedGuide.windows` 값을 다음으로 교체 (순서 재배치로 "Ubuntu 창 닫고 다시 열기" 안내가 불필요해짐 — Ubuntu가 아직 설치 전):

```json
"windows": "VS Code는 Windows에 설치하지만, 이후 WSL(리눅스)과 자동으로 연결됩니다. 지금 열려 있는 PowerShell 창에서 바로 실행하면 돼요."
```

- [ ] **Step 2: en.json에 동일 구조 추가**

```json
"experience": {
  "title": "Experience",
  "description": "Have you ever installed developer tools on this computer?"
}
```

```json
"experienceAriaLabel": "Select installation experience",
"experienceOptions": {
  "first": {
    "label": "This is my first time",
    "description": "No worries! We'll guide you through every step from scratch."
  },
  "prior": {
    "label": "I've done it before",
    "description": "We'll check which tools are already installed and skip those steps."
  },
  "unsure": {
    "label": "I'm not sure",
    "description": "One quick check will tell you. It takes about a minute."
  }
}
```

```json
"scanGate": {
  "title": "Check your computer",
  "subtitle": "Let's spend one minute checking what's already installed. Anything found gets skipped!",
  "adminNote": "No administrator rights needed for this check.",
  "openGuideToggle": "How to open PowerShell",
  "openGuide": "Press the Windows key, type 'PowerShell', then press Enter. When a blue (or black) command window opens, you're ready!",
  "scriptLabel": "Copy the command below, paste it into PowerShell, and press Enter.",
  "pasteLabel": "Copy the output and paste it below.",
  "pastePlaceholder": "Paste the output that includes lines starting with VIBESTART::",
  "submit": "Check",
  "skip": "Just start from scratch",
  "parseError": "We couldn't recognize the output. Copy the entire output and paste it again — or continue with 'Just start from scratch' below.",
  "resultTitle": "Result",
  "wslFound": "✓ Ubuntu (WSL) — already installed",
  "wslMissing": "Ubuntu (WSL) — needs to be installed",
  "vscodeFound": "✓ VS Code — already installed",
  "vscodeMissing": "VS Code — needs to be installed",
  "resultNote": "Items already installed are marked complete. Your progress bar starts pre-filled!",
  "continueButton": "See my plan"
}
```

`SetupSteps.editor.detailedGuide.windows`:

```json
"windows": "VS Code installs on Windows and will connect to WSL (Linux) automatically later. You can run this right in the PowerShell window you already have open."
```

- [ ] **Step 3: ja/zh/es/hi 3개 언어 번역**

ja.json, zh.json, es.json, hi.json 각각에 위와 **동일한 키 구조**로 해당 언어 번역을 추가한다. ko/en 값을 원문으로 삼아 각 언어의 기존 파일 톤(존댓말 수준, 이모지 사용 등 — 기존 `Onboarding`/`Setup` 항목 참조)에 맞춰 자연스럽게 번역할 것. `SetupSteps.editor.detailedGuide.windows` 값도 4개 언어 모두 새 의미로 교체. `VIBESTART::`, `PowerShell`, `VS Code`, `Ubuntu`, `WSL`, `Enter` 같은 고유명사·기술 토큰은 번역하지 않는다.

- [ ] **Step 4: 키 동기화 테스트 통과 확인**

Run: `pnpm --filter @vibestart/web test -- src/test/i18n-sync.test.ts`
Expected: PASS — 6개 locale 키 그래프 일치

- [ ] **Step 5: 커밋** (사용자가 태스크별 커밋을 승인한 경우)

```bash
git add apps/web/messages/
git commit -m "feat(web): 설치 경험 질문·스캔 게이트 i18n 문자열 6개 언어 추가"
```

---

### Task 5: ScanGate 컴포넌트

**Files:**
- Create: `apps/web/src/components/setup/scan-gate.tsx`
- Test: `apps/web/src/test/scan-gate.test.tsx`

**Interfaces:**
- Consumes: `parseScanOutput` (`@vibestart/diagnosis-catalog`), `ScanResult` (`@vibestart/shared-types`), `ScriptBlock` (`@/components/onboarding/script-block`), `Button` (`@/components/ui/button`), 메시지 키 `Setup.scanGate.*` (Task 4)
- Produces: `ScanGate({ script, onDone }: { script: string; onDone: (result: ScanResult | null) => void })` — `onDone(null)` = 스킵(풀 트랙), `onDone(result)` = 판정 완료

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/web/src/test/scan-gate.test.tsx` 생성:

```tsx
// @vitest-environment jsdom
/**
 * ScanGate 컴포넌트 테스트.
 * 유효 출력 → 결과 패널 → onDone(결과), 오염 출력 → 에러 + onDone 미호출,
 * 스킵 → onDone(null) 세 경로를 검증한다.
 */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import ko from "../../messages/ko.json";
import { ScanGate } from "@/components/setup/scan-gate";

function renderGate() {
  const onDone = vi.fn();
  render(
    <NextIntlClientProvider locale="ko" timeZone="Asia/Seoul" messages={ko}>
      <ScanGate script="echo scan" onDone={onDone} />
    </NextIntlClientProvider>,
  );
  return onDone;
}

const VALID_OUTPUT =
  "VIBESTART::step=scan-wsl::result=ok\nVIBESTART::step=scan-vscode::result=fail";

describe("ScanGate", () => {
  it("유효 출력 제출 → 결과 패널 표시 → 계속하면 onDone(판정)", async () => {
    const user = userEvent.setup();
    const onDone = renderGate();

    await user.type(screen.getByRole("textbox"), VALID_OUTPUT);
    await user.click(screen.getByRole("button", { name: ko.Setup.scanGate.submit }));

    // 결과 패널: wsl 있음 / vscode 없음
    expect(screen.getByText(ko.Setup.scanGate.wslFound)).toBeInTheDocument();
    expect(screen.getByText(ko.Setup.scanGate.vscodeMissing)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: ko.Setup.scanGate.continueButton }));
    expect(onDone).toHaveBeenCalledWith({ wsl: true, vscode: false });
  });

  it("인식 불가 출력 → 에러 안내 + onDone 미호출", async () => {
    const user = userEvent.setup();
    const onDone = renderGate();

    await user.type(screen.getByRole("textbox"), "아무 텍스트");
    await user.click(screen.getByRole("button", { name: ko.Setup.scanGate.submit }));

    expect(screen.getByText(ko.Setup.scanGate.parseError)).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it("빈 입력이면 확인 버튼이 비활성화된다", () => {
    renderGate();
    expect(screen.getByRole("button", { name: ko.Setup.scanGate.submit })).toBeDisabled();
  });

  it("스킵 → onDone(null)", async () => {
    const user = userEvent.setup();
    const onDone = renderGate();

    await user.click(screen.getByRole("button", { name: ko.Setup.scanGate.skip }));
    expect(onDone).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @vibestart/web test -- src/test/scan-gate.test.tsx`
Expected: FAIL — `@/components/setup/scan-gate` 모듈 없음

(만약 jsdom 환경/jest-dom matcher 문제로 다른 에러가 나면 `src/test/setup.ts`에 `@testing-library/jest-dom` 등록 여부를 확인하고, 없으면 `import "@testing-library/jest-dom/vitest";`를 setup.ts에 추가한다. vitest 설정에 setupFiles가 지정돼 있는지 `apps/web/vitest.config.*`를 확인.)

- [ ] **Step 3: 컴포넌트 구현**

`apps/web/src/components/setup/scan-gate.tsx` 생성:

```tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ScriptBlock } from "@/components/onboarding/script-block";
import { parseScanOutput } from "@vibestart/diagnosis-catalog";
import type { ScanResult } from "@vibestart/shared-types";

interface ScanGateProps {
  script: string;
  onDone: (result: ScanResult | null) => void;
}

/**
 * "내 컴퓨터 확인하기" 게이트 — 설치 경험자(exp=prior|unsure)용 사전 스캔.
 * 붙여넣은 출력은 신뢰 불가: 마커 매칭에만 쓰고 명령을 합성하지 않는다(stuck-helper 원칙).
 * 판정 불가 시 에러 + 스킵 탈출구로 막다른 길을 만들지 않는다(풀 트랙 폴백).
 */
export function ScanGate({ script, onDone }: ScanGateProps) {
  const t = useTranslations("Setup.scanGate");
  const [output, setOutput] = useState("");
  const [showOpenGuide, setShowOpenGuide] = useState(false);
  const [parseFailed, setParseFailed] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  function handleSubmit(): void {
    const parsed = parseScanOutput(output);
    if (!parsed) {
      setParseFailed(true);
      return;
    }
    setParseFailed(false);
    setResult(parsed);
  }

  if (result) {
    return (
      <div className="rounded-xl border-2 border-primary/50 bg-card p-6">
        <h3 className="mb-4 font-semibold">{t("resultTitle")}</h3>
        <ul className="mb-4 flex flex-col gap-2 text-sm">
          <li className={result.wsl ? "font-medium text-success" : "text-muted-foreground"}>
            {result.wsl ? t("wslFound") : t("wslMissing")}
          </li>
          <li className={result.vscode ? "font-medium text-success" : "text-muted-foreground"}>
            {result.vscode ? t("vscodeFound") : t("vscodeMissing")}
          </li>
        </ul>
        {(result.wsl || result.vscode) && (
          <p className="mb-4 text-sm text-muted-foreground">{t("resultNote")}</p>
        )}
        <Button onClick={() => onDone(result)}>{t("continueButton")}</Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-2 border-primary/50 bg-card p-6">
      <h3 className="mb-1 font-semibold">{t("title")}</h3>
      <p className="mb-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      <p className="mb-4 text-xs text-muted-foreground/70">{t("adminNote")}</p>

      <button
        aria-expanded={showOpenGuide}
        onClick={() => setShowOpenGuide((v) => !v)}
        className="mb-2 text-xs text-sky-400/70 hover:text-sky-400 transition-colors"
      >
        {t("openGuideToggle")}
      </button>
      {showOpenGuide && (
        <div className="mb-3 whitespace-pre-line rounded-lg bg-primary/5 p-3 text-sm text-muted-foreground">
          {t("openGuide")}
        </div>
      )}

      <p className="mb-2 text-sm text-muted-foreground">{t("scriptLabel")}</p>
      <div className="mb-4">
        <ScriptBlock script={script} />
      </div>

      <p className="mb-2 text-sm text-muted-foreground">{t("pasteLabel")}</p>
      <textarea
        value={output}
        onChange={(e) => setOutput(e.target.value)}
        rows={5}
        placeholder={t("pastePlaceholder")}
        className="mb-2 w-full rounded-lg border border-border/50 bg-background/80 p-3 font-mono text-xs text-muted-foreground"
      />
      {parseFailed && <p className="mb-2 text-sm text-red-400">{t("parseError")}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={output.trim().length === 0} onClick={handleSubmit}>
          {t("submit")}
        </Button>
        <button
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => onDone(null)}
        >
          {t("skip")}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @vibestart/web test -- src/test/scan-gate.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 5: 커밋** (사용자가 태스크별 커밋을 승인한 경우)

```bash
git add apps/web/src/components/setup/scan-gate.tsx apps/web/src/test/scan-gate.test.tsx apps/web/src/test/setup.ts
git commit -m "feat(web): 환경 스캔 게이트 ScanGate 컴포넌트"
```

---

### Task 6: 온보딩 — 설치 경험 단계

**Files:**
- Modify: `apps/web/src/lib/onboarding.ts`
- Create: `apps/web/src/components/onboarding/step-experience.tsx`
- Modify: `apps/web/src/app/[locale]/onboarding/page.tsx`
- Test: `apps/web/src/test/onboarding-flow.test.ts`

**Interfaces:**
- Produces: `type InstallExperience = "first" | "prior" | "unsure"`, `OnboardingData.experience: InstallExperience | null`, `onboardingStepKeys(os: OS | null): readonly OnboardingStepKey[]`, `canProceedFrom(stepKey: OnboardingStepKey, data: OnboardingData): boolean`, `StepExperience({ value, onChange })`
- 라우팅 계약: Windows일 때 `/plan?os=…&goal=…&project=…&exp=first|prior|unsure` (Task 7이 소비)

- [ ] **Step 1: 실패하는 테스트 작성**

`apps/web/src/test/onboarding-flow.test.ts` 생성:

```ts
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
  type OnboardingData,
} from "@/lib/onboarding";

describe("onboardingStepKeys", () => {
  it("Windows는 experience 단계를 포함한 5단계다", () => {
    expect(onboardingStepKeys("windows")).toEqual([
      "os",
      "experience",
      "aiIntro",
      "goal",
      "projectName",
    ]);
  });

  it("macOS는 기존 4단계 그대로다", () => {
    expect(onboardingStepKeys("macos")).toEqual(["os", "aiIntro", "goal", "projectName"]);
  });

  it("OS 미선택 상태는 4단계다 (선택 시 재계산)", () => {
    expect(onboardingStepKeys(null)).toEqual(["os", "aiIntro", "goal", "projectName"]);
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

  it("aiIntro는 항상 진행 가능", () => {
    expect(canProceedFrom("aiIntro", base)).toBe(true);
  });

  it("goal 단계는 goal 선택 후 진행 가능", () => {
    expect(canProceedFrom("goal", base)).toBe(false);
    expect(canProceedFrom("goal", { ...base, goal: "web-nextjs" })).toBe(true);
  });

  it("projectName 단계는 2자 이상 입력 후 진행 가능", () => {
    expect(canProceedFrom("projectName", { ...base, projectName: "a" })).toBe(false);
    expect(canProceedFrom("projectName", { ...base, projectName: "ab" })).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `pnpm --filter @vibestart/web test -- src/test/onboarding-flow.test.ts`
Expected: FAIL — `onboardingStepKeys`, `canProceedFrom` export 없음

- [ ] **Step 3: lib/onboarding.ts 수정**

`OS` 타입 아래에 추가:

```ts
/** 이 컴퓨터에 개발 도구를 설치해본 경험 — Windows 스캔 게이트 분기용. */
export type InstallExperience = "first" | "prior" | "unsure";
```

`OnboardingData`와 `INITIAL_ONBOARDING`을 수정:

```ts
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
```

파일 하단의 `ONBOARDING_STEPS` const를 삭제하고 다음으로 교체:

```ts
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
```

삭제 전 확인: `grep -rn "ONBOARDING_STEPS" apps/web/src/` — 사용처가 `onboarding/page.tsx`와 `lib/onboarding.ts`뿐이어야 삭제 안전. 다른 사용처가 있으면 삭제하지 말고 유지한 채 페이지만 새 헬퍼로 전환.

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm --filter @vibestart/web test -- src/test/onboarding-flow.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: StepExperience 컴포넌트 생성**

`apps/web/src/components/onboarding/step-experience.tsx` 생성:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { InstallExperience } from "@/lib/onboarding";

const EXPERIENCE_VALUES: readonly InstallExperience[] = ["first", "prior", "unsure"];

interface StepExperienceProps {
  value: InstallExperience | null;
  onChange: (experience: InstallExperience) => void;
}

export function StepExperience({ value, onChange }: StepExperienceProps) {
  const t = useTranslations("Onboarding");
  return (
    <div role="radiogroup" aria-label={t("experienceAriaLabel")} className="flex flex-col gap-3">
      {EXPERIENCE_VALUES.map((option) => (
        <button
          key={option}
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={`rounded-xl border-2 p-5 text-left transition-all ${
            value === option
              ? "border-primary bg-primary/10"
              : "border-border/50 bg-card hover:border-primary/50"
          }`}
        >
          <span className="block font-medium text-foreground">
            {t(`experienceOptions.${option}.label`)}
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            {t(`experienceOptions.${option}.description`)}
          </span>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: 온보딩 페이지 배선**

`apps/web/src/app/[locale]/onboarding/page.tsx` 수정:

6-1. import 교체 — `ONBOARDING_STEPS` 제거, 새 헬퍼·컴포넌트 추가:

```ts
import { StepExperience } from "@/components/onboarding/step-experience";
import {
  OnboardingData,
  INITIAL_ONBOARDING,
  onboardingStepKeys,
  canProceedFrom,
} from "@/lib/onboarding";
```

6-2. `const STEP_KEYS = ...` 상수 줄을 삭제하고, 컴포넌트 본문의 단계 계산을 교체:

```ts
  const stepKeys = onboardingStepKeys(data.os);
  const totalSteps = stepKeys.length;
  const progress = ((step + 1) / totalSteps) * 100;
  const stepKey = stepKeys[step];
```

6-3. `canProceed` 함수를 index 기반 switch에서 키 기반으로 교체:

```ts
  function canProceed(): boolean {
    return canProceedFrom(stepKey, data);
  }
```

6-4. `handleNext`의 os 트래킹 조건을 index에서 키로 바꾸고, 완료 시 exp 파라미터 추가:

```ts
  function handleNext() {
    if (step < totalSteps - 1) {
      if (stepKey === "os" && data.os) {
        trackOnboardingStart(data.os);
      }
      setStep(step + 1);
    } else {
      trackOnboardingComplete(data.os!, data.goal!);
      const params = new URLSearchParams({
        os: data.os!,
        goal: data.goal!,
        project: data.projectName,
      });
      if (data.os === "windows") {
        params.set("exp", data.experience ?? "first");
      }
      router.push(`/plan?${params.toString()}`);
    }
  }
```

6-5. 단계별 컴포넌트 렌더를 index 비교에서 키 비교로 교체 (`{step === 0 && …}` → `{stepKey === "os" && …}` 등), experience 추가:

```tsx
        <div className="mb-10">
          {stepKey === "os" && (
            <StepOS
              value={data.os}
              onChange={(os) => setData({ ...data, os })}
            />
          )}
          {stepKey === "experience" && (
            <StepExperience
              value={data.experience}
              onChange={(experience) => setData({ ...data, experience })}
            />
          )}
          {stepKey === "aiIntro" && <StepAIIntro />}
          {stepKey === "goal" && (
            <StepGoal
              value={data.goal}
              onChange={(goal) => setData({ ...data, goal })}
            />
          )}
          {stepKey === "projectName" && (
            <StepProjectName
              value={data.projectName}
              onChange={(projectName) => setData({ ...data, projectName })}
            />
          )}
        </div>
```

(진행 바·타이틀의 `t(\`steps.${stepKey}.title\`)` 방식은 그대로 동작 — Task 4에서 `steps.experience.*` 키를 추가했음)

- [ ] **Step 7: 타입 체크 + 전체 테스트**

Run: `pnpm --filter @vibestart/web typecheck && pnpm --filter @vibestart/web test`
Expected: 모두 PASS

- [ ] **Step 8: 커밋** (사용자가 태스크별 커밋을 승인한 경우)

```bash
git add apps/web/src/lib/onboarding.ts apps/web/src/components/onboarding/step-experience.tsx "apps/web/src/app/[locale]/onboarding/page.tsx" apps/web/src/test/onboarding-flow.test.ts
git commit -m "feat(web): 온보딩에 설치 경험 질문 추가 (Windows 전용, exp 파라미터 전달)"
```

---

### Task 7: /plan 페이지 exp 포워딩

**Files:**
- Modify: `apps/web/src/app/[locale]/plan/page.tsx`

**Interfaces:**
- Consumes: URL `?exp=` (Task 6이 생성)
- Produces: `/setup?…&exp=…` 링크 (Task 8이 소비). exp 부재 시 파라미터 생략(= /setup에서 first 폴백)

- [ ] **Step 1: PlanContent 수정**

`projectName` 파싱 줄 아래에 추가:

```ts
  const exp = searchParams.get("exp");
```

`setupParams` 생성부를 다음으로 교체:

```ts
  const setupParams = new URLSearchParams({
    os,
    goal,
    project: projectName,
  });
  if (exp) setupParams.set("exp", exp);
```

- [ ] **Step 2: 타입 체크**

Run: `pnpm --filter @vibestart/web typecheck`
Expected: PASS

- [ ] **Step 3: 커밋** (사용자가 태스크별 커밋을 승인한 경우)

```bash
git add "apps/web/src/app/[locale]/plan/page.tsx"
git commit -m "feat(web): /plan에서 /setup으로 exp 파라미터 포워딩"
```

---

### Task 8: /setup 게이트 배선

**Files:**
- Modify: `apps/web/src/app/[locale]/setup/page.tsx`

**Interfaces:**
- Consumes: `ScanGate` (Task 5), `WINDOWS_SCAN_SCRIPT`·`scanPrecompletedStepIds` (Task 2), `trackSetupScan*`·`trackSetupStart(os, goal, exp?)` (Task 3), `ScanResult` (shared-types), URL `?exp=` (Task 7)
- Produces: localStorage `vibestart-scan-${os}-${goal}-${projectName}` = `{"status":"done","wsl":bool,"vscode":bool}` 또는 `{"status":"skipped"}`

- [ ] **Step 1: import 추가**

```ts
import { ScanGate } from "@/components/setup/scan-gate";
import {
  getSetupSteps,
  diagnosisStepFor,
  scanPrecompletedStepIds,
  WINDOWS_SCAN_SCRIPT,
  type SetupGroup,
} from "@/lib/setup-steps";
import type { ScanResult } from "@vibestart/shared-types";
import {
  trackSetupStart,
  trackSetupComplete,
  trackSetupScanShown,
  trackSetupScanResult,
  trackSetupScanSkipped,
} from "@/lib/ga";
```

(기존 `getSetupSteps` import 줄과 `ga` import 줄을 위 형태로 확장)

- [ ] **Step 2: 상태·파생값 추가**

`projectName` 파싱 줄 아래에 exp 파싱(이상값은 first 폴백 — 스펙 요구):

```ts
  const rawExp = searchParams.get("exp");
  const exp = rawExp === "prior" || rawExp === "unsure" ? rawExp : "first";
```

`storageKey` 줄 아래에:

```ts
  const scanKey = `vibestart-scan-${os}-${goal}-${projectName}`;
```

`hydrated` state 줄 아래에:

```ts
  const [scanResolved, setScanResolved] = useState(false);
```

- [ ] **Step 3: 하이드레이션 effect 확장**

기존 마운트 effect(localStorage 복원 + trackSetupStart)를 다음으로 교체:

```ts
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCompleted(new Set<string>(JSON.parse(saved) as string[]));
      }
      // 스캔을 이미 완료/스킵했으면 게이트를 다시 띄우지 않는다 (재부팅 복귀 포함)
      if (localStorage.getItem(scanKey)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setScanResolved(true);
      }
    } catch { /* 무시 */ }
    setHydrated(true);
    trackSetupStart(os, goal, os === "windows" ? exp : undefined);
  }, [storageKey, scanKey, os, goal, exp]);
```

- [ ] **Step 4: 게이트 조건 + 핸들러 + 노출 트래킹 추가**

`isStepActive` 함수 아래에 추가:

```ts
  // 스캔 게이트 — Windows + 설치 경험자(prior/unsure) + 스캔 미완료일 때만.
  // exp=first(절대초보 기본 경로)는 게이트를 아예 만나지 않는다.
  const showScanGate = os === "windows" && exp !== "first" && hydrated && !scanResolved;

  const scanShownTracked = useRef(false);
  useEffect(() => {
    if (showScanGate && !scanShownTracked.current) {
      scanShownTracked.current = true;
      trackSetupScanShown();
    }
  }, [showScanGate]);

  function handleScanDone(result: ScanResult | null): void {
    try {
      localStorage.setItem(
        scanKey,
        JSON.stringify(result ? { status: "done", ...result } : { status: "skipped" }),
      );
    } catch { /* 무시 */ }
    if (result) {
      trackSetupScanResult(result.wsl ? "ok" : "missing", result.vscode ? "ok" : "missing");
      const precompleted = scanPrecompletedStepIds(result);
      if (precompleted.length > 0) {
        // 기존 진행과 합집합 — 스캔이 사용자의 이전 진행을 되돌리지 않는다
        setCompleted((prev) => new Set([...prev, ...precompleted]));
      }
    } else {
      trackSetupScanSkipped();
    }
    setScanResolved(true);
  }
```

- [ ] **Step 5: 렌더 분기**

return문에서 제목/부제(h1/p) 아래의 나머지 콘텐츠(프로그레스 바 sticky div부터 allDone 블록까지)를 게이트와 분기한다:

```tsx
  return (
    <main id="main-content" className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-center text-3xl font-bold">{t("title")}</h1>
        <p className="mb-6 text-center text-muted-foreground">
          {t.rich("subtitle", { strong: (chunks) => <strong className="text-foreground">{chunks}</strong> })}
        </p>

        {showScanGate ? (
          <ScanGate script={WINDOWS_SCAN_SCRIPT} onDone={handleScanDone} />
        ) : (
          <>
            {/* 프로그레스 바 + 그룹 뱃지 (스크롤 시 상단 고정) */}
            … 기존 콘텐츠 전체 (프로그레스 바 div, 스텝 리스트 div, allDone 블록) …
          </>
        )}
      </div>
    </main>
  );
```

주의: 기존 JSX 내용은 수정하지 않고 `<>…</>`로 감싸기만 한다. 훅 호출은 전부 분기 위에 있으므로 훅 순서 규칙 위반 없음.

- [ ] **Step 6: 타입 체크 + 전체 테스트 + 린트**

Run: `pnpm --filter @vibestart/web typecheck && pnpm --filter @vibestart/web test && pnpm --filter @vibestart/web lint`
Expected: 모두 PASS (린트에서 미사용 import 등 걸리면 정리)

- [ ] **Step 7: 커밋** (사용자가 태스크별 커밋을 승인한 경우)

```bash
git add "apps/web/src/app/[locale]/setup/page.tsx"
git commit -m "feat(web): /setup 스캔 게이트 배선 — 사전완료 union 병합 + GA 계측"
```

---

### Task 9: 전체 검증

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 파이프라인**

Run (repo 루트): `pnpm typecheck && pnpm -r lint && pnpm --filter @vibestart/web test && pnpm build`
Expected: 모두 PASS

- [ ] **Step 2: 수동 플로우 확인 (dev 서버)**

`pnpm dev:web` 실행 후 브라우저에서:

1. `/onboarding` → Windows 선택 → **설치 경험 질문이 2번째로 표시**되는지, macOS 선택 시 **표시되지 않는지**
2. "해본 적 있어요" 선택 → 완료 → `/plan` URL에 `exp=prior` → CTA 클릭 → `/setup` URL에 `exp=prior` 유지
3. `/setup`에서 **스캔 게이트가 단계 목록 대신 표시**되는지, "PowerShell 여는 법" 토글 동작
4. textarea에 `VIBESTART::step=scan-wsl::result=ok` + 줄바꿈 + `VIBESTART::step=scan-vscode::result=ok` 붙여넣고 확인 → 결과 패널 → "내 플랜 보기" → **preflight/wsl/reboot/editor 4단계가 ✓ 완료 상태 + 진행바 채워짐**, editor 단계가 **preflight와 wsl 사이**에 위치
5. 새로고침 → 게이트가 다시 뜨지 않고 완료 상태 유지
6. localStorage에서 `vibestart-scan-*` 키 삭제 후 새로고침 → 게이트 재표시 → "그냥 처음부터 할래요" → 전체 단계 표시(사전완료 없음)
7. `/setup?os=windows&goal=web-nextjs&project=test` (exp 없음) → 게이트 없이 기존 플로우
8. `/onboarding`에서 macOS 트랙 끝까지 → `/setup` 기존과 동일 (게이트·순서 변화 없음)

- [ ] **Step 3: 결과 보고**

수동 확인 결과를 사용자에게 요약 보고 (스크린샷 또는 관찰 내용). 실패 항목은 systematic-debugging으로 원인 규명 후 수정.

---

## Self-Review 결과 (작성자 체크)

- **스펙 커버리지**: 스펙 §1(온보딩 질문)→Task 6, §2(게이트)→Task 5+8, §3(스캔 명령)→Task 2, §4(완료 셋)→Task 2+8, §5(재배치)→Task 2, §6(GA)→Task 3+8, §7(i18n)→Task 4, §8(보안 원칙)→정적 스크립트+매칭 전용 파싱으로 관철, 테스트 포인트 5종→Task 1/2/6 테스트 + Task 4 Step 4 + Task 2 Step 5. 누락 없음.
- **타입 일관성**: `ScanResult`(wsl/vscode boolean), `parseScanOutput(output: string): ScanResult | null`, `scanPrecompletedStepIds(result: ScanResult): string[]`, `onDone(result: ScanResult | null)`, `InstallExperience`/`OnboardingStepKey` — 태스크 간 시그니처 교차 확인 완료.
- **경계 케이스**: exp 이상값→first 폴백(Task 8 Step 2), 마커 오염→null→풀 트랙(Task 1), 스캔 후 재방문→게이트 억제(Task 8 Step 3), 기존 진행과 union(Task 8 Step 4), macOS 무영향(Task 2·6 테스트).
