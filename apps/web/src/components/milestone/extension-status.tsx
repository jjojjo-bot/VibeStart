/**
 * ExtensionStatus — VS Code Extension 연결 상태 표시.
 *
 * Phase 2a에서는 더미 props만 받아 시각적 상태만 그린다. 실제 WebSocket
 * 연결 검사와 폴링은 후속 작업에서 Client island로 분리해 추가한다.
 *
 * Server Component — 현재는 props만 읽는 순수 프레젠테이션.
 */

import { getTranslations } from "next-intl/server";

import { cn } from "@/lib/utils";

export type ExtensionConnectionState =
  | "connected"
  | "disconnected"
  | "pairing"
  | "unknown";

export interface ExtensionStatusProps {
  state: ExtensionConnectionState;
  /** state === 'pairing'일 때만 사용자에게 표시할 6자리 코드 */
  pairingCode?: string;
  className?: string;
}

const DOT_CLASS: Record<ExtensionConnectionState, string> = {
  connected: "bg-emerald-500",
  disconnected: "bg-zinc-500",
  pairing: "bg-amber-500 animate-pulse",
  unknown: "bg-zinc-600",
};

export async function ExtensionStatus({
  state,
  pairingCode,
  className,
}: ExtensionStatusProps): Promise<React.ReactNode> {
  const t = await getTranslations("ExtensionStatus");

  const label =
    state === "pairing" && pairingCode
      ? t("pairing", { code: pairingCode })
      : t(state);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs text-muted-foreground",
        className,
      )}
      data-state={state}
    >
      <span
        aria-hidden="true"
        className={cn("inline-block size-1.5 rounded-full", DOT_CLASS[state])}
      />
      <span>{label}</span>
    </div>
  );
}
