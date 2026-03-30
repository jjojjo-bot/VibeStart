"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("Error");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-md text-center">
        <div className="text-6xl font-bold text-destructive/40">{t("label")}</div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t("description")}
        </p>
        <div className="mt-8">
          <Button size="lg" onClick={reset}>
            {t("retryButton")}
          </Button>
        </div>
      </div>
    </main>
  );
}
