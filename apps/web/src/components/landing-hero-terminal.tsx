"use client";

import { useEffect, useState } from "react";

type CommandLine = {
  readonly type: "cmd";
  readonly prompt: string;
  readonly cmd: string;
};

type OutputLine = {
  readonly type: "out" | "ok" | "vercel";
  readonly text: string;
};

type Line = CommandLine | OutputLine;

const LINES: readonly Line[] = [
  { type: "cmd", prompt: "$", cmd: "vibestart init my-portfolio" },
  { type: "out", text: "✓ Git for Windows installed (12s)" },
  { type: "out", text: "✓ Node.js LTS installed (28s)" },
  { type: "out", text: "✓ VS Code installed (15s)" },
  { type: "ok", text: "✓ Next.js project ready: my-portfolio" },
  { type: "cmd", prompt: "$", cmd: "npm run dev" },
  { type: "vercel", text: "▲ Ready on http://localhost:3000" },
];

const LOOP_PAUSE_MS = 4500;

function lineBody(line: Line): string {
  return line.type === "cmd" ? line.cmd : line.text;
}

function charDelay(line: Line): number {
  if (line.type === "cmd") return 55;
  if (line.type === "ok" || line.type === "vercel") return 22;
  return 14;
}

function pauseAfter(line: Line): number {
  if (line.type === "cmd") return 280;
  if (line.type === "ok") return 500;
  if (line.type === "vercel") return 350;
  return 200;
}

function lineColor(line: Line): string {
  if (line.type === "ok") return "text-emerald-400";
  if (line.type === "vercel") return "text-violet-400";
  if (line.type === "out") return "text-zinc-400";
  return "text-zinc-100";
}

export function LandingHeroTerminal(): React.ReactElement {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);

  useEffect(() => {
    if (lineIdx >= LINES.length) {
      const t = setTimeout(() => {
        setLineIdx(0);
        setCharIdx(0);
      }, LOOP_PAUSE_MS);
      return () => clearTimeout(t);
    }

    const line = LINES[lineIdx];
    const target = lineBody(line);

    if (charIdx < target.length) {
      const t = setTimeout(() => setCharIdx((c) => c + 1), charDelay(line));
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setLineIdx((i) => i + 1);
      setCharIdx(0);
    }, pauseAfter(line));
    return () => clearTimeout(t);
  }, [lineIdx, charIdx]);

  const allDone = lineIdx >= LINES.length;

  return (
    <div
      className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-2xl shadow-primary/10"
      role="img"
      aria-label="VibeStart terminal demo: installs dev tools and starts a Next.js project"
    >
      <div className="flex items-center gap-2 border-b border-border/50 bg-muted/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-red-500/70" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
          <div className="h-3 w-3 rounded-full bg-green-500/70" />
        </div>
        <div className="mx-auto text-xs text-muted-foreground">
          Terminal — vibestart
        </div>
      </div>
      <div className="min-h-[280px] bg-zinc-950 p-4 font-mono text-xs leading-relaxed sm:p-5 sm:text-sm">
        {LINES.slice(0, lineIdx).map((line, i) => (
          <LineRow key={i} line={line} body={lineBody(line)} cursor={false} />
        ))}
        {!allDone && (
          <LineRow
            key={`active-${lineIdx}`}
            line={LINES[lineIdx]}
            body={lineBody(LINES[lineIdx]).slice(0, charIdx)}
            cursor
          />
        )}
        {allDone && (
          <span
            className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-zinc-300 align-middle"
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}

interface LineRowProps {
  readonly line: Line;
  readonly body: string;
  readonly cursor: boolean;
}

function LineRow({ line, body, cursor }: LineRowProps): React.ReactElement {
  return (
    <div className={lineColor(line)}>
      {line.type === "cmd" && (
        <>
          <span className="text-emerald-400">{line.prompt}</span>{" "}
        </>
      )}
      <span>{body}</span>
      {cursor && (
        <span
          className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-zinc-300 align-middle"
          aria-hidden
        />
      )}
    </div>
  );
}
