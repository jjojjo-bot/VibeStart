"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { OS, Goal } from "@/lib/onboarding";
import { Suspense } from "react";

function getInstalledTools(goal: Goal): string[] {
  const base = ["Git", "VS Code", "Claude Code"];

  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      return [...base, "Node.js"];
    case "web-python":
      return [...base, "Node.js", "Python"];
    case "web-java":
      return [...base, "Node.js", "Java (JDK)"];
    case "mobile":
      return [...base, "Flutter"];
    case "data-ai":
      return [...base, "Python"];
  }
}

function getProjectTree(goal: Goal, projectName: string): string {
  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      return `📁 ~/${projectName}/
├── 📂 src/
│   ├── 📂 domain/          ← 비즈니스 로직
│   │   ├── models/
│   │   └── services/
│   ├── 📂 ports/            ← 인터페이스 정의
│   ├── 📂 adapters/         ← 외부 연동
│   │   ├── api/
│   │   └── ui/
│   └── 📂 app/              ← 페이지 (Next.js)
├── 📄 CLAUDE.md              ← AI 아키텍처 규칙
└── 📄 package.json`;

    case "web-python":
      return `📁 ~/${projectName}/
├── 📂 frontend/              ← Next.js (화면)
│   ├── 📂 src/
│   │   ├── domain/ ports/ adapters/
│   │   └── 📂 app/           ← 페이지
│   └── 📄 package.json
├── 📂 backend/               ← FastAPI (서버)
│   ├── 📂 domain/
│   │   ├── models/
│   │   └── services/
│   ├── 📂 ports/
│   │   ├── inbound/
│   │   └── outbound/
│   ├── 📂 adapters/
│   │   ├── inbound/api/
│   │   └── outbound/persistence/
│   ├── 📄 main.py            ← 서버 진입점
│   └── 📂 venv/              ← Python 가상환경
└── 📄 CLAUDE.md               ← AI 아키텍처 규칙`;

    case "web-java":
      return `📁 ~/${projectName}/
├── 📂 frontend/              ← Next.js (화면)
│   ├── 📂 src/
│   │   ├── domain/ ports/ adapters/
│   │   └── 📂 app/           ← 페이지
│   └── 📄 package.json
├── 📂 backend/               ← Spring Boot (서버)
│   ├── 📂 src/main/java/.../
│   │   ├── domain/model/     ← 엔티티
│   │   ├── domain/service/   ← 비즈니스 로직
│   │   ├── port/in/ out/     ← 인터페이스
│   │   └── adapter/in/web/   ← 컨트롤러
│   ├── 📄 application.yml    ← 서버 설정
│   └── 📄 build.gradle       ← 빌드 설정
└── 📄 CLAUDE.md               ← AI 아키텍처 규칙`;

    case "mobile":
      return `📁 ~/${projectName}/
├── 📂 lib/
│   ├── 📂 domain/            ← 비즈니스 로직
│   │   ├── models/
│   │   └── services/
│   ├── 📂 ports/             ← 인터페이스 정의
│   ├── 📂 adapters/          ← 외부 연동
│   │   ├── api/
│   │   └── ui/
│   │       ├── screens/      ← 화면
│   │       └── widgets/      ← 컴포넌트
│   └── 📄 main.dart          ← 앱 진입점
├── 📄 CLAUDE.md               ← AI 아키텍처 규칙
└── 📄 pubspec.yaml            ← 패키지 설정`;

    case "data-ai":
      return `📁 ~/${projectName}/
├── 📂 data/                   ← 데이터 파일
├── 📂 notebooks/              ← Jupyter Notebook
├── 📂 src/
│   ├── loaders/               ← 데이터 로딩
│   ├── analyzers/             ← 분석 로직
│   └── visualizers/           ← 시각화
├── 📂 venv/                   ← Python 가상환경
└── 📄 CLAUDE.md               ← AI 프로젝트 규칙`;
  }
}

function getGoalLabel(goal: Goal): string {
  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      return "Next.js 웹사이트";
    case "web-python":
      return "Next.js + Python 웹서비스";
    case "web-java":
      return "Next.js + Java 웹서비스";
    case "mobile":
      return "Flutter 모바일 앱";
    case "data-ai":
      return "Python 데이터 분석";
  }
}

function CompleteContent() {
  const searchParams = useSearchParams();

  const os = (searchParams.get("os") ?? "windows") as OS;
  const goal = (searchParams.get("goal") ?? "web-nextjs") as Goal;
  const projectName = searchParams.get("project") ?? "my-first-app";

  const tools = getInstalledTools(goal);
  const tree = getProjectTree(goal, projectName);
  const goalLabel = getGoalLabel(goal);

  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-2xl">
        {/* 축하 */}
        <div className="mb-10 text-center">
          <div className="mb-4 text-6xl">🎉</div>
          <h1 className="text-3xl font-bold">축하합니다!</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            <strong>{goalLabel}</strong> 개발 환경이 완성됐어요
          </p>
        </div>

        {/* 설치된 도구 */}
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-4 font-semibold">설치된 도구</h2>
          <div className="flex flex-wrap gap-2">
            {tools.map((tool) => (
              <span
                key={tool}
                className="rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* 프로젝트 구조 */}
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-4 font-semibold">내 PC에 만들어진 프로젝트 구조</h2>
          <pre className="overflow-x-auto rounded-lg bg-background/80 border border-border/30 p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre">
            {tree}
          </pre>
        </div>

        {/* 지금 할 수 있는 것 */}
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-4 font-semibold">이제 이런 것들을 할 수 있어요</h2>
          <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              VS Code를 열고 터미널에서 <code className="rounded bg-muted px-1.5 py-0.5 text-xs">claude</code>를 입력해서 AI 코딩 시작하기
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              AI에게 &quot;로그인 페이지 만들어줘&quot;처럼 대화하듯 요청하기
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              CLAUDE.md 파일 덕분에 AI가 아키텍처 규칙을 자동으로 따라요
            </li>
          </ul>
        </div>

        {/* Phase 2 예고 */}
        <div className="mb-10 rounded-xl bg-primary/5 border border-primary/20 p-6">
          <div className="mb-2 text-sm text-primary font-medium">
            Coming Soon
          </div>
          <h3 className="font-semibold">Phase 2: 내 서비스를 세상에 공개하기</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            데이터베이스 연동, 파일 저장소, 실제 URL로 배포,
            그리고 AI 팀 에이전트 설정까지 안내해드릴 예정이에요.
          </p>
        </div>

        {/* 다시 시작 */}
        <div className="text-center">
          <Link href="/">
            <Button variant="outline">처음으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CompletePage() {
  return (
    <Suspense>
      <CompleteContent />
    </Suspense>
  );
}
