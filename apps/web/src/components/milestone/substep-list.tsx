"use client";

/**
 * SubstepList — 마일스톤 상세 페이지의 서브스텝 리스트.
 *
 * Client Component. 체크박스는 읽기 전용 진행 표시이다. 완료 마킹은
 * 오른쪽의 개별 패널(CreateRepoPanel, GitPushPanel 등)에서 처리한다.
 */

import { useEffect, useState } from "react";
import type { SubstepKind } from "@vibestart/shared-types";

import { cn } from "@/lib/utils";
import { useOptionalCompletedSubsteps } from "./completed-substeps-context";

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
  /** @deprecated 사용하지 않음 — 완료 처리는 개별 패널에서 */
  onToggle?: (substepId: string, checked: boolean) => Promise<void>;
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
  const contextCompleted = useOptionalCompletedSubsteps();

  const [localCompleted, setLocalCompleted] = useState<ReadonlySet<string>>(
    () => new Set(initialCompletedIds),
  );

  const initialKey = initialCompletedIds.join("|");
  useEffect(() => {
    setLocalCompleted(new Set(initialCompletedIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

  const completed = contextCompleted ?? localCompleted;

  /** 사이드바 substep 클릭 → 해당 패널로 smooth scroll. */
  const scrollToPanel = (stepId: string): void => {
    const el = document.getElementById(`panel-${stepId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <ol className="space-y-2">
      {substeps.map((step) => {
        const isDone = completed.has(step.id);
        return (
          <li
            key={step.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card/50 p-3 transition-colors hover:border-primary/30",
              isDone && "bg-primary/5 border-primary/30",
            )}
            data-kind={step.kind}
            data-done={isDone}
            onClick={() => scrollToPanel(step.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scrollToPanel(step.id);
              }
            }}
          >
            {/* 읽기 전용 체크 표시 */}
            <span
              aria-label={isDone ? labels.checkLabel : ""}
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-border text-xs",
                isDone && "border-primary bg-primary text-primary-foreground",
              )}
            >
              {isDone ? "✓" : ""}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-sm">
                <span aria-hidden="true" className="text-base leading-none">
                  {KIND_ICON[step.kind]}
                </span>
                <span
                  className={cn(
                    "min-w-0 flex-1",
                    isDone && "text-muted-foreground line-through",
                  )}
                >
                  {step.title}
                </span>
              </div>
              {(step.estimatedLabel ||
                (step.kind === "auto" && !isDone) ||
                (step.kind === "user-action" && !isDone) ||
                (step.kind === "verify" && !isDone)) && (
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  {step.estimatedLabel !== null && (
                    <span className="text-[10px] text-muted-foreground">
                      {step.estimatedLabel}
                    </span>
                  )}
                  {step.kind === "auto" && !isDone && (
                    <span className="text-muted-foreground">
                      {labels.autoRunning}
                    </span>
                  )}
                  {step.kind === "user-action" && !isDone && (
                    <>
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
                    </>
                  )}
                  {step.kind === "verify" && !isDone && (
                    <span className="text-muted-foreground">
                      {labels.verifyCta}
                    </span>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
