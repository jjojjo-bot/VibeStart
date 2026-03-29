"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OS, AITool, Goal } from "@/lib/onboarding";
import { Suspense } from "react";

interface PlanItem {
  name: string;
  description: string;
  icon: string;
}

function getPlanItems(os: OS, tool: AITool, goal: Goal): PlanItem[] {
  const items: PlanItem[] = [];

  items.push({
    name: "Git",
    description: "코드 버전 관리 도구",
    icon: "📦",
  });

  items.push({
    name: "Node.js",
    description: "자바스크립트 실행 환경",
    icon: "🟢",
  });

  // AI 도구에 따라 에디터 결정
  if (tool === "cursor") {
    items.push({
      name: "Cursor",
      description: "AI가 내장된 코드 에디터",
      icon: "✨",
    });
  } else if (tool === "windsurf") {
    items.push({
      name: "Windsurf",
      description: "AI 기반 코드 에디터",
      icon: "🏄",
    });
  } else {
    // claude-code, copilot, undecided → VS Code
    items.push({
      name: "VS Code",
      description: "코드 에디터",
      icon: "💻",
    });
  }

  // Claude Code 또는 undecided인 경우
  if (tool === "claude-code" || tool === "undecided") {
    items.push({
      name: "Claude Code",
      description: "AI 코딩 도우미 (터미널에서 실행)",
      icon: "🤖",
    });
  }

  // Copilot인 경우
  if (tool === "copilot") {
    items.push({
      name: "GitHub Copilot 확장",
      description: "VS Code AI 코딩 확장",
      icon: "🤖",
    });
  }

  // 프로젝트 생성
  if (goal === "website" || goal === "not-sure") {
    items.push({
      name: "Next.js 프로젝트 생성",
      description: "웹사이트 프로젝트를 자동으로 만들어요",
      icon: "🚀",
    });
  }

  return items;
}

function PlanContent() {
  const searchParams = useSearchParams();

  const os = (searchParams.get("os") ?? "windows") as OS;
  const tool = (searchParams.get("tool") ?? "claude-code") as AITool;
  const goal = (searchParams.get("goal") ?? "website") as Goal;
  const projectName = searchParams.get("project") ?? "my-first-app";

  const planItems = getPlanItems(os, tool, goal);

  const setupParams = new URLSearchParams({
    os,
    tool,
    goal,
    project: projectName,
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="mb-2 text-center text-3xl font-bold">맞춤 설치 플랜</h1>
        <p className="mb-10 text-center text-muted-foreground">
          아래 도구들을 단계별로 설치할 거예요
        </p>

        {/* 플랜 아이템 리스트 */}
        <div className="mb-8 flex flex-col gap-3">
          {planItems.map((item, i) => (
            <div
              key={item.name}
              className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    Step {i + 1}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 요약 */}
        <div className="mb-8 rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>운영체제</span>
            <span className="text-foreground">
              {os === "windows" ? "Windows" : "Mac"}
            </span>
          </div>
          <div className="mt-2 flex justify-between">
            <span>프로젝트 이름</span>
            <code className="text-foreground">{projectName}</code>
          </div>
          <div className="mt-2 flex justify-between">
            <span>예상 소요 시간</span>
            <span className="text-foreground">약 10~15분</span>
          </div>
        </div>

        {/* CTA */}
        <Link href={`/setup?${setupParams.toString()}`}>
          <Button className="h-12 w-full text-base">설치 시작하기</Button>
        </Link>

        <p className="mt-4 text-center text-sm text-muted-foreground/70">
          이미 설치된 도구는 자동으로 건너뛰어요
        </p>
      </div>
    </main>
  );
}

export default function PlanPage() {
  return (
    <Suspense>
      <PlanContent />
    </Suspense>
  );
}
