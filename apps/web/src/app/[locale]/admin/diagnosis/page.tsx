export const dynamic = "force-dynamic";

/**
 * 진단 리포트 관리자 검토 화면 (#13③ 검토 파이프라인).
 *
 * '안 됐어요?'에서 인식 못 한 출력(②로 수집, 마스킹됨)을 한눈에 본다.
 * 접근 게이트: 로그인 + 이메일이 ADMIN_EMAIL과 일치해야 함(아니면 404).
 * 조치는 사람이 — 반복 에러 문자열을 rules.ts signatures에 추가(allowlist, 보안).
 */

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { listDiagnosisReports } from "@/lib/diagnosis/report-store";

interface PageProps {
  params: Promise<{ locale: string }>;
}

function isAdmin(email: string): boolean {
  const admin = process.env.ADMIN_EMAIL;
  return Boolean(admin) && email.toLowerCase() === admin!.toLowerCase();
}

export default async function AdminDiagnosisPage({ params }: PageProps): Promise<React.ReactNode> {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }
  if (!isAdmin(user.email)) {
    notFound();
  }

  const reports = await listDiagnosisReports(100);

  return (
    <main id="main-content" className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">
        진단 리포트 <span className="text-muted-foreground">({reports.length})</span>
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        &lsquo;안 됐어요?&rsquo;에서 인식 못 한 출력을 모읍니다(개인정보 마스킹됨). 반복되는
        에러 문자열을{" "}
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
          packages/diagnosis-catalog/src/rules.ts
        </code>{" "}
        의 해당 규칙 <code className="rounded bg-muted px-1.5 py-0.5 text-xs">signatures</code>에
        추가하면 다음부터 자동 인식됩니다.
      </p>

      {reports.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">아직 리포트가 없어요.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {reports.map((r) => (
            <li key={r.id} className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded bg-muted px-2 py-0.5 font-medium text-foreground/80">
                  {r.step ?? "—"}
                </span>
                <span>{r.createdAt.replace("T", " ").slice(0, 16)} UTC</span>
                {r.locale && <span>· {r.locale}</span>}
              </div>
              <pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap rounded-lg border border-border/30 bg-background/60 p-3 text-xs text-foreground/80">
                {r.maskedOutput}
              </pre>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
