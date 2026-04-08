/**
 * MilestoneCard — 마일스톤 트리의 단일 카드.
 *
 * 상태(locked/in_progress/completed/failed)에 따라 시각적 단서가 달라지며,
 * locked가 아닐 때만 상세 페이지로의 Link가 활성화된다. locale-aware 이동은
 * 호출자가 next-intl Link로 감싸 처리한다 (이 컴포넌트는 href 문자열만 받음).
 *
 * variant:
 *   - tree-node: 트리 내 세로 노드 (마일스톤 번호, 제목, 상태 아이콘)
 *   - summary: 요약 카드 (대시보드/완료 화면용)
 *
 * Server Component — 모든 텍스트는 호출자가 t()로 해석해 props로 전달.
 */

import type {
  MilestoneDefinition,
  MilestoneState,
} from "@vibestart/shared-types";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export type MilestoneCardVariant = "tree-node" | "summary";

export interface MilestoneCardProps {
  milestone: MilestoneDefinition;
  state: MilestoneState;
  variant: MilestoneCardVariant;
  /** "M1/5" 같은 진행 인덱스 표시 문자열 */
  indexLabel: string;
  /** i18n 해석 완료된 제목 */
  title: string;
  /** i18n 해석 완료된 결과물 문구 */
  outcome: string;
  /** i18n 해석 완료된 잠금 힌트 (state === "locked"일 때만 사용) */
  lockedHint: string;
  /** 상세 페이지 pathname (locale 없음) */
  href: string;
  className?: string;
}

const STATE_ICON: Record<MilestoneState, string> = {
  locked: "🔒",
  in_progress: "⏳",
  completed: "✅",
  failed: "❌",
};

const STATE_BORDER: Record<MilestoneState, string> = {
  locked: "border-border opacity-60",
  in_progress: "border-primary/50 bg-primary/5",
  completed: "border-emerald-500/40 bg-emerald-500/5",
  failed: "border-destructive/40 bg-destructive/5",
};

export function MilestoneCard({
  milestone,
  state,
  variant,
  indexLabel,
  title,
  outcome,
  lockedHint,
  href,
  className,
}: MilestoneCardProps): React.ReactNode {
  const locked = state === "locked";

  const inner = (
    <article
      className={cn(
        "flex items-start gap-4 rounded-lg border p-4 transition-colors",
        STATE_BORDER[state],
        !locked && "hover:border-primary/60",
        variant === "summary" && "flex-col items-stretch gap-2",
        className,
      )}
      data-state={state}
      data-variant={variant}
      aria-disabled={locked}
    >
      {/* 좌측: 번호 + 상태 아이콘 */}
      <div
        className={cn(
          "flex shrink-0 flex-col items-center gap-1",
          variant === "summary" && "flex-row items-baseline",
        )}
      >
        <div className="text-xs font-mono text-muted-foreground">
          {indexLabel}
        </div>
        <div
          aria-hidden="true"
          className="text-lg leading-none"
          title={state}
        >
          {STATE_ICON[state]}
        </div>
      </div>

      {/* 본문 */}
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{outcome}</p>
        {locked && (
          <p className="mt-2 text-xs text-muted-foreground/80">{lockedHint}</p>
        )}
      </div>
    </article>
  );

  if (locked) {
    return inner;
  }

  return (
    <Link href={href} className="block no-underline">
      {inner}
    </Link>
  );
}
