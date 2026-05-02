"use client";

import { useTranslations } from "next-intl";

function ClaudeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4.709 15.955l4.486-2.834a.277.277 0 0 0 .129-.234V8.37a.282.282 0 0 0-.149-.249l-4.486-2.57a.308.308 0 0 0-.163-.045.283.283 0 0 0-.282.282v9.916c0 .154.126.28.28.28a.275.275 0 0 0 .185-.029zm5.329-2.505L14.89 16.1a.282.282 0 0 0 .297-.006l4.341-2.834a.284.284 0 0 0 .126-.234V8.483a.283.283 0 0 0-.433-.24l-4.85 3.067a.282.282 0 0 0-.128.233v1.674a.28.28 0 0 1-.128.233l-.078.049v-.049z" />
      <path d="M14.524 6.673l-4.486 2.834a.277.277 0 0 0-.129.234v4.517c0 .1.054.193.149.249l4.486 2.57a.308.308 0 0 0 .163.045.283.283 0 0 0 .282-.282V6.924a.28.28 0 0 0-.28-.28.275.275 0 0 0-.185.029z" />
    </svg>
  );
}

export function StepAIIntro() {
  const t = useTranslations("Onboarding");

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#D97757]/10">
        <ClaudeLogo className="h-12 w-12 text-[#D97757]" />
      </div>

      <div className="text-center">
        <h3 className="mb-2 text-xl font-bold">{t("aiIntro.heading")}</h3>
        <p className="text-muted-foreground">
          {t("aiIntro.subtitle")}
        </p>
      </div>

      <div className="w-full space-y-3">
        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="mb-1 font-medium">{t("aiIntro.features.conversation.title")}</div>
          <p className="text-sm text-muted-foreground">
            {t("aiIntro.features.conversation.description")}
          </p>
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-4">
          <div className="mb-1 font-medium">{t("aiIntro.features.terminal.title")}</div>
          <p className="text-sm text-muted-foreground">
            {t("aiIntro.features.terminal.description")}
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {t("aiIntro.alternativeNote")}
      </p>
    </div>
  );
}
