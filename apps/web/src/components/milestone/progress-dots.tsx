/**
 * ProgressDots — 마일스톤 진행도 점 표시.
 *
 * 정적 트랙의 5개 마일스톤(M1~M5)을 점 5개로 표현. 완료된 점은 채워지고,
 * 활성 점은 ring 효과, 남은 점은 비어있다.
 *
 * Server Component — 순수 시각 요소. 접근성을 위해 role + aria-label 제공.
 */

import { cn } from "@/lib/utils";

export interface ProgressDotsProps {
  total: number;
  /** 완료된 점 개수 (0 ≤ completedCount ≤ total) */
  completedCount: number;
  /** 활성(진행 중) 점의 0-based 인덱스. 없으면 -1 */
  activeIndex: number;
  ariaLabel: string;
  className?: string;
}

export function ProgressDots({
  total,
  completedCount,
  activeIndex,
  ariaLabel,
  className,
}: ProgressDotsProps): React.ReactNode {
  const dots = Array.from({ length: total }, (_, i) => i);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completedCount}
      aria-label={ariaLabel}
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      {dots.map((i) => {
        const isCompleted = i < completedCount;
        const isActive = i === activeIndex;
        return (
          <span
            key={i}
            aria-hidden="true"
            className={cn(
              "size-2 rounded-full transition-colors",
              isCompleted && "bg-primary",
              !isCompleted && !isActive && "bg-border",
              isActive &&
                "bg-primary/40 ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
          />
        );
      })}
    </div>
  );
}
