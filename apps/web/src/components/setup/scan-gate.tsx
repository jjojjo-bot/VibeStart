"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ScriptBlock } from "@/components/onboarding/script-block";
import { parseScanOutput } from "@vibestart/diagnosis-catalog";
import type { ScanResult } from "@vibestart/shared-types";

/** 결과 패널 한 줄 — found면 foundKey, 아니면 missingKey를 번역해 표시. */
export interface ScanRow {
  found: boolean;
  foundKey: string;
  missingKey: string;
}

interface ScanGateProps<T> {
  script: string;
  onDone: (result: T | null) => void;
  /** 붙여넣은 출력 파서. 미지정 시 1차(Windows) 스캔 파서. */
  parse?: (output: string) => T | null;
  /** 결과 패널에 렌더할 항목들. 미지정 시 WSL·VS Code 두 줄. */
  rows?: (result: T) => ScanRow[];
  /** 번역 네임스페이스. 기본 Setup.scanGate. */
  namespace?: string;
}

const DEFAULT_ROWS = (r: ScanResult): ScanRow[] => [
  { found: r.wsl, foundKey: "wslFound", missingKey: "wslMissing" },
  { found: r.vscode, foundKey: "vscodeFound", missingKey: "vscodeMissing" },
];

/**
 * "내 컴퓨터 확인하기" 게이트 — 설치 경험자(exp=prior|unsure)용 사전 스캔.
 * 붙여넣은 출력은 신뢰 불가: 마커 매칭에만 쓰고 명령을 합성하지 않는다(stuck-helper 원칙).
 * 판정 불가 시 에러 + 스킵 탈출구로 막다른 길을 만들지 않는다(풀 트랙 폴백).
 * 1차(Windows)·2차(WSL) 스캔이 parse/rows/namespace만 바꿔 공용으로 쓴다(기본값=1차).
 */
export function ScanGate<T = ScanResult>({
  script,
  onDone,
  parse = parseScanOutput as (output: string) => T | null,
  rows = DEFAULT_ROWS as (result: T) => ScanRow[],
  namespace = "Setup.scanGate",
}: ScanGateProps<T>) {
  const t = useTranslations(namespace);
  const rootRef = useRef<HTMLDivElement>(null);
  const [output, setOutput] = useState("");
  const [showOpenGuide, setShowOpenGuide] = useState(false);
  const [parseFailed, setParseFailed] = useState(false);
  const [result, setResult] = useState<T | null>(null);

  function handleSubmit(): void {
    const parsed = parse(output);
    if (parsed === null) {
      setParseFailed(true);
      return;
    }
    setParseFailed(false);
    setResult(parsed);
    // 입력폼→결과패널로 줄며 생기는 스크롤 점프를 잡고, 결과(계속하기 버튼)를 sticky 밑에 놓는다.
    setTimeout(() => rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  if (result !== null) {
    const resultRows = rows(result);
    const anyFound = resultRows.some((r) => r.found);
    return (
      <div ref={rootRef} className="scroll-mt-28 rounded-xl border-2 border-primary/50 bg-card p-6">
        <h3 className="mb-4 font-semibold">{t("resultTitle")}</h3>
        <ul className="mb-4 flex flex-col gap-2 text-sm">
          {resultRows.map((row, i) => (
            <li
              key={i}
              className={row.found ? "font-medium text-success" : "text-muted-foreground"}
            >
              {t(row.found ? row.foundKey : row.missingKey)}
            </li>
          ))}
        </ul>
        {anyFound && <p className="mb-4 text-sm text-muted-foreground">{t("resultNote")}</p>}
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
