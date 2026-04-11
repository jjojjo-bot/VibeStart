"use server";

/**
 * /projects/new 의 Server Actions.
 *
 * 새 프로젝트 생성 요청을 받아 더미 store에 저장하고 마일스톤 트리 페이지로
 * 리다이렉트한다. 트랙 ID는 서버에서 엄격하게 화이트리스트 검증한다.
 */

import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";

import { getCurrentUser } from "@/lib/auth/dal";
import { createProject } from "@/lib/projects/project-store";

const VALID_TRACKS = ["static", "dynamic", "ai", "ecommerce"] as const;
type ValidTrack = (typeof VALID_TRACKS)[number];

function isValidTrack(v: unknown): v is ValidTrack {
  return typeof v === "string" && (VALID_TRACKS as readonly string[]).includes(v);
}

function resolveLocale(raw: unknown): string {
  if (
    typeof raw === "string" &&
    (routing.locales as readonly string[]).includes(raw)
  ) {
    return raw;
  }
  return routing.defaultLocale;
}

export async function createProjectAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const locale = resolveLocale(formData.get("locale"));

  if (!user) {
    redirect({ href: "/login", locale });
    return;
  }

  const rawTrack = formData.get("trackId");
  if (!isValidTrack(rawTrack)) {
    throw new Error("Invalid track selection");
  }

  // 카탈로그에서 트랙 활성화 여부 확인
  const catalog = createInMemoryMilestoneCatalog();
  const trackDef = catalog.getTrack(rawTrack);
  if (!trackDef || !trackDef.enabled) {
    throw new Error(`Track "${rawTrack}" is not yet available`);
  }

  const rawName = formData.get("name");
  const name =
    typeof rawName === "string" && rawName.trim().length > 0
      ? rawName.trim()
      : "my-portfolio";

  const project = await createProject({
    userId: user.id,
    track: rawTrack,
    name,
  });

  redirect({ href: `/projects/${project.id}`, locale });
}
