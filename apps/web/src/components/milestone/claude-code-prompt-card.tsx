"use client";

/**
 * ClaudeCodePromptCard — 비전공자 친화적인 "Claude Code에 보낼 메시지" 카드.
 *
 * VibeStart가 결정론으로 끝낸 작업(파일 추가/의존성 추가) 다음에, LLM에게
 * 위임할 작업(사용자 코드 머지)을 자연어 프롬프트로 안내한다. Phase 1↔M3와
 * 동일한 멘탈 모델 — VibeStart는 안전한 부분만, 코드 머지는 Claude Code.
 *
 * 카드 구조:
 *   - 헤딩 + 부제
 *   - 모노스페이스 박스에 프롬프트 본문 (좌상단 "다음 단계" 라벨)
 *   - 우상단 복사 버튼 (눌리면 ✓ 토스트 2초)
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";

export interface ClaudeCodePromptCardLabels {
  heading: string;
  subheading: string;
  badge: string;
  copy: string;
  copied: string;
}

export interface ClaudeCodePromptCardProps {
  prompt: string;
  labels: ClaudeCodePromptCardLabels;
}

export function ClaudeCodePromptCard({
  prompt,
  labels,
}: ClaudeCodePromptCardProps): React.ReactNode {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard 접근 실패 무시 */
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
          {labels.badge}
        </span>
        <h3 className="text-sm font-semibold">{labels.heading}</h3>
      </div>
      <p className="mb-3 text-xs text-muted-foreground">{labels.subheading}</p>

      <div className="relative rounded-md border border-border bg-background/60 p-4 pr-3 pt-3">
        <div className="absolute right-3 top-3">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={handleCopy}
            className="h-7 px-3 text-xs"
          >
            {copied ? `✓ ${labels.copied}` : labels.copy}
          </Button>
        </div>
        <pre className="mt-7 whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground">
          {prompt}
        </pre>
      </div>
    </div>
  );
}
