'use client';

import { useEffect, useState } from 'react';

/**
 * 값이 delayMs 동안 잠잠해진 뒤에만 갱신되는 디바운스 값.
 *
 * 5분 체험 빌더의 미리보기 iframe은 srcDoc 교체 시 문서를 통째로 리로드한다 —
 * 매 키 입력마다 바꾸면 흰 화면이 번쩍이는 깜빡임이 생긴다. 입력값을 이 훅으로
 * 디바운스해 연속 타이핑 중에는 리로드가 일어나지 않게 한다(입력칸 자체는 즉시
 * 반응하도록 원본 값을 그대로 바인딩하고, iframe만 디바운스 값으로 그린다).
 */
export function useDebounced<T>(value: T, delayMs: number): T {
  const [settled, setSettled] = useState<T>(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return settled;
}
