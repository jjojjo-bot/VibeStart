/**
 * Phase 2 — 대시보드 (보호된 페이지의 본보기).
 *
 * Phase 2a에서 이 페이지는 "로그인이 작동한다"를 증명하는 스텁이다. 이후
 * 프로젝트 목록, 트랙 선택, 마일스톤 트리가 여기에 붙는다.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

import { getCurrentUser } from "@/lib/auth/dal";
import { signOutAction } from "../login/actions";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    // redirect()는 내부적으로 예외를 던져 이 줄에 도달하지 않지만, next-intl의
    // 타입에 never가 없으므로 컴파일러를 돕기 위해 명시적으로 중단한다.
    return null;
  }

  const t = await getTranslations({ locale, namespace: "Dashboard" });

  return (
    <main
      id="main-content"
      className="mx-auto max-w-4xl px-6 py-16"
    >
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("welcome", { name: user.displayName })}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
          >
            {t("signOut")}
          </button>
        </form>
      </header>

      <section className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {t("stubNotice")}
        </p>
      </section>
    </main>
  );
}
