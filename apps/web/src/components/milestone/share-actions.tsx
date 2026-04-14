"use client";

/**
 * ShareActions — 배포 완료 사용자의 자랑 액션 버튼 클러스터.
 *
 * 구성: [복사] [공유(Web Share API)] [X 공유] [QR 코드 보기]
 *
 * - 복사: navigator.clipboard
 * - 공유: Web Share API 지원 시 네이티브 picker (카카오톡/라인/메시지 등 자동 포함).
 *         미지원 환경에서는 자동 숨김.
 * - X: 트윗 인텐트 URL 새 탭
 * - QR: inline 확장 패널 (외부 이미지 API: api.qrserver.com)
 */

import { useCallback, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

// Web Share API 지원 여부를 SSR-safe하게 읽는다. 서버/하이드레이션에선 false,
// 하이드레이션 직후 클라이언트 값으로 전환된다. useEffect + setState 패턴은
// react-hooks/set-state-in-effect 규칙에 걸리므로 useSyncExternalStore 사용.
const subscribeNoop = (): (() => void) => () => {};
const getNativeShareSnapshot = (): boolean =>
  typeof navigator !== "undefined" && typeof navigator.share === "function";
const getNativeShareServerSnapshot = (): boolean => false;

export interface ShareActionsLabels {
  shareText: string;
  copy: string;
  copied: string;
  share: string;
  shareOnX: string;
  qr: string;
  qrDescription: string;
}

export interface ShareActionsProps {
  url: string;
  labels: ShareActionsLabels;
}

export function ShareActions({ url, labels }: ShareActionsProps): React.ReactNode {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const canNativeShare = useSyncExternalStore(
    subscribeNoop,
    getNativeShareSnapshot,
    getNativeShareServerSnapshot,
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard 접근 실패 무시 — 대부분 HTTPS + 사용자 제스처에서 작동 */
    }
  }, [url]);

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({ text: labels.shareText, url });
    } catch {
      /* 사용자 취소 또는 미지원 — 그냥 무시 */
    }
  }, [url, labels.shareText]);

  const xIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    labels.shareText,
  )}&url=${encodeURIComponent(url)}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    url,
  )}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={handleCopy}
          className="min-w-[110px]"
        >
          {copied ? `✓ ${labels.copied}` : labels.copy}
        </Button>

        {canNativeShare && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleNativeShare}
          >
            {labels.share}
          </Button>
        )}

        <a href={xIntentUrl} target="_blank" rel="noopener noreferrer">
          <Button type="button" variant="secondary" size="sm">
            {labels.shareOnX}
          </Button>
        </a>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setShowQr((v) => !v)}
          aria-expanded={showQr}
        >
          {labels.qr}
        </Button>
      </div>

      {showQr && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrImageUrl}
            alt={labels.qr}
            width={220}
            height={220}
            className="rounded-md bg-white p-1"
          />
          <p className="max-w-[240px] text-center text-xs text-muted-foreground">
            {labels.qrDescription}
          </p>
        </div>
      )}
    </div>
  );
}
