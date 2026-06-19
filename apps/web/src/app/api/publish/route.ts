/**
 * 발행 API — /api/publish.
 *
 *   POST { slug, templateId, values } → 익명 발행 생성(TTL). PublishResult 반환.
 *   GET  ?slug=xxx                    → 슬러그 가용성 검사.
 *
 * 공개 엔드포인트라 슬러그 검증 + best-effort 레이트리밋을 건다. 값은 저장소가
 * sanitizeTemplateValues로 정제한다. 렌더는 이스케이프되므로 XSS는 불가.
 */

import { NextRequest, NextResponse } from "next/server";
import type { PublishResult } from "@vibestart/shared-types";

import { validateSlug } from "@/lib/publish/slug";
import { createPublishedPage, isSlugAvailable } from "@/lib/publish/published-page-store";

// best-effort 인메모리 레이트리밋(서버리스라 인스턴스별이지만 무방비보다 낫다).
// 진짜 방어는 슬러그 유일성 + TTL + 영구화 가입 게이트가 담당.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-vercel-ip") ||
    "unknown"
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const slug = (request.nextUrl.searchParams.get("slug") ?? "").trim();
  const v = validateSlug(slug);
  if (!v.ok) return NextResponse.json({ available: false, reason: v.reason });
  const available = await isSlugAvailable(slug);
  return NextResponse.json({ available, reason: available ? null : "slug-taken" });
}

export async function POST(request: NextRequest): Promise<NextResponse<PublishResult>> {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ ok: false, reason: "rate-limited" }, { status: 429 });
  }

  let body: { slug?: unknown; templateId?: unknown; values?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid-slug" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const templateId = typeof body.templateId === "string" ? body.templateId : "";

  const v = validateSlug(slug);
  if (!v.ok) return NextResponse.json({ ok: false, reason: "invalid-slug" }, { status: 400 });

  const page = await createPublishedPage({ slug, templateId, values: body.values });
  if (!page) {
    // 슬러그 충돌 vs 잘못된 템플릿/값 구분: 가용성으로 추정.
    const taken = !(await isSlugAvailable(slug));
    return NextResponse.json(
      { ok: false, reason: taken ? "slug-taken" : "invalid-template" },
      { status: taken ? 409 : 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    slug: page.slug,
    path: `/p/${page.slug}`,
    expiresAt: page.expiresAt,
  });
}
