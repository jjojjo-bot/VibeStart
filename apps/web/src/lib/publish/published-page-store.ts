/**
 * 발행 페이지 저장소 (Supabase, service-role).
 *
 * 익명 발행은 auth.uid가 없어 RLS로 표현하기 까다로우므로 service 클라이언트로
 * 다룬다. 접근 제어·검증·레이트리밋은 호출하는 서버 코드(/api/publish, /p/[slug])가
 * 책임진다. 값은 sanitizeTemplateValues로 정제한 뒤에만 저장한다.
 */

import "server-only";

import type { PublishedPage } from "@vibestart/shared-types";
import { getTemplate, sanitizeTemplateValues } from "@vibestart/template-catalog";

import { createServiceClient, hasServiceSupabaseEnv } from "@/lib/supabase/service";

const TABLE = "published_pages";

/** 익명 발행 TTL(시간). 클레임(가입) 시 expires_at = null로 영구화. */
export const ANON_TTL_HOURS = 24;

function rowToPage(row: Record<string, unknown>): PublishedPage {
  return {
    slug: row.slug as string,
    templateId: row.template_id as string,
    values: (row.values as PublishedPage["values"]) ?? {},
    ownerId: (row.owner_id as string | null) ?? null,
    createdAt: row.created_at as string,
    expiresAt: (row.expires_at as string | null) ?? null,
  };
}

function isExpired(page: PublishedPage, now: number): boolean {
  return page.expiresAt !== null && Date.parse(page.expiresAt) <= now;
}

/** slug로 조회. 없거나 만료면 null. service env 미설정이면 null(우아한 degradation). */
export async function getPublishedPage(slug: string): Promise<PublishedPage | null> {
  if (!hasServiceSupabaseEnv()) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle();
  if (error || !data) return null;
  const page = rowToPage(data);
  return isExpired(page, Date.now()) ? null : page;
}

/** slug 사용 가능 여부. 만료된 익명 페이지는 점유로 보지 않는다. */
export async function isSlugAvailable(slug: string): Promise<boolean> {
  return (await getPublishedPage(slug)) === null;
}

/**
 * 익명 발행 생성. 템플릿/값 검증 후 TTL 부여. slug 충돌이면 null.
 * 만료된 동일 slug 행이 있으면 덮어쓴다(upsert).
 */
export async function createPublishedPage(input: {
  slug: string;
  templateId: string;
  values: unknown;
}): Promise<PublishedPage | null> {
  if (!hasServiceSupabaseEnv()) return null;
  const tpl = getTemplate(input.templateId);
  if (!tpl) return null;
  const values = sanitizeTemplateValues(tpl, input.values);
  if (!values) return null;

  // 살아있는 동일 slug가 있으면 충돌(만료된 건 덮어쓰기 허용).
  if (!(await isSlugAvailable(input.slug))) return null;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + ANON_TTL_HOURS * 3600 * 1000);

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from(TABLE)
    .upsert(
      {
        slug: input.slug,
        template_id: tpl.id,
        values,
        owner_id: null,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: "slug" },
    )
    .select()
    .single();

  if (error || !data) return null;
  return rowToPage(data);
}

/** 가입 사용자가 익명 페이지를 영구 소유로 전환. 소유자 지정 + 만료 해제. */
export async function claimPublishedPage(
  slug: string,
  ownerId: string,
): Promise<PublishedPage | null> {
  if (!hasServiceSupabaseEnv()) return null;
  const supabase = createServiceClient();
  // 이미 다른 사람이 소유한 페이지는 가로채지 못한다.
  const { data, error } = await supabase
    .from(TABLE)
    .update({ owner_id: ownerId, expires_at: null })
    .eq("slug", slug)
    .is("owner_id", null)
    .select()
    .maybeSingle();

  if (error || !data) return null;
  return rowToPage(data);
}
