"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { OS, Goal } from "@/lib/onboarding";
import { incrementCompletions } from "@/lib/stats";
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
      return [...base, "Node.js", "Expo"];
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
├── 📂 src/
│   ├── 📂 domain/            ← 비즈니스 로직
│   │   ├── models/
│   │   └── services/
│   ├── 📂 ports/             ← 인터페이스 정의
│   ├── 📂 adapters/          ← 외부 연동
│   │   ├── api/
│   │   └── ui/
│   │       ├── screens/      ← 화면
│   │       └── components/   ← 컴포넌트
├── 📄 App.tsx                 ← 앱 진입점
├── 📄 CLAUDE.md               ← AI 아키텍처 규칙
└── 📄 package.json`;

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

function getFirstPromptExample(goal: Goal): string {
  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      return `나는 약속 날짜 잡기 웹사이트를 만들고 싶어.

어떤 서비스냐면:
친구들이 단톡방에서 "언제 돼?" 물어보는 게 너무 번거로워서,
링크 하나 공유하면 각자 되는 날짜에 투표할 수 있는 사이트야.

주로 쓸 사람:
20~30대 직장인. 회원가입 없이 링크만 받으면 바로 쓸 수 있어야 해.

처음에 꼭 있어야 할 기능 3가지:
1. 후보 날짜를 여러 개 올리면 참여자들이 되는 날짜에 체크
2. 회원가입 없이 이름만 입력하고 바로 참여
3. 투표 결과를 한눈에 볼 수 있는 화면

지금 어디서부터 시작하면 좋을까?`;

    case "web-python":
      return `나는 동네 물건 대여 웹서비스를 만들고 싶어.

어떤 서비스냐면:
같은 아파트 단지 주민들이 드릴, 사다리처럼 가끔 쓰는 물건을
서로 빌려주고 빌릴 수 있는 사이트야.

주로 쓸 사람:
같은 단지 주민들. 매번 사기엔 아깝고, 필요할 때만 잠깐 쓰고 싶어하는 사람들.

처음에 꼭 있어야 할 기능 3가지:
1. 빌려줄 물건 등록 (사진 + 설명 + 대여 가능 기간)
2. 원하는 물건 검색 + 대여 신청
3. 신청이 오면 카카오톡 알림

지금 어디서부터 시작하면 좋을까?`;

    case "web-java":
      return `나는 소규모 카페 직원 스케줄 관리 웹사이트를 만들고 싶어.

어떤 서비스냐면:
직원 10명 미만인 카페에서, 사장님이 근무표를 올리면
직원들이 신청하고 확정하는 방식으로 스케줄을 관리하는 사이트야.

주로 쓸 사람:
카페 사장님. 지금은 카카오톡으로 일일이 조율하는데 너무 복잡해함.

처음에 꼭 있어야 할 기능 3가지:
1. 사장님이 근무 날짜/시간 올리면 직원들이 신청
2. 월별 스케줄 달력으로 한눈에 확인
3. 스케줄 확정되면 직원에게 알림

지금 어디서부터 시작하면 좋을까?`;

    case "mobile":
      return `나는 수분 섭취 기록 앱을 만들고 싶어.

어떤 앱이냐면:
하루에 물을 얼마나 마셨는지 버튼 하나로 기록하고,
목표량을 채우면 칭찬해주는 건강 습관 앱이야.

주로 쓸 사람:
건강 관리 시작하고 싶은 20~40대. 복잡한 기능은 필요 없고
간단하게 기록만 하고 싶어하는 사람들.

처음에 꼭 있어야 할 기능 3가지:
1. 물 마실 때 버튼 한 번으로 기록 (+250ml 같은 식으로)
2. 오늘 총 섭취량을 숫자와 그래프로 표시
3. 하루 목표 달성하면 칭찬 메시지

지금 어디서부터 시작하면 좋을까?`;

    case "data-ai":
      return `나는 쇼핑몰 매출 데이터 분석을 하고 싶어.

어떤 분석이냐면:
엑셀에 쌓인 주문 데이터를 보고,
어떤 상품이 잘 팔리고 어떤 시간대에 주문이 많은지 파악하고 싶어.

분석 결과를 쓸 상황:
사장님한테 이번 달 리포트로 보고할 때 쓸 자료.

처음에 꼭 분석해야 할 것 3가지:
1. 상품별 월간 매출 순위
2. 요일/시간대별 주문 패턴
3. 매출이 갑자기 오르거나 내려간 날 파악

어디서부터 시작하면 좋을까?`;
  }
}

function getPromptTemplate(goal: Goal): string {
  if (goal === "data-ai") {
    return `나는 ___를 분석하고 싶어.

어떤 분석이냐면:
___

분석 결과를 쓸 상황:
___

처음에 꼭 분석해야 할 것 3가지:
1. ___
2. ___
3. ___

어디서부터 시작하면 좋을까?`;
  }

  const word = goal === "mobile" ? "앱" : "웹사이트";

  return `나는 ___ ${word}를 만들고 싶어.

어떤 서비스냐면:
___

주로 쓸 사람:
___

처음에 꼭 있어야 할 기능 3가지:
1. ___
2. ___
3. ___

지금 어디서부터 시작하면 좋을까?`;
}

/** v0 ZIP을 풀어야 할 경로 (웹 프로젝트만 해당) */
function getV0UnzipPath(goal: Goal, projectName: string): string | null {
  switch (goal) {
    case "web-nextjs":
    case "not-sure":
      return `~/${projectName}/`;
    case "web-python":
    case "web-java":
      return `~/${projectName}/frontend/`;
    case "mobile":
    case "data-ai":
      return null;
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
      return "Expo 모바일 앱";
    case "data-ai":
      return "Python 데이터 분석";
  }
}

function PromptCopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative rounded-lg border border-primary/30 bg-primary/5 p-4 pr-24">
      <pre className="overflow-x-auto text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">
        {text}
      </pre>
      <Button
        size="sm"
        variant="outline"
        onClick={handleCopy}
        className="absolute right-3 top-3"
      >
        {copied ? "복사됨!" : "복사"}
      </Button>
    </div>
  );
}

function CompleteContent() {
  const searchParams = useSearchParams();
  const counted = useRef(false);

  const os = (searchParams.get("os") ?? "windows") as OS;
  const goal = (searchParams.get("goal") ?? "web-nextjs") as Goal;
  const projectName = searchParams.get("project") ?? "my-first-app";

  useEffect(() => {
    if (!counted.current) {
      counted.current = true;
      incrementCompletions();
    }
  }, []);

  const tools = getInstalledTools(goal);
  const tree = getProjectTree(goal, projectName);
  const goalLabel = getGoalLabel(goal);
  const firstPrompt = getFirstPromptExample(goal);
  const promptTemplate = getPromptTemplate(goal);
  const v0Path = getV0UnzipPath(goal, projectName);

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

        {/* 첫 번째 프롬프트 */}
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-1 font-semibold">Claude Code에 첫 마디 던지기</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            한 번에 완벽하게 안 써도 괜찮아요. 대화를 이어가면서 고치면 돼요.
          </p>

          {/* 빈칸 채우기 템플릿 */}
          <div className="mb-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">빈칸을 채워보세요</p>
            <PromptCopyBlock text={promptTemplate} />
          </div>

          {/* 채워진 예시 */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">이런 식으로 쓰면 돼요</p>
            <PromptCopyBlock text={firstPrompt} />
          </div>
        </div>

        {/* 이어서 할 수 있는 대화 */}
        <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
          <h2 className="mb-1 font-semibold">그 다음엔 이렇게 이어가세요</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            첫 프롬프트를 보내면 AI가 코드를 만들어줘요. 그 뒤로는 짧게 대화하듯 요청하면 돼요.
          </p>
          <div className="flex flex-col gap-2">
            {[
              "이거 실행해볼 수 있어?",
              "글자 크기 좀 키워줘",
              "배경색을 파란색으로 바꿔줘",
              "로그인 기능 추가하고 싶어",
              "에러가 나는데 도와줘 (에러 메시지 붙여넣기)",
              "지금까지 만든 거 설명해줘",
            ].map((example) => (
              <div
                key={example}
                className="rounded-lg bg-muted/30 px-3 py-2 text-sm text-muted-foreground"
              >
                &ldquo;{example}&rdquo;
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground/60">
            잘못 말해도 괜찮아요. &ldquo;아까 거 취소하고 다시 해줘&rdquo;라고 하면 돼요.
          </p>
        </div>

        {/* v0 디자인 팁 (웹 프로젝트만) */}
        {v0Path && (
          <div className="mb-6 rounded-xl border border-border/50 bg-card p-6">
            <h2 className="mb-1 font-semibold">디자인이 막막하다면</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              <a href="https://v0.dev" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">v0.dev</a>에서
              AI로 화면을 먼저 만들고, 내 프로젝트에 가져올 수 있어요.
            </p>
            <ol className="flex flex-col gap-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
                <span>v0.dev에서 &ldquo;로그인 페이지 만들어줘&rdquo;처럼 원하는 화면을 설명하세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
                <span>마음에 들면 <strong>Download ZIP</strong>을 클릭해서 다운로드하세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
                <span>압축을 풀어서 <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{v0Path}</code> 폴더에 넣으세요</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</span>
                <span>Claude Code에 &ldquo;이 코드를 내 프로젝트에 적용해줘&rdquo;라고 말하세요</span>
              </li>
            </ol>
          </div>
        )}

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
