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

export interface VibeCodingPromptCategory {
  /** Stable id for category — used as React key + 'selected' state. */
  id: "text" | "color" | "section" | "visual" | "font";
  /** Locale-agnostic emoji shown in the chip. */
  emoji: string;
  /** Localized short label shown next to emoji. */
  label: string;
  /** Localized prompt body shown below + copied. */
  prompt: string;
}

export interface VibeCodingEditorTool {
  /** Stable id — Cursor or Claude Code. */
  id: "claudeCode" | "cursor";
  /** Locale-agnostic display label (brand name kept in English). */
  label: string;
  /** OS별 단일 체인 명령어 — `{project}` placeholder가 프로젝트명으로 치환된다. */
  macCmd: string;
  winCmd: string;
  /** 한 줄 설명 — 명령어 아래에 표시. */
  note: string;
}

export interface VibeCodingPanelLabels {
  title: string;
  description: string;
  /** Step 1 */
  step1Title: string;
  step1Desc: string;
  /** AI 에디터 선택지 — Cursor / Claude Code 두 가지. 사용자가 picker로 선택. */
  step1Tools: ReadonlyArray<VibeCodingEditorTool>;
  /** Step 2 */
  step2Title: string;
  step2Desc: string;
  /** 5 prompt categories — user picks one to copy. */
  step2Categories: ReadonlyArray<VibeCodingPromptCategory>;
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
  /** Step 4 자동 검증 — Vercel API로 최근 배포 상태 확인 */
  step4Verify: {
    button: string;
    checking: string;
    /** {minutes} placeholder가 minutes 값으로 치환된다 */
    successFresh: string;
    successStale: string;
    /** {seconds} placeholder */
    building: string;
    errorBuild: string;
    errorNoToken: string;
    errorNoProject: string;
    errorNoDeploy: string;
    errorGeneric: string;
  };
  /** Troubleshoot — 막혔을 때 자주 발생하는 3가지 케이스. */
  troubleshoot: {
    title: string;
    intro: string;
    items: ReadonlyArray<VibeCodingTroubleshootItem>;
  };
}

/** verify action 결과 — Server Action에서 반환 */
export type VibeDeployVerifyResult =
  | {
      ok: true;
      createdAt: number;
      ageSeconds: number;
      readyState: string;
      url: string;
    }
  | { ok: false; reason: "no_token" | "no_project" | "no_deployment" | "error" };

export interface VibeCodingTroubleshootItem {
  id: "gitConflict" | "aiNoResponse" | "deployFailed";
  title: string;
  symptom: string;
  /** 한 줄 해결책 — git 명령어가 들어가면 monospace로 표시. */
  fix: string;
  /** "git " 또는 "npm " 같은 명령어로 시작하면 별도 코드 블록 + 복사 버튼 표시. */
  linkLabel: string;
  linkUrl: string;
}

export interface VibeCodingPanelProps {
  projectName: string;
  os: "macos" | "windows" | null;
  deployedUrl: string | null;
  completedSteps: ReadonlyArray<string>;
  labels: VibeCodingPanelLabels;
  onComplete: (substepId: string, checked: boolean) => Promise<void>;
  /** Step 4 자동 검증 액션 — 클릭 시 호출. */
  onVerifyDeploy: () => Promise<VibeDeployVerifyResult>;
}

function DeployVerifyButton({
  labels,
  onVerify,
}: {
  labels: VibeCodingPanelLabels["step4Verify"];
  onVerify: () => Promise<VibeDeployVerifyResult>;
}): React.ReactNode {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VibeDeployVerifyResult | null>(null);

  const handleClick = async (): Promise<void> => {
    setLoading(true);
    try {
      const r = await onVerify();
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const message = ((): { text: string; tone: "success" | "warn" | "error" } | null => {
    if (!result) return null;
    if (result.ok) {
      const minutes = Math.floor(result.ageSeconds / 60);
      const seconds = result.ageSeconds;
      if (result.readyState === "READY") {
        if (result.ageSeconds < 1800) {
          return {
            text: labels.successFresh.replace("{minutes}", String(minutes)),
            tone: "success",
          };
        }
        return {
          text: labels.successStale.replace("{minutes}", String(minutes)),
          tone: "warn",
        };
      }
      if (result.readyState === "BUILDING" || result.readyState === "QUEUED") {
        return {
          text: labels.building.replace("{seconds}", String(seconds)),
          tone: "warn",
        };
      }
      if (result.readyState === "ERROR") {
        return { text: labels.errorBuild, tone: "error" };
      }
      return { text: result.readyState, tone: "warn" };
    }
    const reasonMap: Record<typeof result.reason, string> = {
      no_token: labels.errorNoToken,
      no_project: labels.errorNoProject,
      no_deployment: labels.errorNoDeploy,
      error: labels.errorGeneric,
    };
    return { text: reasonMap[result.reason], tone: "error" };
  })();

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleClick}
        disabled={loading}
      >
        {loading ? labels.checking : labels.button}
      </Button>
      {message && (
        <p
          className={cn(
            "text-xs",
            message.tone === "success" && "text-emerald-400",
            message.tone === "warn" && "text-amber-400",
            message.tone === "error" && "text-red-400",
          )}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}

function TroubleshootSection({
  labels,
  copyLabel,
  copiedLabel,
}: {
  labels: VibeCodingPanelLabels["troubleshoot"];
  copyLabel: string;
  copiedLabel: string;
}): React.ReactNode {
  return (
    <details className="rounded-lg border border-border bg-card">
      <summary className="cursor-pointer list-none px-5 py-3 text-sm font-medium">
        {labels.title}
        <span className="ml-2 text-xs text-muted-foreground">
          {labels.intro}
        </span>
      </summary>
      <div className="space-y-3 border-t border-border/40 px-5 py-4">
        {labels.items.map((item) => {
          const isCommand = /^(git |npm |pnpm |code |claude |cursor |open |cd )/.test(
            item.fix,
          );
          return (
            <div
              key={item.id}
              className="rounded border border-border/60 bg-muted/30 p-3"
            >
              <h4 className="mb-1 text-sm font-medium">{item.title}</h4>
              <p className="mb-2 text-xs text-muted-foreground">{item.symptom}</p>
              {isCommand ? (
                <div className="mb-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded border border-border bg-background px-2 py-1.5 font-mono text-xs">
                    {item.fix}
                  </code>
                  <CopyButton
                    text={item.fix}
                    copyLabel={copyLabel}
                    copiedLabel={copiedLabel}
                  />
                </div>
              ) : (
                <p className="mb-2 text-xs">{item.fix}</p>
              )}
              <a
                href={item.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-primary underline underline-offset-2"
              >
                {item.linkLabel} ↗
              </a>
            </div>
          );
        })}
      </div>
    </details>
  );
}

function EditorToolPicker({
  tools,
  os,
  copyLabel,
  copiedLabel,
}: {
  tools: ReadonlyArray<VibeCodingEditorTool>;
  os: "macos" | "windows" | null;
  copyLabel: string;
  copiedLabel: string;
}): React.ReactNode {
  const [selectedId, setSelectedId] = useState<VibeCodingEditorTool["id"]>(
    tools[0]?.id ?? "claudeCode",
  );
  const selected = tools.find((t) => t.id === selectedId) ?? tools[0];

  if (!selected) return null;

  const rows: ReadonlyArray<{ osLabel: string; cmd: string }> = [
    ...(os !== "windows"
      ? [{ osLabel: "macOS", cmd: selected.macCmd }]
      : []),
    ...(os !== "macos"
      ? [{ osLabel: "Windows", cmd: selected.winCmd }]
      : []),
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {tools.map((tool) => {
          const isSelected = tool.id === selectedId;
          return (
            <button
              key={tool.id}
              type="button"
              onClick={() => setSelectedId(tool.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                isSelected
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground",
              )}
            >
              {tool.label}
            </button>
          );
        })}
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.osLabel} className="flex items-center gap-2">
            <span className="w-24 shrink-0 text-xs text-muted-foreground">
              {row.osLabel}
            </span>
            <code className="min-w-0 flex-1 truncate rounded border border-border bg-muted px-2 py-1.5 font-mono text-xs">
              {row.cmd}
            </code>
            <CopyButton
              text={row.cmd}
              copyLabel={copyLabel}
              copiedLabel={copiedLabel}
            />
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{selected.note}</p>
    </div>
  );
}

function PromptCategoryPicker({
  categories,
  copyLabel,
  copiedLabel,
}: {
  categories: ReadonlyArray<VibeCodingPromptCategory>;
  copyLabel: string;
  copiedLabel: string;
}): React.ReactNode {
  const [selectedId, setSelectedId] = useState<VibeCodingPromptCategory["id"]>(
    categories[0]?.id ?? "text",
  );
  const selected = categories.find((c) => c.id === selectedId) ?? categories[0];

  if (!selected) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isSelected = cat.id === selectedId;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedId(cat.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                isSelected
                  ? "border-primary/60 bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground",
              )}
            >
              <span aria-hidden>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 rounded border border-border bg-muted px-3 py-2 text-xs italic text-muted-foreground">
          &ldquo;{selected.prompt}&rdquo;
        </div>
        <CopyButton
          text={selected.prompt}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
        />
      </div>
    </div>
  );
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
  onVerifyDeploy,
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
      tools: labels.step1Tools.map((tool) => ({
        ...tool,
        macCmd: tool.macCmd.replace("{project}", projectName),
        winCmd: tool.winCmd.replace("{project}", projectName),
      })),
    },
    {
      id: "m3-s2-first-ai-edit",
      title: labels.step2Title,
      desc: labels.step2Desc,
      categories: labels.step2Categories,
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

      {/* 막혔을 때 — 4단계 위에 collapsible 패널로 노출 (디폴트 닫힘) */}
      <TroubleshootSection
        labels={labels.troubleshoot}
        copyLabel={labels.copyButton}
        copiedLabel={labels.copiedButton}
      />

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

            {/* Step 1: AI 에디터 선택 + 명령어 */}
            {"tools" in step && step.tools && (
              <EditorToolPicker
                tools={step.tools}
                os={os}
                copyLabel={labels.copyButton}
                copiedLabel={labels.copiedButton}
              />
            )}

            {/* Step 2: 카테고리 선택 + AI 프롬프트 */}
            {"categories" in step && step.categories && (
              <PromptCategoryPicker
                categories={step.categories}
                copyLabel={labels.copyButton}
                copiedLabel={labels.copiedButton}
              />
            )}

            {/* Step 3: 단일 git push 프롬프트 (호환 유지) */}
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

            {/* Step 4: 사이트 열기 + 자동 검증 */}
            {"url" in step && (
              <div className="space-y-3">
                {step.url && (
                  <a
                    href={step.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2"
                  >
                    {labels.step4Cta} ↗
                  </a>
                )}
                <DeployVerifyButton
                  labels={labels.step4Verify}
                  onVerify={onVerifyDeploy}
                />
              </div>
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
