"use client";

import type { ReactNode } from "react";
import { CompletedSubstepsProvider } from "./completed-substeps-context";

/**
 * M3 바이브코딩에서만 CompletedSubstepsProvider를 활성화.
 * 다른 마일스톤에서는 children을 그대로 렌더.
 */
export function MaybeCompletedSubstepsProvider({
  milestoneId,
  initialIds,
  children,
}: {
  milestoneId: string;
  initialIds: ReadonlyArray<string>;
  children: ReactNode;
}): ReactNode {
  if (milestoneId === "m3-vibe-coding") {
    return (
      <CompletedSubstepsProvider initialIds={initialIds}>
        {children}
      </CompletedSubstepsProvider>
    );
  }
  return <>{children}</>;
}
