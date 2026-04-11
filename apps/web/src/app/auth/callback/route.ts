/**
 * Phase 2 — Supabase OAuth 콜백 Route Handler.
 *
 * Google OAuth가 끝나면 사용자가 여기로 돌아온다. 쿼리 파라미터:
 *   - code: Supabase가 세션으로 교환할 OAuth 코드
 *   - locale: 로그인 ���작 시점의 사용자 언어 (next-intl ��리픽스에 사용)
 *
 * Phase 1 데이터가 쿠키에 있으면 프로젝트를 자동 생성하고 해당 프로젝트
 * 페이지로 리다이렉트한다. 없으면 기존 동작(대시보드)으로 이동.
 */

import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";

import { createSupabaseAuthAdapter } from "@/lib/auth/supabase-auth.adapter";
import { getCurrentUser } from "@/lib/auth/dal";
import { createProject } from "@/lib/projects/project-store";
import { routing } from "@/i18n/routing";
import { PHASE1_DATA_COOKIE } from "@/lib/auth/phase1-cookie";

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

  try {
    const adapter = createSupabaseAuthAdapter();
    await adapter.exchangeCode(code);
  } catch (err) {
    errorUrl.searchParams.set(
      "error",
      err instanceof Error ? err.message : "exchange_failed",
    );
    return NextResponse.redirect(errorUrl);
  }

  // Phase 1 데이터 쿠키 확인 → 프로젝트 자동 생성
  const jar = await cookies();
  const phase1Raw = jar.get(PHASE1_DATA_COOKIE)?.value;

  if (phase1Raw) {
    // 쿠키 즉시 삭제
    jar.delete(PHASE1_DATA_COOKIE);

    try {
      const phase1 = JSON.parse(phase1Raw) as {
        os?: string;
        goal?: string;
        project?: string;
      };
      const projectName =
        typeof phase1.project === "string" && phase1.project.trim().length > 0
          ? phase1.project.trim()
          : "my-first-app";

      const user = await getCurrentUser();
      if (user) {
        const project = await createProject({
          userId: user.id,
          track: "static",
          name: projectName,
        });

        const projectUrl = new URL(
          `${localePrefix}/projects/${project.id}`,
          url.origin,
        );
        return NextResponse.redirect(projectUrl);
      }
    } catch {
      // Phase 1 데이터 파싱 실패 시 무시하고 대시보드로
    }
  }

  // 기본: 대시보드로 리다이렉트
  const successUrl = new URL(`${localePrefix}/dashboard`, url.origin);
  return NextResponse.redirect(successUrl);
}
