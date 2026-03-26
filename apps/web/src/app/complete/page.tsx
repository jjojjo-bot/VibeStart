import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CompletePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-lg text-center">
        {/* 축하 */}
        <div className="mb-6 text-6xl">🎉</div>
        <h1 className="text-4xl font-bold">축하합니다!</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          바이브코딩을 시작할 준비가 모두 끝났어요.
        </p>

        {/* 지금 할 수 있는 것 */}
        <div className="mt-10 rounded-xl border border-border/50 bg-card p-6 text-left">
          <h2 className="mb-4 font-semibold">이제 이런 것들을 할 수 있어요</h2>
          <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              AI에게 &quot;버튼 색상을 파란색으로 바꿔줘&quot;라고 말하기
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              코드를 수정하고 브라우저에서 바로 확인하기
            </li>
            <li className="flex items-start gap-2">
              <span className="text-success">✓</span>
              나만의 웹사이트를 한 단계씩 만들어가기
            </li>
          </ul>
        </div>

        {/* Phase 2 예고 */}
        <div className="mt-6 rounded-xl bg-primary/5 border border-primary/20 p-6 text-left">
          <div className="mb-2 text-sm text-primary font-medium">
            Coming Soon
          </div>
          <h3 className="font-semibold">Phase 2: 내 서비스를 세상에 공개하기</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            데이터베이스 연동, 파일 저장소, 그리고 실제 URL로 배포하는 것까지
            안내해드릴 예정이에요.
          </p>
        </div>

        {/* 다시 시작 */}
        <div className="mt-10">
          <Link href="/">
            <Button variant="outline">처음으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
