/**
 * Phase 2 — 대시보드.
 *
 * 로그인 후 진입하는 메인 화면. 사용자의 프로젝트 목록과 "새 프로젝트
 * 만들기" 진입점을 제공한다. 프로젝트가 없으면 안내 카드가 보이고, 있으면
 * 간단한 요약 리스트가 보인다.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";

import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { TrackBadge } from "@/components/milestone";
import { Button } from "@/components/ui/button";
import { listProjects } from "@/lib/projects/project-store";

import { signOutAction } from "../login/actions";
import { DeleteProjectButton } from "./delete-project-button";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DashboardPage({
  params,
}: DashboardPageProps): Promise<React.ReactNode> {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  // NOTE: Phase 1 데이터(os/goal/project) 기반의 자동 프로젝트 생성은
  // `/auth/callback` Route Handler와 `goToDashboardWithPhase1Action`
  // Server Action에서 처리된다. Dashboard는 Server Component라 쿠키 수정이
  // 금지돼(Next.js 16) 여기서 phase1 쿠키를 건드리면 런타임 에러가 난다.

  const t = await getTranslations({ locale, namespace: "Dashboard" });
  const tProjects = await getTranslations({
    locale,
    namespace: "Projects",
  });

  const projects = await listProjects(user.id);
  const catalog = createInMemoryMilestoneCatalog();

  return (
    <main id="main-content" className="mx-auto max-w-4xl px-6 py-16">
      <header className="mb-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold">
              {t("welcome", { name: user.displayName })}
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
          <form action={signOutAction} className="shrink-0">
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {t("signOut")}
            </button>
          </form>
        </div>
      </header>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{tProjects("myProjectsTitle")}</h2>
        <Link href="/projects/new" className="no-underline">
          <Button
            size="sm"
            variant="outline"
            className="border-border/60 bg-transparent text-sm text-muted-foreground hover:border-primary/50 hover:text-primary"
          >
            + {tProjects("createNewButton")}
          </Button>
        </Link>
      </div>

      {projects.length === 0 ? (
        <section className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {tProjects("emptyHint")}
          </p>
          <div className="mt-4">
            <Link href="/projects/new" className="no-underline">
              <Button>{tProjects("createNewButton")}</Button>
            </Link>
          </div>
        </section>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => {
            const track = catalog.getTrack(project.track);
            if (!track) return null;
            return (
              <li key={project.id}>
                <Link
                  href={`/projects/${project.id}`}
                  className="no-underline"
                >
                  <article className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/60">
                    <TrackBadge
                      track={track.id}
                      color={track.colorToken}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold">
                        {project.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {project.createdAt.slice(0, 10)}
                      </p>
                    </div>
                    <DeleteProjectButton projectId={project.id} />
                    <span className="text-sm text-muted-foreground">→</span>
                  </article>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
