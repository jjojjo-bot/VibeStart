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
