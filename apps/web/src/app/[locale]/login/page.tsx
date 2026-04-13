export const dynamic = "force-dynamic";

/**
 * Phase 2 — vibestart 자체 로그인 페이지.
 *
 * 이미 로그인된 사용자는 /dashboard로 바로 리다이렉트한다.
 * Google 로그인만 제공 (M2에서 "친구가 Google로 가입하는" 플로우와 같은
 * 철학: 한 번의 OAuth로 끝나는 단순한 진입).
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

import { getCurrentUser } from "@/lib/auth/dal";
import { hasAuthSupabaseEnv } from "@/lib/supabase/auth-env";
import { signInWithGoogleAction } from "./actions";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Phase 2 Supabase 환경변수가 아직 세팅되지 않았으면 안내만 보여준다.
  if (!hasAuthSupabaseEnv()) {
    return <SetupNotice />;
  }

  const user = await getCurrentUser();
  if (user) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  const t = await getTranslations({ locale, namespace: "Login" });

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center px-6 py-24"
    >
      <div className="mx-auto w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">
          {t("description")}
        </p>

        <form action={signInWithGoogleAction} className="mt-10">
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-3 rounded-md border border-border bg-background px-4 py-3 text-sm font-medium shadow-sm transition hover:bg-accent"
          >
            <GoogleLogo />
            {t("googleButton")}
          </button>
        </form>

        <p className="mt-8 text-xs text-muted-foreground">
          {t("privacyNotice")}
        </p>
      </div>
    </main>
  );
}

function SetupNotice() {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center px-6 py-24"
    >
      <div className="mx-auto w-full max-w-lg rounded-lg border border-border bg-card p-8 text-center">
        <h1 className="text-2xl font-bold">로그인 준비 중</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          VibeStart Phase 2 로그인 기능은 Supabase 프로젝트 연결이 필요합니다.
          관리자가 <code className="rounded bg-muted px-1.5 py-0.5 text-xs">supabase/migrations/phase2/SETUP.md</code>{" "}
          가이드를 따라 설정을 완료하면 바로 활성화됩니다.
        </p>
      </div>
    </main>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.05-3.72 1.05-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z"
      />
    </svg>
  );
}
