import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-md text-center">
        <div className="text-8xl font-bold text-primary/30">404</div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          페이지를 찾을 수 없어요
        </h1>
        <p className="mt-3 text-muted-foreground">
          주소가 잘못되었거나, 삭제된 페이지일 수 있어요.
        </p>
        <div className="mt-8">
          <Link href="/">
            <Button size="lg">홈으로 돌아가기</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
