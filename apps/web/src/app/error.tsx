"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-md text-center">
        <div className="text-6xl font-bold text-destructive/40">오류</div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          문제가 발생했어요
        </h1>
        <p className="mt-3 text-muted-foreground">
          일시적인 오류일 수 있어요. 다시 시도해 주세요.
        </p>
        <div className="mt-8">
          <Button size="lg" onClick={reset}>
            다시 시도하기
          </Button>
        </div>
      </div>
    </main>
  );
}
