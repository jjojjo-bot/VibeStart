"use server";

/**
 * /projects/new 의 Server Actions.
 *
 * 새 프로젝트 생성 요청을 받아 더미 store에 저장하고 마일스톤 트리 페이지로
 * 리다이렉트한다. 트랙 ID는 서버에서 엄격하게 화이트리스트 검증한다.
 */

import { cookies, headers } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

import { createInMemoryMilestoneCatalog } from "@vibestart/track-catalog";
import type { ProjectGoal, ProjectOs } from "@vibestart/shared-types";

import { getCurrentUser } from "@/lib/auth/dal";
import { createProject } from "@/lib/projects/project-store";
import { PHASE1_DATA_COOKIE } from "@/lib/auth/phase1-cookie";

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

  // os/goal: formData → Phase 1 쿠키 → User-Agent 추론 순서로 결정
  const VALID_GOALS: readonly string[] = [
    "web-nextjs", "web-python", "web-java", "mobile", "data-ai", "not-sure",
  ];
  const VALID_OS: readonly string[] = ["macos", "windows"];

  let os: ProjectOs | null = null;
  let goal: ProjectGoal | null = null;

  // 1) formData에서 직접 받기
  const rawOs = formData.get("os");
  const rawGoal = formData.get("goal");
  if (typeof rawOs === "string" && VALID_OS.includes(rawOs)) {
    os = rawOs as ProjectOs;
  }
  if (typeof rawGoal === "string" && VALID_GOALS.includes(rawGoal)) {
    goal = rawGoal as ProjectGoal;
  }

  // 2) Phase 1 쿠키 fallback
  if (!os || !goal) {
    const jar = await cookies();
    const phase1Raw = jar.get(PHASE1_DATA_COOKIE)?.value;
    if (phase1Raw) {
      try {
        const phase1 = JSON.parse(phase1Raw) as { os?: string; goal?: string };
        if (!os && typeof phase1.os === "string" && VALID_OS.includes(phase1.os)) {
          os = phase1.os as ProjectOs;
        }
        if (!goal && typeof phase1.goal === "string" && VALID_GOALS.includes(phase1.goal)) {
          goal = phase1.goal as ProjectGoal;
        }
      } catch { /* 파싱 실패 무시 */ }
    }
  }

  // 3) User-Agent에서 OS 추론
  if (!os) {
    const ua = (await headers()).get("user-agent") ?? "";
    os = /macintosh|mac os/i.test(ua) ? "macos" : "windows";
  }

  // 4) goal 기본값
  if (!goal) {
    goal = "web-nextjs";
  }

  const project = await createProject({
    userId: user.id,
    track: rawTrack,
    name,
    os,
    goal,
  });

  redirect({ href: `/projects/${project.id}`, locale });
}
