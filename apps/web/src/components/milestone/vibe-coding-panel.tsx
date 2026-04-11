"use client";

/**
 * VibeCodingPanel — M3 바이브코딩 실전 가이드.
 *
 * 4단계 안내:
 *   1. AI 에디터(Cursor/Claude Code)로 프로젝트 열기
 *   2. AI에게 첫 수정 요청 (추천 프롬프트 복사)
 *   3. git push (커맨드 복사)
 *   4. 배포 결과 확인 (사이트 열기)
 *
 * 각 단계는 체크박스로 완료 표시. 체크 시 toggleSubstepAction 호출.
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompletedSubsteps } from "./completed-substeps-context";

export interface VibeCodingPanelLabels {
  title: string;
  description: string;
  /** Step 1 */
  step1Title: string;
  step1Desc: string;
  step1VscodeMacCmd: string;
  step1VscodeWinCmd: string;
  step1ClaudeCmd: string;
  /** Step 2 */
  step2Title: string;
  step2Desc: string;
  step2Prompt: string;
  /** Step 3 */
  step3Title: string;
  step3Desc: string;
  step3Prompt: string;
  /** Step 4 */
  step4Title: string;
  step4Desc: string;
  step4Cta: string;
  /** Common */
  copyButton: string;
  copiedButton: string;
  doneButton: string;
  undoButton: string;
  doneLabel: string;
}

export interface VibeCodingPanelProps {
  projectName: string;
  os: "macos" | "windows" | null;
  deployedUrl: string | null;
  completedSteps: ReadonlyArray<string>;
  labels: VibeCodingPanelLabels;
  onComplete: (substepId: string, checked: boolean) => Promise<void>;
}

function CopyButton({
  text,
  copyLabel,
  copiedLabel,
}: {
  text: string;
  copyLabel: string;
  copiedLabel: string;
}): React.ReactNode {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: 조용히 무시
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleCopy}
      className={cn(
        "shrink-0 transition-colors",
        copied && "border-emerald-500/60 text-emerald-400",
      )}
    >
      {copied ? `✓ ${copiedLabel}` : copyLabel}
    </Button>
  );
}

export function VibeCodingPanel({
  projectName,
  os,
  deployedUrl,
  completedSteps,
  labels,
  onComplete,
}: VibeCodingPanelProps): React.ReactNode {
  const { completed, toggle } = useCompletedSubsteps();
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (substepId: string, checked: boolean): Promise<void> => {
    // 낙관적 업데이트: 즉시 UI 반영
    toggle(substepId, checked);
    setLoading(substepId);
    try {
      await onComplete(substepId, checked);
    } catch {
      // 실패 시 롤백
      toggle(substepId, !checked);
    } finally {
      setLoading(null);
    }
  };

  const steps = [
    {
      id: "m3-s1-open-editor",
      title: labels.step1Title,
      desc: labels.step1Desc,
      commands: [
        ...(os !== "windows" ? [{ label: os === "macos" ? "VS Code" : "VS Code (macOS)", cmd: labels.step1VscodeMacCmd.replace("{project}", projectName) }] : []),
        ...(os !== "macos" ? [{ label: os === "windows" ? "VS Code" : "VS Code (Windows)", cmd: labels.step1VscodeWinCmd.replace("{project}", projectName) }] : []),
        { label: "Claude Code", cmd: labels.step1ClaudeCmd.replace("{project}", projectName) },
      ],
    },
    {
      id: "m3-s2-first-ai-edit",
      title: labels.step2Title,
      desc: labels.step2Desc,
      prompt: labels.step2Prompt,
    },
    {
      id: "m3-s3-git-push",
      title: labels.step3Title,
      desc: labels.step3Desc,
      prompt: labels.step3Prompt,
    },
    {
      id: "m3-s4-verify-deploy",
      title: labels.step4Title,
      desc: labels.step4Desc,
      url: deployedUrl,
    },
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-5">
        <h2 className="mb-1 text-sm font-medium text-muted-foreground">
          {labels.title}
        </h2>
        <p className="text-xs text-muted-foreground">{labels.description}</p>
      </div>

      {steps.map((step, idx) => {
        const isDone = completed.has(step.id);
        return (
          <div
            key={step.id}
            id={`panel-${step.id}`}
            className={cn(
              "scroll-mt-8 rounded-lg border border-border bg-card p-5",
              isDone && "border-primary/40 bg-primary/5",
            )}
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                {idx + 1}.
              </span>
              <h3 className="text-sm font-medium">{step.title}</h3>
              {isDone && (
                <span className="text-sm text-emerald-400">✓</span>
              )}
            </div>
            <p className="mb-4 text-xs text-muted-foreground">{step.desc}</p>

            {/* Step 1: 에디터 열기 커맨드 */}
            {"commands" in step && step.commands && (
              <div className="space-y-2">
                {step.commands.map((c) => (
                  <div key={c.label} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-24 shrink-0">
                      {c.label}
                    </span>
                    <code className="min-w-0 flex-1 truncate rounded border border-border bg-muted px-2 py-1.5 font-mono text-xs">
                      {c.cmd}
                    </code>
                    <CopyButton
                      text={c.cmd}
                      copyLabel={labels.copyButton}
                      copiedLabel={labels.copiedButton}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Step 2: AI 프롬프트 */}
            {"prompt" in step && step.prompt && (
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 rounded border border-border bg-muted px-3 py-2 text-xs italic text-muted-foreground">
                  &ldquo;{step.prompt}&rdquo;
                </div>
                <CopyButton
                  text={step.prompt}
                  copyLabel={labels.copyButton}
                  copiedLabel={labels.copiedButton}
                />
              </div>
            )}

            {/* Step 4: 사이트 열기 */}
            {"url" in step && step.url && (
              <a
                href={step.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2"
              >
                {labels.step4Cta} ↗
              </a>
            )}

            {/* 완료/취소 버튼 */}
            <div className="mt-4 flex items-center justify-end gap-2">
              {isDone && (
                <span className="text-xs text-emerald-400">{labels.doneLabel}</span>
              )}
              <Button
                size="sm"
                variant={isDone ? "outline" : "default"}
                onClick={() => handleToggle(step.id, !isDone)}
                disabled={loading === step.id}
              >
                {loading === step.id
                  ? "..."
                  : isDone
                    ? labels.undoButton
                    : labels.doneButton}
              </Button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
