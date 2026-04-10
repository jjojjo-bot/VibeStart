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

import { useEffect, useState, useTransition } from "react";
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

  // 서버 액션이 substep을 완료 처리하고 revalidate한 뒤 페이지가 다시
  // 렌더되면 새 initialCompletedIds가 props로 들어온다. useState는 lazy
  // 초기화라 props 변경을 알아채지 못하므로, 서버가 새 스냅샷을 줄 때마다
  // 동기화한다. 사용자의 로컬 토글은 서버 스냅샷이 그것을 포함하지 않으면
  // 다음 갱신 때 덮여쓰지지만, Phase 2a에서는 manual toggle이 임시 UX이므로
  // 의도된 동작.
  const initialKey = initialCompletedIds.join("|");
  useEffect(() => {
    setCompleted(new Set(initialCompletedIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);

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
              {/* 1줄: emoji + title (전체 너비 사용) */}
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
              {/* 2줄: 메타 정보 (예상시간 + 보조 메시지) */}
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
