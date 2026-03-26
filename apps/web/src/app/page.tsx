import Link from "next/link";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    number: "1",
    title: "간단한 질문",
    description: "OS와 만들고 싶은 것만 알려주세요",
  },
  {
    number: "2",
    title: "맞춤 안내",
    description: "필요한 도구를 단계별로 알려드려요",
  },
  {
    number: "3",
    title: "복사 & 붙여넣기",
    description: "명령어를 복사해서 실행하면 끝!",
  },
];

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        {/* 히어로 */}
        <div className="mb-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary">
          바이브코딩의 첫걸음
        </div>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          AI로 코딩하고 싶은데
          <br />
          <span className="text-primary">어디서부터 시작하지?</span>
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
          개발 도구 설치가 어려워서 포기하셨나요?
          <br />
          VibeStart가 하나하나 안내해드릴게요.
        </p>

        {/* CTA */}
        <div className="mt-10">
          <Link href="/onboarding">
            <Button size="lg" className="h-12 px-8 text-base">
              시작하기
            </Button>
          </Link>
        </div>

        {/* 진행 방식 소개 */}
        <div className="mt-20 grid gap-6 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="rounded-xl border border-border/50 bg-card p-6 text-left"
            >
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {step.number}
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* 안심 메시지 */}
        <p className="mt-16 text-sm text-muted-foreground/70">
          코딩 경험이 전혀 없어도 괜찮아요. 천천히 따라오시면 됩니다.
        </p>
      </div>
    </main>
  );
}
