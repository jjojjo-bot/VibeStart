"use client";

/**
 * MilestoneCelebration — 마일스톤 전체 완료 시 축하 화면.
 *
 * canvas-confetti로 폭죽 발사 + 축하 메시지 + CTA 버튼.
 * Phase 1 setup 페이지의 confetti 패턴 재사용.
 */

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

import { Button } from "@/components/ui/button";

export interface MilestoneCelebrationLabels {
  title: string;
  description: string;
  ctaLabel: string;
}

export interface MilestoneCelebrationProps {
  completed: boolean;
  deployedUrl: string | null;
  dashboardUrl: string;
  labels: MilestoneCelebrationLabels;
}

export function MilestoneCelebration({
  completed,
  deployedUrl,
  dashboardUrl,
  labels,
}: MilestoneCelebrationProps): React.ReactNode {
  const hasFired = useRef(false);

  useEffect(() => {
    if (completed && !hasFired.current) {
      hasFired.current = true;
      const end = Date.now() + 1500;
      const frame = (): void => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: [
            "#7c3aed",
            "#22c55e",
            "#3b82f6",
            "#f59e0b",
            "#ef4444",
            "#fbbf24",
          ],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: [
            "#7c3aed",
            "#22c55e",
            "#3b82f6",
            "#f59e0b",
            "#ef4444",
            "#fbbf24",
          ],
        });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
    }
    if (!completed) hasFired.current = false;
  }, [completed]);

  if (!completed) return null;

  return (
    <section className="mt-8 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
      <h2 className="text-2xl font-bold text-emerald-400">{labels.title}</h2>
      <p className="mt-3 text-sm text-muted-foreground">{labels.description}</p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {deployedUrl && (
          <a href={deployedUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm">
              내 사이트 열기 ↗
            </Button>
          </a>
        )}
        <a href={dashboardUrl}>
          <Button size="sm">{labels.ctaLabel}</Button>
        </a>
      </div>
    </section>
  );
}
