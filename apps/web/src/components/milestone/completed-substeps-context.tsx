"use client";

/**
 * CompletedSubstepsContext — 마일스톤 페이지에서 VibeCodingPanel과
 * SubstepList가 완료 상태를 공유하기 위한 context.
 *
 * 낙관적 업데이트: 버튼 클릭 즉시 UI 반영, 서버 저장은 비동기.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface CompletedSubstepsContextValue {
  completed: ReadonlySet<string>;
  toggle: (substepId: string, checked: boolean) => void;
}

const Ctx = createContext<CompletedSubstepsContextValue | null>(null);

export function CompletedSubstepsProvider({
  initialIds,
  children,
}: {
  initialIds: ReadonlyArray<string>;
  children: ReactNode;
}): ReactNode {
  const [completed, setCompleted] = useState<ReadonlySet<string>>(
    () => new Set(initialIds),
  );

  const toggle = useCallback((substepId: string, checked: boolean) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (checked) next.add(substepId);
      else next.delete(substepId);
      return next;
    });
  }, []);

  return (
    <Ctx.Provider value={{ completed, toggle }}>{children}</Ctx.Provider>
  );
}

export function useCompletedSubsteps(): CompletedSubstepsContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useCompletedSubsteps must be used within CompletedSubstepsProvider");
  }
  return ctx;
}

/**
 * context가 없으면 null 반환 (M1/M2 호환).
 * SubstepList에서 사용.
 */
export function useOptionalCompletedSubsteps(): ReadonlySet<string> | null {
  const ctx = useContext(Ctx);
  return ctx?.completed ?? null;
}
