/**
 * TrackChangeDropdown — 프로젝트의 Phase 2 트랙을 변경하는 드롭다운.
 *
 * 대시보드에서 각 프로젝트 카드에 렌더된다. 기존 네이티브 `<details>` 방식은
 * 일부 환경에서 토글이 동작하지 않는 보고가 있어 명시적인 `useState` 기반
 * 클라이언트 컴포넌트로 교체. 바깥 클릭 시 자동 닫힘, 제출은 Server Action
 * (updateProjectTrackAction)으로 전달된다.
 *
 * 서버 렌더된 TrackBadge를 children/prop으로 받아 client 컴포넌트에서 그대로
 * 꽂아준다 (Server Component composition 패턴).
 */

"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import type { ProjectTrack } from "@vibestart/shared-types";

export interface TrackOption {
  id: ProjectTrack;
  badge: ReactNode;
  isCurrent: boolean;
}

export interface TrackChangeDropdownLabels {
  change: string;
  title: string;
  subtitle: string;
  cta: string;
  saving: string;
}

export interface TrackChangeDropdownProps {
  projectId: string;
  currentBadge: ReactNode;
  options: TrackOption[];
  labels: TrackChangeDropdownLabels;
  /** 서버에서 전달된 Server Action. 직접 호출 가능. */
  action: (formData: FormData) => Promise<void> | void;
}

export function TrackChangeDropdown({
  projectId,
  currentBadge,
  options,
  labels,
  action,
}: TrackChangeDropdownProps): React.ReactNode {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent): void {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /**
   * Server Action을 startTransition으로 감싼다.
   *   - action 완료 대기 동안 isPending=true → 버튼 비활성/라벨 교체
   *   - 완료 후 setOpen(false)로 드롭다운 명시적으로 닫음. Server Action이
   *     revalidatePath만 수행하는 경우 useState의 open이 살아있어 드롭다운이
   *     열린 채 남는 문제를 해결.
   */
  const formAction = (formData: FormData): void => {
    startTransition(async () => {
      await action(formData);
      setOpen(false);
    });
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md p-1 hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {currentBadge}
        <span className="text-[10px] text-muted-foreground">
          {labels.change} ▾
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-lg border border-border bg-card p-3 shadow-xl">
          <p className="mb-1 text-xs font-medium text-foreground">
            {labels.title}
          </p>
          <p className="mb-3 text-[11px] leading-relaxed text-muted-foreground">
            {labels.subtitle}
          </p>
          <form action={formAction} className="flex flex-col gap-2">
            <input type="hidden" name="projectId" value={projectId} />
            <fieldset disabled={isPending} className="flex flex-col gap-2">
              {options.map((o) => (
                <label
                  key={o.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/40 p-2 hover:border-primary/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="trackId"
                    value={o.id}
                    defaultChecked={o.isCurrent}
                    required
                    className="h-3 w-3"
                  />
                  {o.badge}
                </label>
              ))}
            </fieldset>
            <button
              type="submit"
              disabled={isPending}
              className="mt-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? labels.saving : labels.cta}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
