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
