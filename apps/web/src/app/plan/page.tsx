"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OS, Goal } from "@/lib/onboarding";
import { Suspense } from "react";

interface PlanItem {
  name: string;
  description: string;
  icon: string;
}

function getPlanItems(os: OS, goal: Goal): PlanItem[] {
  const items: PlanItem[] = [];

  items.push({
    name: "Git",
    description: "코드 버전 관리 도구",
    icon: "📦",
  });

  // 프론트엔드가 있는 Goal은 Node.js 필요
  if (goal === "web-nextjs" || goal === "web-python" || goal === "web-java" || goal === "not-sure") {
    items.push({
      name: "Node.js",
      description: "자바스크립트 실행 환경 (프론트엔드용)",
      icon: "🟢",
    });
  }

  // 추가 런타임
  if (goal === "web-python" || goal === "data-ai") {
    items.push({
      name: "Python",
      description: goal === "data-ai" ? "프로그래밍 언어 실행 환경" : "백엔드 서버용 프로그래밍 언어",
      icon: "🐍",
    });
  } else if (goal === "web-java") {
    items.push({
      name: "Java (JDK)",
      description: "백엔드 서버용 프로그래밍 언어",
      icon: "☕",
    });
  } else if (goal === "mobile") {
    items.push({
      name: "Expo (React Native)",
      description: "안드로이드 + iOS 앱을 동시에 만드는 도구",
      icon: "📱",
    });
  }

  items.push({
    name: "VS Code",
    description: "코드 에디터",
    icon: "💻",
  });

  items.push({
    name: "Claude Code",
    description: "AI 코딩 도우미 (CLI + VS Code 확장)",
    icon: "🤖",
  });

  // 프로젝트 생성
  if (goal === "web-nextjs" || goal === "not-sure") {
    items.push({
      name: "Next.js 프로젝트 생성",
      description: "웹사이트 프로젝트를 자동으로 만들어요",
      icon: "🚀",
    });
  } else if (goal === "web-python") {
    items.push({
      name: "Next.js + FastAPI 프로젝트 생성",
      description: "프론트엔드(Next.js)와 백엔드(Python) 프로젝트를 각각 만들어요",
      icon: "🚀",
    });
  } else if (goal === "web-java") {
    items.push({
      name: "Next.js + Spring Boot 프로젝트 생성",
      description: "프론트엔드(Next.js)와 백엔드(Java) 프로젝트를 각각 만들어요",
      icon: "🚀",
    });
  } else if (goal === "mobile") {
    items.push({
      name: "Expo 프로젝트 생성",
      description: "모바일 앱 프로젝트를 만들어요",
      icon: "🚀",
    });
  } else if (goal === "data-ai") {
    items.push({
      name: "Jupyter Notebook 설정",
      description: "데이터 분석 환경을 만들어요",
      icon: "🚀",
    });
  }

  return items;
}

function PlanContent() {
  const searchParams = useSearchParams();

  const os = (searchParams.get("os") ?? "windows") as OS;
  const goal = (searchParams.get("goal") ?? "web-nextjs") as Goal;
  const projectName = searchParams.get("project") ?? "my-first-app";

  const planItems = getPlanItems(os, goal);

  const setupParams = new URLSearchParams({
    os,
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
