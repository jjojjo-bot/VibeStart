"use client";

export function StepAIIntro() {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-4xl">
        🤖
      </div>

      <div className="text-center">
        <h3 className="mb-2 text-xl font-bold">Claude Code</h3>
        <p className="text-muted-foreground">
          AI가 코드를 대신 짜주는 도구예요
        </p>
      </div>

      <div className="w-full space-y-3">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="mb-1 font-medium">대화하듯 요청하면 돼요</div>
          <p className="text-sm text-muted-foreground">
            &quot;로그인 페이지 만들어줘&quot;처럼 말하면 AI가 코드를 작성합니다
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="mb-1 font-medium">터미널에서 실행해요</div>
          <p className="text-sm text-muted-foreground">
            프로젝트 폴더에서 <code className="rounded bg-muted px-1.5 py-0.5 text-xs">claude</code> 명령어를
            입력하면 시작됩니다
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="mb-1 font-medium">무료로 시작할 수 있어요</div>
          <p className="text-sm text-muted-foreground">
            설치 후 바로 사용 가능합니다. 코딩 경험이 없어도 괜찮아요
          </p>
        </div>
      </div>
    </div>
  );
}
