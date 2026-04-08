"use client";

/**
 * SubstepList — 마일스톤 상세 페이지의 서브스텝 리스트.
 *
 * Client Component. 체크박스 토글과 optimistic UI를 담당한다. Phase 2a는
 * 완료 반영이 클라이언트 useState로만 작동하며, 서버 저장은 후속 PR에서
 * Server Action으로 교체된다.
 *
 * Server Component에서 function props(예: 포맷터)를 넘길 수 없으므로,
 * 호출자가 미리 해석한 제목과 예상 시간 문자열을 DisplaySubstep에 담아
 * 전달해야 한다. 국제화 해석은 전부 서버에서 완료된다.
 */

import { useState, useTransition } from "react";
import type { SubstepKind } from "@vibestart/shared-types";

import { cn } from "@/lib/utils";

export interface DisplaySubstep {
  id: string;
  kind: SubstepKind;
  /** 서버에서 해석 완료된 제목 */
  title: string;
  externalUrl: string | null;
  /** 서버에서 해석 완료된 예상 시간 레이블 ("약 30초") 또는 null */
  estimatedLabel: string | null;
}

export interface SubstepListLabels {
  checkLabel: string;
  autoRunning: string;
  userActionRequired: string;
  openExternal: string;
  verifyCta: string;
}

export interface SubstepListProps {
  substeps: ReadonlyArray<DisplaySubstep>;
  initialCompletedIds: ReadonlyArray<string>;
  labels: SubstepListLabels;
}

const KIND_ICON: Record<SubstepKind, string> = {
  oauth: "🔐",
  auto: "⚙️",
  "user-action": "👤",
  verify: "✅",
  "copy-paste": "📋",
};

export function SubstepList({
  substeps,
  initialCompletedIds,
  labels,
}: SubstepListProps): React.ReactNode {
  const [completed, setCompleted] = useState<ReadonlySet<string>>(
    () => new Set(initialCompletedIds),
  );
  const [, startTransition] = useTransition();

  const toggle = (id: string): void => {
    startTransition(() => {
      setCompleted((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    });
  };

  return (
    <ol className="space-y-2">
      {substeps.map((step) => {
        const isDone = completed.has(step.id);
        return (
          <li
            key={step.id}
            className={cn(
              "flex items-start gap-3 rounded-md border border-border bg-card/50 p-3 transition-colors",
              isDone && "bg-primary/5 border-primary/30",
            )}
            data-kind={step.kind}
            data-done={isDone}
          >
            <button
              type="button"
              onClick={() => toggle(step.id)}
              aria-label={labels.checkLabel}
              aria-pressed={isDone}
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-border text-xs transition-colors",
                isDone && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {isDone ? "✓" : ""}
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 text-sm">
                  <span aria-hidden="true" className="text-base leading-none">
                    {KIND_ICON[step.kind]}
                  </span>
                  <span
                    className={cn(
                      isDone && "text-muted-foreground line-through",
                    )}
                  >
                    {step.title}
                  </span>
                </div>
                {step.estimatedLabel !== null && (
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {step.estimatedLabel}
                  </span>
                )}
              </div>
              {step.kind === "auto" && !isDone && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {labels.autoRunning}
                </p>
              )}
              {step.kind === "user-action" && !isDone && (
                <div className="mt-1 flex items-center gap-2 text-xs">
                  <span className="text-amber-400">
                    {labels.userActionRequired}
                  </span>
                  {step.externalUrl && (
                    <a
                      href={step.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2"
                    >
                      {labels.openExternal} ↗
                    </a>
                  )}
                </div>
              )}
              {step.kind === "verify" && !isDone && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {labels.verifyCta}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
