"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { clamp } from "./anim";

type TimelineValue = { time: number; duration: number; playing: boolean };
const TimelineContext = createContext<TimelineValue>({ time: 0, duration: 10, playing: false });
export const useTime = (): number => useContext(TimelineContext).time;

type SpriteValue = { localTime: number; progress: number; duration: number; visible: boolean };
const SpriteContext = createContext<SpriteValue>({
  localTime: 0,
  progress: 0,
  duration: 0,
  visible: false,
});
export const useSprite = (): SpriteValue => useContext(SpriteContext);

type SpriteRenderProp = (value: SpriteValue) => ReactNode;

export function Sprite({
  start = 0,
  end = Infinity,
  children,
}: {
  start?: number;
  end?: number;
  children: ReactNode | SpriteRenderProp;
}): ReactNode {
  const { time } = useContext(TimelineContext);
  const visible = time >= start && time <= end;
  if (!visible) return null;

  const duration = end - start;
  const localTime = Math.max(0, time - start);
  const progress =
    duration > 0 && isFinite(duration) ? clamp(localTime / duration, 0, 1) : 0;

  const value: SpriteValue = { localTime, progress, duration, visible };

  return (
    <SpriteContext.Provider value={value}>
      {typeof children === "function" ? children(value) : children}
    </SpriteContext.Provider>
  );
}

export function Stage({
  width = 1920,
  height = 1080,
  duration = 32,
  speed = 1,
  background = "#0a0712",
  children,
}: {
  width?: number;
  height?: number;
  duration?: number;
  speed?: number;
  background?: string;
  children: ReactNode;
}): ReactNode {
  const [time, setTime] = useState(0);
  const [scale, setScale] = useState(1);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = (): void => {
      const s = Math.min(el.clientWidth / width, el.clientHeight / height);
      setScale(Math.max(0.05, s));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [width, height]);

  useEffect(() => {
    const step = (ts: number): void => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = ((ts - lastTsRef.current) / 1000) * speed;
      lastTsRef.current = ts;
      setTime((t) => {
        let next = t + dt;
        if (next >= duration) next = next % duration;
        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [duration, speed]);

  const ctxValue = useMemo<TimelineValue>(
    () => ({ time, duration, playing: true }),
    [time, duration],
  );

  return (
    <div
      ref={stageRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "#000",
      }}
    >
      <div
        style={{
          width,
          height,
          background,
          position: "relative",
          transform: `scale(${scale})`,
          transformOrigin: "center",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <TimelineContext.Provider value={ctxValue}>
          {children}
        </TimelineContext.Provider>
      </div>
    </div>
  );
}
