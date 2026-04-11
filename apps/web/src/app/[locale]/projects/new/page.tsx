/**
 * /projects/new — 트랙 선택 화면 (Phase 2a 정적만 활성).
 *
 * 4개 트랙을 카드로 표시한다. 정적만 선택 가능하고 나머지 3개는 "곧 제공"
 * 뱃지와 함께 비활성. 사용자가 트랙을 고르고 프로젝트 이름을 입력한 뒤
 * 제출하면 Server Action이 더미 store에 프로젝트를 만들고 트리 페이지로
 * 리다이렉트한다.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";
import type { TrackDefinition } from "@vibestart/shared-types";

import { Link, redirect } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth/dal";
import { TrackBadge } from "@/components/milestone";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { createProjectAction } from "./actions";

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
  const tracks = catalog.listTracks();

  return (
    <main
      id="main-content"
      className="mx-auto max-w-4xl px-6 py-16"
    >
      <nav className="mb-6">
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
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

      <form action={createProjectAction} className="space-y-8">
        <input type="hidden" name="locale" value={locale} />

        <div className="grid gap-4 sm:grid-cols-2">
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
            {tProjects("createButton")}
          </label>
          <input
            id="project-name"
            name="name"
            type="text"
            required
            maxLength={60}
            defaultValue="my-portfolio"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex justify-center">
          <Button type="submit" size="lg" className="h-11 px-8">
            {tProjects("createButton")}
          </Button>
        </div>
      </form>
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
