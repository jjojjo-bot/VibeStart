"use client";

/**
 * SitePreviewFrame — 사용자가 방금 배포한 사이트를 16:9 iframe으로 즉시 렌더.
 *
 * 브라우저 크롬(traffic lights + URL bar)을 흉내내서 "내 사이트"라는
 * 시각 임팩트를 강화한다. iframe load timeout(8초) 안에 응답 없으면
 * fallback(URL 배지 + "새 탭으로 열기") 표시. X-Frame-Options나 CSP로
 * 임베드가 거부되는 경우에도 동일하게 fallback 된다.
 */

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export interface SitePreviewFrameProps {
  url: string;
  title?: string;
  className?: string;
}

export function SitePreviewFrame({
  url,
  title,
  className,
}: SitePreviewFrameProps): React.ReactNode {
  const [state, setState] = useState<"loading" | "loaded" | "failed">(
    "loading",
  );
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timeoutRef.current = setTimeout(() => {
      setState((s) => (s === "loading" ? "failed" : s));
    }, 8000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [url]);

  const displayUrl = url.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card shadow-xl",
        className,
      )}
    >
      {/* 브라우저 크롬 */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="block h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="block h-2.5 w-2.5 rounded-full bg-amber-500/70" />
          <span className="block h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
        </div>
        <div className="mx-auto max-w-[70%] truncate rounded-md bg-background/80 px-3 py-1 font-mono text-[11px] text-muted-foreground">
          {displayUrl}
        </div>
        <div className="w-12" />
      </div>

      {/* 뷰포트 */}
      <div className="relative aspect-video w-full bg-background">
        {state !== "failed" && (
          <iframe
            src={url}
            title={title ?? displayUrl}
            className="absolute inset-0 h-full w-full border-0"
            loading="lazy"
            onLoad={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              setState("loaded");
            }}
            onError={() => setState("failed")}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            referrerPolicy="no-referrer"
          />
        )}
        {state === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <div className="flex flex-col items-center gap-3 text-xs text-muted-foreground">
              <div className="size-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              <span>로딩 중…</span>
            </div>
          </div>
        )}
        {state === "failed" && (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-3 text-center text-sm"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 font-mono text-xs text-emerald-300">
                <span className="size-2 rounded-full bg-emerald-400" />
                {displayUrl}
              </div>
              <span className="text-muted-foreground underline-offset-4 hover:underline">
                새 탭에서 열기 ↗
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
