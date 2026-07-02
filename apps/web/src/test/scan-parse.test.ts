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
