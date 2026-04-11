"use client";

/**
 * VibeLoading — 바이브코딩 팁을 보여주는 로딩 스피너.
 *
 * 매 렌더마다 랜덤 팁을 선택해 표시. 2.5초마다 팁이 바뀜.
 */

import { useEffect, useState } from "react";

const TIPS = [
  { emoji: "🎯", text: 'AI에게 "이거 고쳐줘"라고 말해보세요' },
  { emoji: "🚀", text: "git push만 하면 사이트가 자동으로 배포돼요" },
  { emoji: "💡", text: "구체적으로 설명할수록 AI가 더 잘 만들어요" },
  { emoji: "🎨", text: '"배경색을 파란색으로 바꿔줘" 이렇게 시작해보세요' },
  { emoji: "✨", text: "AI가 만든 코드도 완벽하진 않아요. 같이 고쳐나가면 돼요" },
  { emoji: "🔄", text: "마음에 안 들면 AI에게 다시 시키면 돼요" },
  { emoji: "📱", text: "반응형 디자인도 AI에게 맡겨보세요" },
  { emoji: "🌍", text: "내가 만든 사이트를 전 세계 사람이 볼 수 있어요" },
  { emoji: "🛠️", text: "에러가 나면 에러 메시지를 AI에게 보여주세요" },
  { emoji: "⚡", text: "바이브코딩은 완벽한 코드가 아니라 동작하는 결과가 목표예요" },
  { emoji: "🎪", text: "한 번에 큰 변경보다 작은 변경을 여러 번 하는 게 좋아요" },
  { emoji: "🧪", text: "수정 후 바로 확인! push → 배포 → 사이트 열기" },
];

export function VibeLoading(): React.ReactNode {
  const [tipIndex, setTipIndex] = useState(() =>
    Math.floor(Math.random() * TIPS.length),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => {
        let next: number;
        do {
          next = Math.floor(Math.random() * TIPS.length);
        } while (next === prev && TIPS.length > 1);
        return next;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const tip = TIPS[tipIndex];

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      {/* 스피너 */}
      <div className="mb-6 h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-primary" />

      {/* 팁 */}
      <div
        key={tipIndex}
        className="animate-in fade-in duration-500 text-center"
      >
        <span className="text-2xl">{tip.emoji}</span>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          {tip.text}
        </p>
      </div>
    </div>
  );
}
