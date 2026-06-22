/**
 * useDebounced — 값이 잠잠해진 뒤(delay)에만 갱신되는지 검증.
 *
 * 5분 체험 빌더의 미리보기 iframe이 매 키 입력마다 srcDoc 교체로 통째로 리로드되어
 * 화면이 심하게 깜빡이던 문제의 근본 수정. 입력값을 디바운스해 연속 타이핑 중에는
 * 리로드가 일어나지 않도록 한다.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDebounced } from './use-debounced';

afterEach(() => {
  vi.useRealTimers();
});

describe('useDebounced', () => {
  it('returns the initial value immediately (preview shows at once)', () => {
    const { result } = renderHook(() => useDebounced('a', 250));
    expect(result.current).toBe('a');
  });

  it('does not update during a burst of changes, then settles to the latest value', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ v }) => useDebounced(v, 250), {
      initialProps: { v: 'a' },
    });

    rerender({ v: 'ab' });
    rerender({ v: 'abc' });
    // 연속 입력 중에는 갱신 없음 → iframe 리로드/깜빡임 없음
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(249);
    });
    expect(result.current).toBe('a');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    // 잠잠해진 뒤 마지막 값으로 한 번만 settle
    expect(result.current).toBe('abc');
  });
});
