/**
 * Phase 2 — 서버 사이드(Server Component / Server Action / Route Handler)
 * 전용 Supabase 클라이언트.
 *
 * Next.js 16에서는 cookies()가 async다. getAll/setAll 패턴을 반드시 제공해야
 * 세션 리프레시 시 쿠키가 소실되지 않는다.
 *
 * Server Component 내부에서 호출하면 setAll이 무시되는 경우가 있으므로,
 * 세션 리프레시는 proxy.ts가 responsible하다. 여기서는 try/catch로 조용히
 * 무시한다.
 */

import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getAuthSupabaseEnv } from "./auth-env";

export async function createAuthServerClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getAuthSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component 렌더 중에는 쿠키를 쓸 수 없다. proxy.ts에서
          // 이미 리프레시를 처리했으므로 조용히 무시해도 된다.
        }
      },
    },
  });
}
