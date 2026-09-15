export const dynamic = "force-dynamic";

/**
 * /projects/new — 로컬 웹 프로젝트 연결 화면.
 *
 * 설치 완료 화면에서 넘어오지 않고 대시보드에서 새로 시작한 사용자가 로컬
 * 폴더명을 확인한 뒤 핵심 웹사이트 여정을 시작한다.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";
import type { TrackDefinition } from "@vibestart/shared-types";

import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { TrackBadge } from "@/components/milestone";
import { Button } from "@/components/ui/button";
import { PHASE1_DATA_COOKIE } from "@/lib/auth/phase1-cookie";
import { cn } from "@/lib/utils";

import { createProjectAction } from "./actions";
import { ProjectCreateForm } from "./project-create-form";

interface NewProjectPageProps {
  params: Promise<{ locale: string }>;
}

export default async function NewProjectPage({
  params,
}: NewProjectPageProps): Promise<React.ReactNode> {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getCurrentUser();
  if (!user) {
    redirect({ href: "/login", locale });
    return null;
  }

  const tProjects = await getTranslations("Projects");
  const tTracks = await getTranslations("Tracks");

  const catalog = createInMemoryMilestoneCatalog();
  const tracks = catalog.listTracks().filter((track) => track.enabled);

  // Phase 1 쿠키가 있으면 이름 pre-fill + 안내 배너 표시.
  // 쿠키 삭제는 createProjectAction(Server Action)에서 처리해야 한다 —
  // Server Component는 쿠키 수정이 금지돼 있어 여기서 delete를 호출하면
  // 런타임 에러("Cookies can only be modified in a Server Action or
  // Route Handler")가 난다.
  const jar = await cookies();
  const phase1Raw = jar.get(PHASE1_DATA_COOKIE)?.value;
  let phase1Name: string | null = null;
  let phase1FromSetup = false;
  if (phase1Raw) {
    try {
      const phase1 = JSON.parse(phase1Raw) as { project?: string };
      if (typeof phase1.project === "string" && phase1.project.trim().length > 0) {
        phase1Name = phase1.project.trim();
        phase1FromSetup = true;
      }
    } catch {
      /* 파싱 실패 무시 — 일반 신규 생성으로 폴백 */
    }
  }

  return (
    <main
      id="main-content"
      className="mx-auto max-w-4xl px-6 py-16"
    >
      <nav className="mb-6">
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← {tProjects("breadcrumbDashboard")}
        </Link>
      </nav>
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {tProjects("newTitle")}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {tProjects("newSubtitle")}
        </p>
      </header>

      {phase1FromSetup && (
        <div className="mb-8 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <p className="font-medium text-primary">
            🎉 {tProjects("phase1HandoffTitle")}
          </p>
          <p className="mt-1 text-muted-foreground">
            {tProjects("phase1HandoffSubtitle")}
          </p>
        </div>
      )}

      <div className="mx-auto max-w-xl">
        <ProjectCreateForm action={createProjectAction}>
          <input type="hidden" name="locale" value={locale} />

          <div className="grid gap-4">
            {tracks.map((track) => (
              <TrackOptionCard
                key={track.id}
                track={track}
                name={tTracks(`${track.id}.name`)}
                tagline={tTracks(`${track.id}.tagline`)}
                comingSoonLabel={
                  track.enabled ? null : tProjects("comingSoonBadge")
                }
              />
            ))}
          </div>

          <div className="space-y-2">
            <label htmlFor="project-name" className="text-sm font-medium">
              {tProjects("projectNameLabel")}
            </label>
            <input
              id="project-name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={63}
              pattern="[a-z0-9][a-z0-9-]{0,61}[a-z0-9]"
              defaultValue={phase1Name ?? "my-portfolio"}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <p className="text-xs text-muted-foreground">
              {tProjects("projectNameHint")}
            </p>
          </div>

          <div className="flex justify-center">
            <Button type="submit" size="lg" className="h-11 px-8">
              {tProjects("createButton")}
            </Button>
          </div>
        </ProjectCreateForm>
      </div>
    </main>
  );
}

interface TrackOptionCardProps {
  track: TrackDefinition;
  name: string;
  tagline: string;
  comingSoonLabel: string | null;
}

async function TrackOptionCard({
  track,
  name,
  tagline,
  comingSoonLabel,
}: TrackOptionCardProps): Promise<React.ReactNode> {
  const disabled = !track.enabled;

  return (
    <label
      className={cn(
        "relative flex flex-col gap-3 rounded-lg border border-border bg-card p-5 transition-colors",
        disabled && "cursor-not-allowed opacity-60",
        !disabled && "cursor-pointer hover:border-primary/60",
        "has-[:checked]:border-primary has-[:checked]:bg-primary/5",
      )}
    >
      <input
        type="radio"
        name="trackId"
        value={track.id}
        disabled={disabled}
        defaultChecked={track.id === "static"}
        required
        className="sr-only"
      />
      {comingSoonLabel && (
        <span className="absolute right-3 top-3 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {comingSoonLabel}
        </span>
      )}
      <TrackBadge track={track.id} color={track.colorToken} size="sm" />
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="text-sm text-muted-foreground">{tagline}</p>
    </label>
  );
}
