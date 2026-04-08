/**
 * TrackBadge — 트랙 식별용 작은 뱃지.
 *
 * 트랙마다 고정 색상 토큰을 가지며 i18n 트랙명을 표시한다. 기존 Phase 1의
 * 브랜드 퍼플과는 독립적인 트랙 식별용 색상 팔레트.
 *
 * Server Component — getTranslations로 메시지를 서버에서 해결하므로
 * 클라이언트 번들이 늘어나지 않는다.
 */

import { getTranslations } from "next-intl/server";
import type { ProjectTrack, TrackColorToken } from "@vibestart/shared-types";

import { cn } from "@/lib/utils";

export interface TrackBadgeProps {
  track: ProjectTrack;
  color: TrackColorToken;
  size?: "sm" | "md";
  className?: string;
}

const COLOR_CLASS: Record<TrackColorToken, string> = {
  blue: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  orange: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

export async function TrackBadge({
  track,
  color,
  size = "md",
  className,
}: TrackBadgeProps): Promise<React.ReactNode> {
  const t = await getTranslations("Tracks");
  const name = t(`${track}.name`);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        size === "sm" && "px-2 py-0 text-[10px]",
        COLOR_CLASS[color],
        className,
      )}
      data-track={track}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block size-1.5 rounded-full",
          color === "blue" && "bg-sky-400",
          color === "green" && "bg-emerald-400",
          color === "purple" && "bg-purple-400",
          color === "orange" && "bg-amber-400",
        )}
      />
      {name}
    </span>
  );
}
