/**
 * Phase 2 — Supabase OAuth 콜백 Route Handler.
 *
 * Google OAuth가 끝나면 사용자가 여기로 돌아온다. 쿼리 파라미터:
 *   - code: Supabase가 세션으로 교환할 OAuth 코드
 *   - locale: 로그인 시작 시점의 사용자 언어 (next-intl 프리픽스에 사용)
 *
 * Phase 1 쿠키가 있으면 웹사이트 프로젝트를 자동 생성하고 첫 배포 여정으로
 * 보낸다. data-ai/mobile goal은
 * Phase 2 마일스톤이 맞지 않아 쿠키를 지우고 대시보드로 보낸다.
 */

import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

import { createSupabaseAuthAdapter } from "@/lib/auth/supabase-auth.adapter";
import { routing } from "@/i18n/routing";
import { PHASE1_DATA_COOKIE } from "@/lib/auth/phase1-cookie";
import { claimPendingPublishForUser } from "@/lib/publish/claim-pending";
import { createProject } from "@/lib/projects/project-store";
import { isValidProjectName } from "@/lib/onboarding";

const VALID_GOALS = [
  "web-nextjs",
  "web-python",
  "web-java",
  "mobile",
  "data-ai",
  "not-sure",
] as const;
type ValidGoal = (typeof VALID_GOALS)[number];
const PHASE2_UNSUPPORTED_GOALS = new Set<ValidGoal>(["data-ai", "mobile"]);

export async function GET(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const rawLocale = url.searchParams.get("locale");

  const locale =
    rawLocale && (routing.locales as readonly string[]).includes(rawLocale)
      ? rawLocale
      : routing.defaultLocale;

  const localePrefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  const errorUrl = new URL(`${localePrefix}/login`, url.origin);

  if (!code) {
    errorUrl.searchParams.set("error", "missing_code");
    return NextResponse.redirect(errorUrl);
  }

  let userId: string;
  try {
    const adapter = createSupabaseAuthAdapter();
    const user = await adapter.exchangeCode(code);
    userId = user.id;
    // 익명 발행해 둔 페이지가 있으면 이 사용자로 영구 claim(실패는 조용히 무시).
    await claimPendingPublishForUser(user.id);
  } catch (err) {
    errorUrl.searchParams.set(
      "error",
      err instanceof Error ? err.message : "exchange_failed",
    );
    return NextResponse.redirect(errorUrl);
  }

  // Phase 1 쿠키 확인 → 웹사이트 프로젝트 자동 생성
  const jar = await cookies();
  const phase1Raw = jar.get(PHASE1_DATA_COOKIE)?.value;

  if (phase1Raw) {
    try {
      const phase1 = JSON.parse(phase1Raw) as {
        os?: string;
        goal?: string;
        project?: string;
      };
      const goal: ValidGoal | null =
        typeof phase1.goal === "string" &&
        (VALID_GOALS as readonly string[]).includes(phase1.goal)
          ? (phase1.goal as ValidGoal)
          : null;

      if (goal !== null && PHASE2_UNSUPPORTED_GOALS.has(goal)) {
        // data-ai/mobile — Phase 2 skip, 쿠키도 정리
        jar.delete(PHASE1_DATA_COOKIE);
      } else if (
        goal !== null &&
        typeof phase1.project === "string" &&
        isValidProjectName(phase1.project)
      ) {
        const project = await createProject({
          userId,
          track: "static",
          name: phase1.project,
          os: phase1.os === "macos" ? "macos" : "windows",
          goal,
        });
        jar.delete(PHASE1_DATA_COOKIE);
        return NextResponse.redirect(
          new URL(`${localePrefix}/projects/${project.id}`, url.origin),
        );
      } else {
        jar.delete(PHASE1_DATA_COOKIE);
        return NextResponse.redirect(
          new URL(`${localePrefix}/projects/new`, url.origin),
        );
      }
    } catch {
      // 파싱 또는 자동 생성 실패 시 사용자가 폴더명을 다시 확인할 수 있게
      // 수동 연결 화면으로 보낸다. 쿠키는 그 화면의 생성 액션이 소비한다.
      return NextResponse.redirect(
        new URL(`${localePrefix}/projects/new`, url.origin),
      );
    }
  }

  // 기본: 대시보드로 리다이렉트
  const successUrl = new URL(`${localePrefix}/dashboard`, url.origin);
  return NextResponse.redirect(successUrl);
}
