"use client";

import type { ReactNode } from "react";
import { Sprite, useTime } from "./core";
import { Easing, animate, clamp, interpolate } from "./anim";

const VS = {
  bg: "#0a0712",
  ink: "#f3efe8",
  inkDim: "rgba(243, 239, 232, 0.55)",
  inkFaint: "rgba(243, 239, 232, 0.25)",
  purple: "#7a5cff",
  purpleDeep: "#5a3ee0",
  purpleSoft: "rgba(122, 92, 255, 0.18)",
  purpleGlow: "rgba(122, 92, 255, 0.4)",
  sans: 'var(--font-inter), "Inter", system-ui, sans-serif',
  mono: 'var(--font-jetbrains-mono), "JetBrains Mono", ui-monospace, monospace',
} as const;

function Caret({
  x,
  y,
  size = 48,
  color = VS.ink,
  period = 1.0,
}: {
  x: number;
  y: number;
  size?: number;
  color?: string;
  period?: number;
}): ReactNode {
  const t = useTime();
  const on = t % period < period * 0.55;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size * 0.58,
        height: size * 1.1,
        background: color,
        opacity: on ? 1 : 0,
        transition: "opacity 40ms",
      }}
    />
  );
}

// ─── Scene 1: Cold open "I can't code." ──────────────────────────────────────
export function SceneColdOpen({ start = 0, end = 3 }: { start?: number; end?: number }): ReactNode {
  return (
    <Sprite start={start} end={end}>
      {({ localTime, duration }) => {
        const caretOpacity = animate({
          from: 0,
          to: 1,
          start: 0,
          end: 0.5,
          ease: Easing.easeOutCubic,
        })(localTime);
        const textIn = animate({
          from: 0,
          to: 1,
          start: 0.8,
          end: 1.4,
          ease: Easing.easeOutCubic,
        })(localTime);
        const textOut = animate({
          from: 0,
          to: 1,
          start: duration - 0.6,
          end: duration,
          ease: Easing.easeInCubic,
        })(localTime);
        const textOpacity = textIn * (1 - textOut);
        const textShift = animate({
          from: 12,
          to: 0,
          start: 0.8,
          end: 1.4,
          ease: Easing.easeOutCubic,
        })(localTime);

        return (
          <>
            <div
              style={{ position: "absolute", left: 200, top: 510, opacity: caretOpacity }}
            >
              <Caret x={0} y={0} size={88} color={VS.purple} />
            </div>
            <div
              style={{
                position: "absolute",
                left: 260,
                top: 470,
                fontFamily: VS.sans,
                fontSize: 140,
                fontWeight: 700,
                color: VS.ink,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                opacity: textOpacity,
                transform: `translateY(${textShift}px)`,
              }}
            >
              {"I can't code."}
            </div>
          </>
        );
      }}
    </Sprite>
  );
}

// ─── Scene 2: Doubt phrases drifting ─────────────────────────────────────────
const DOUBTS: Array<{
  text: string;
  x: number;
  y: number;
  delay: number;
  size: number;
  font: string;
  emphasize?: boolean;
}> = [
  { text: "command not found: npm", x: 160, y: 240, delay: 0.0, size: 34, font: VS.mono },
  { text: "what is a terminal?", x: 1100, y: 340, delay: 0.4, size: 42, font: VS.sans },
  { text: "ERROR: EACCES permission denied", x: 240, y: 640, delay: 0.9, size: 28, font: VS.mono },
  { text: "too complicated", x: 1180, y: 760, delay: 1.3, size: 56, font: VS.sans },
  { text: "where do I even start?", x: 520, y: 440, delay: 1.7, size: 62, font: VS.sans, emphasize: true },
];

export function SceneDoubt({ start = 3, end = 8 }: { start?: number; end?: number }): ReactNode {
  return (
    <Sprite start={start} end={end}>
      {({ localTime, duration }) => {
        const globalFade =
          localTime > duration - 0.8
            ? 1 - Easing.easeInCubic((localTime - (duration - 0.8)) / 0.8)
            : 1;

        return (
          <>
            {DOUBTS.map((d, i) => {
              const t = localTime - d.delay;
              if (t < 0) return null;
              const opacity = Math.min(1, t / 0.6) * (d.emphasize ? 1 : 0.55) * globalFade;
              const drift = Math.sin(t * 0.6 + i) * 6;
              const isMono = d.font === VS.mono;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: d.x,
                    top: d.y,
                    fontFamily: d.font,
                    fontSize: d.size,
                    fontWeight: isMono ? 500 : 600,
                    color: d.emphasize ? VS.ink : VS.inkDim,
                    opacity,
                    transform: `translateY(${drift}px)`,
                    letterSpacing: isMono ? "0" : "-0.01em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {d.text}
                </div>
              );
            })}
          </>
        );
      }}
    </Sprite>
  );
}

// ─── Scene 3: Pivot — spark becomes wordmark ─────────────────────────────────
export function ScenePivot({ start = 8, end = 13 }: { start?: number; end?: number }): ReactNode {
  return (
    <Sprite start={start} end={end}>
      {({ localTime, duration }) => {
        const sparkAppear = animate({
          from: 0,
          to: 1,
          start: 0,
          end: 0.5,
          ease: Easing.easeOutCubic,
        })(localTime);
        const sparkScale = interpolate(
          [0, 0.5, 1.2, 1.8],
          [0, 1.4, 1.0, 22],
          [Easing.easeOutBack, Easing.easeInOutCubic, Easing.easeInCubic],
        )(localTime);
        const sparkOpacity = localTime > 1.6 ? 0 : sparkAppear;
        const wordmarkOpacity = animate({
          from: 0,
          to: 1,
          start: 1.7,
          end: 2.3,
          ease: Easing.easeOutCubic,
        })(localTime);
        const wordmarkBlur = animate({
          from: 12,
          to: 0,
          start: 1.7,
          end: 2.5,
          ease: Easing.easeOutCubic,
        })(localTime);
        const exitFade =
          localTime > duration - 0.6
            ? 1 - Easing.easeInCubic((localTime - (duration - 0.6)) / 0.6)
            : 1;

        return (
          <>
            <div
              style={{
                position: "absolute",
                left: 960,
                top: 540,
                transform: "translate(-50%, -50%)",
                width: 1200,
                height: 1200,
                background: `radial-gradient(circle, ${VS.purpleGlow} 0%, rgba(122,92,255,0.1) 30%, transparent 60%)`,
                opacity:
                  (localTime > 1.4 ? Math.min(1, (localTime - 1.4) / 0.6) : 0) * exitFade * 0.9,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 960,
                top: 540,
                transform: `translate(-50%, -50%) scale(${sparkScale})`,
                width: 24,
                height: 24,
                borderRadius: 12,
                background: VS.purple,
                boxShadow: `0 0 60px 20px ${VS.purpleGlow}`,
                opacity: sparkOpacity,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 960,
                top: 540,
                transform: "translate(-50%, -50%)",
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity: wordmarkOpacity * exitFade,
                filter: `blur(${wordmarkBlur}px)`,
              }}
            >
              <svg width="96" height="96" viewBox="0 0 32 32" fill="none">
                <path
                  d="M6 9l8 7-8 7"
                  stroke={VS.purple}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M16 25h10" stroke={VS.purple} strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div
                style={{
                  fontFamily: VS.sans,
                  fontSize: 140,
                  fontWeight: 700,
                  color: VS.ink,
                  letterSpacing: "-0.035em",
                  lineHeight: 1,
                }}
              >
                VibeStart
              </div>
            </div>
          </>
        );
      }}
    </Sprite>
  );
}

// ─── Scene 4: Three steps reveal ─────────────────────────────────────────────
const STEPS: Array<{ n: string; title: string; body: string }> = [
  { n: "01", title: "Install", body: "One-click setup.\nNo terminal tears." },
  { n: "02", title: "Connect", body: "Plug in an AI.\nSay hello." },
  { n: "03", title: "Vibe", body: "Describe an idea.\nWatch it build." },
];

export function SceneSteps({ start = 13, end = 20 }: { start?: number; end?: number }): ReactNode {
  return (
    <Sprite start={start} end={end}>
      {({ localTime, duration }) => {
        const exitFade =
          localTime > duration - 0.6
            ? 1 - Easing.easeInCubic((localTime - (duration - 0.6)) / 0.6)
            : 1;

        const lineProgress = animate({
          from: 0,
          to: 1,
          start: 0.4,
          end: 4.5,
          ease: Easing.easeInOutCubic,
        })(localTime);

        return (
          <>
            <div
              style={{
                position: "absolute",
                left: 960,
                top: 180,
                transform: "translateX(-50%)",
                fontFamily: VS.sans,
                fontSize: 72,
                fontWeight: 700,
                color: VS.ink,
                letterSpacing: "-0.03em",
                opacity: animate({ from: 0, to: 1, start: 0, end: 0.6 })(localTime) * exitFade,
              }}
            >
              three calm steps.
            </div>

            <div
              style={{
                position: "absolute",
                left: 280,
                top: 600,
                width: 1360,
                height: 2,
                background: VS.inkFaint,
                opacity: exitFade,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 280,
                top: 600,
                width: 1360 * lineProgress,
                height: 2,
                background: VS.purple,
                boxShadow: `0 0 12px ${VS.purpleGlow}`,
                opacity: exitFade,
              }}
            />

            {STEPS.map((_s, i) => {
              const nodeX = 280 + (1360 / 2) * i;
              const nodeT = i * 0.5 + 0.8;
              const active = localTime >= nodeT;
              const nodeScale = active
                ? Easing.easeOutBack(Math.min(1, (localTime - nodeT) / 0.5))
                : 0;
              return (
                <div
                  key={`node-${i}`}
                  style={{
                    position: "absolute",
                    left: nodeX,
                    top: 600,
                    transform: `translate(-50%, -50%) scale(${nodeScale})`,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    background: VS.purple,
                    boxShadow: `0 0 20px ${VS.purpleGlow}`,
                    opacity: exitFade,
                  }}
                />
              );
            })}

            {STEPS.map((s, i) => {
              const cardT = i * 0.5 + 1.0;
              const appear = animate({
                from: 0,
                to: 1,
                start: cardT,
                end: cardT + 0.6,
                ease: Easing.easeOutCubic,
              })(localTime);
              const shift = animate({
                from: 30,
                to: 0,
                start: cardT,
                end: cardT + 0.6,
                ease: Easing.easeOutCubic,
              })(localTime);
              const cardX = 280 + (1360 / 2) * i;

              return (
                <div
                  key={`card-${i}`}
                  style={{
                    position: "absolute",
                    left: cardX,
                    top: 680,
                    transform: `translate(-50%, 0) translateY(${shift}px)`,
                    opacity: appear * exitFade,
                    width: 420,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontFamily: VS.mono,
                      fontSize: 22,
                      fontWeight: 500,
                      color: VS.purple,
                      letterSpacing: "0.2em",
                      marginBottom: 18,
                    }}
                  >
                    {s.n}
                  </div>
                  <div
                    style={{
                      fontFamily: VS.sans,
                      fontSize: 68,
                      fontWeight: 700,
                      color: VS.ink,
                      letterSpacing: "-0.03em",
                      marginBottom: 18,
                      lineHeight: 1,
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    style={{
                      fontFamily: VS.sans,
                      fontSize: 24,
                      fontWeight: 400,
                      color: VS.inkDim,
                      lineHeight: 1.4,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {s.body}
                  </div>
                </div>
              );
            })}
          </>
        );
      }}
    </Sprite>
  );
}

// ─── Scene 5: "I built something." typed out ─────────────────────────────────
export function SceneBuilt({ start = 20, end = 26 }: { start?: number; end?: number }): ReactNode {
  const phrase = "I built something.";

  return (
    <Sprite start={start} end={end}>
      {({ localTime, duration }) => {
        const exitFade =
          localTime > duration - 0.7
            ? 1 - Easing.easeInCubic((localTime - (duration - 0.7)) / 0.7)
            : 1;

        const typeStart = 0.3;
        const typeDur = 2.2;
        const typeT = clamp((localTime - typeStart) / typeDur, 0, 1);
        const charsVisible = Math.floor(Easing.easeOutCubic(typeT) * phrase.length);
        const visible = phrase.slice(0, charsVisible);

        const caretOn = ((localTime * 1.8) % 1) < 0.55;

        const glowOpacity = animate({
          from: 0,
          to: 1,
          start: 2.5,
          end: 3.5,
          ease: Easing.easeOutCubic,
        })(localTime);

        return (
          <>
            <div
              style={{
                position: "absolute",
                left: 960,
                top: 620,
                transform: "translate(-50%, -50%)",
                width: 1400,
                height: 260,
                background: `radial-gradient(ellipse, ${VS.purpleGlow} 0%, transparent 70%)`,
                opacity: glowOpacity * exitFade * 0.9,
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 960,
                top: 540,
                transform: "translate(-50%, -50%)",
                fontFamily: VS.sans,
                fontSize: 180,
                fontWeight: 700,
                color: VS.ink,
                letterSpacing: "-0.04em",
                lineHeight: 1,
                opacity: exitFade,
                whiteSpace: "pre",
                display: "flex",
                alignItems: "baseline",
              }}
            >
              <span>{visible}</span>
              <span
                style={{
                  display: "inline-block",
                  width: 10,
                  height: 150,
                  background: VS.purple,
                  marginLeft: 14,
                  opacity: caretOn ? 1 : 0,
                  transform: "translateY(30px)",
                }}
              />
            </div>
          </>
        );
      }}
    </Sprite>
  );
}

// ─── Scene 6: Landing CTA — logo + Get Started button ────────────────────────
export function SceneCTA({ start = 26, end = 32 }: { start?: number; end?: number }): ReactNode {
  return (
    <Sprite start={start} end={end}>
      {({ localTime, duration }) => {
        const logoAppear = animate({
          from: 0,
          to: 1,
          start: 0,
          end: 0.7,
          ease: Easing.easeOutCubic,
        })(localTime);
        const logoShift = animate({
          from: 24,
          to: 0,
          start: 0,
          end: 0.7,
          ease: Easing.easeOutCubic,
        })(localTime);
        const taglineAppear = animate({
          from: 0,
          to: 1,
          start: 0.5,
          end: 1.2,
          ease: Easing.easeOutCubic,
        })(localTime);
        const btnAppear = animate({
          from: 0,
          to: 1,
          start: 1.0,
          end: 1.6,
          ease: Easing.easeOutBack,
        })(localTime);
        const shimmerPos = ((localTime - 1.6) * 0.35) % 1;
        const shimmerVisible = localTime > 1.6;
        const exitFade =
          localTime > duration - 1.0
            ? 1 - Easing.easeInOutCubic((localTime - (duration - 1.0)) / 1.0)
            : 1;

        return (
          <>
            <div
              style={{
                position: "absolute",
                left: 960,
                top: 360,
                transform: `translate(-50%, 0) translateY(${logoShift}px)`,
                display: "flex",
                alignItems: "center",
                gap: 22,
                opacity: logoAppear * exitFade,
              }}
            >
              <svg width="72" height="72" viewBox="0 0 32 32" fill="none">
                <path
                  d="M6 9l8 7-8 7"
                  stroke={VS.purple}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M16 25h10" stroke={VS.purple} strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div
                style={{
                  fontFamily: VS.sans,
                  fontSize: 56,
                  fontWeight: 700,
                  color: VS.ink,
                  letterSpacing: "-0.02em",
                }}
              >
                VibeStart
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: 960,
                top: 520,
                transform: "translateX(-50%)",
                fontFamily: VS.sans,
                fontSize: 64,
                fontWeight: 700,
                color: VS.ink,
                letterSpacing: "-0.03em",
                opacity: taglineAppear * exitFade,
                whiteSpace: "nowrap",
              }}
            >
              your first step into vibe coding.
            </div>

            <div
              style={{
                position: "absolute",
                left: 960,
                top: 720,
                transform: `translate(-50%, -50%) scale(${0.9 + btnAppear * 0.1})`,
                opacity: btnAppear * exitFade,
              }}
            >
              <div
                style={{
                  position: "relative",
                  padding: "28px 72px",
                  background: VS.purpleDeep,
                  border: `1px solid ${VS.purple}`,
                  borderRadius: 14,
                  fontFamily: VS.sans,
                  fontSize: 32,
                  fontWeight: 600,
                  color: VS.ink,
                  letterSpacing: "-0.01em",
                  boxShadow: `0 20px 60px ${VS.purpleSoft}, 0 0 40px ${VS.purpleSoft}`,
                  overflow: "hidden",
                }}
              >
                Get Started
                {shimmerVisible && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      bottom: 0,
                      left: `${shimmerPos * 140 - 20}%`,
                      width: "20%",
                      background:
                        "linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)",
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            </div>

            <div
              style={{
                position: "absolute",
                left: 960,
                top: 860,
                transform: "translateX(-50%)",
                fontFamily: VS.sans,
                fontSize: 22,
                fontWeight: 400,
                color: VS.inkDim,
                opacity: btnAppear * exitFade,
                whiteSpace: "nowrap",
              }}
            >
              completely free · done in 10 min · no coding experience needed
            </div>
          </>
        );
      }}
    </Sprite>
  );
}

export function BackgroundDark(): ReactNode {
  return <div style={{ position: "absolute", inset: 0, background: VS.bg }} />;
}
