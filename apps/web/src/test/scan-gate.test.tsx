// @vitest-environment jsdom
/**
 * ScanGate 컴포넌트 테스트.
 * 유효 출력 → 결과 패널 → onDone(결과), 오염 출력 → 에러 + onDone 미호출,
 * 스킵 → onDone(null) 세 경로를 검증한다.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import ko from "../../messages/ko.json";
import { ScanGate } from "@/components/setup/scan-gate";

// globals=false라 RTL auto-cleanup이 등록되지 않는다 — 명시적으로 정리
afterEach(cleanup);

function renderGate() {
  const onDone = vi.fn();
  render(
    <NextIntlClientProvider locale="ko" timeZone="Asia/Seoul" messages={ko}>
      <ScanGate script="echo scan" onDone={onDone} />
    </NextIntlClientProvider>,
  );
  return onDone;
}

// 마커는 줄 단위로 파싱되므로(parseMarkers의 [^\n\r]+) 실제 터미널 출력처럼 줄바꿈 포함
const VALID_OUTPUT =
  "VIBESTART::step=scan-wsl::result=ok\nVIBESTART::step=scan-vscode::result=fail";

describe("ScanGate", () => {
  it("유효 출력 제출 → 결과 패널 표시 → 계속하면 onDone(판정)", async () => {
    const user = userEvent.setup();
    const onDone = renderGate();

    await user.click(screen.getByRole("textbox"));
    await user.paste(VALID_OUTPUT);
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
