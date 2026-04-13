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
 *
 * # cache: 'no-store' 이유
 *
 * Next.js 16의 **Request Memoization**은 같은 렌더 트리 안에서 동일 URL+
 * headers를 가진 GET/HEAD 요청을 자동으로 dedupe한다. verify-resources가
 * 리소스를 DELETE한 뒤 같은 렌더에서 페이지가 동일 리소스를 재조회하면
 * 메모이즈된 이전 결과(삭제 전 상태)가 돌아와 UI가 stale 상태로 표시되는
 * 버그가 있었다. `cache: 'no-store'`를 Supabase 클라이언트의 fetch 옵션에
 * 강제하면 Next.js가 해당 요청을 memoize 하지 않으므로 DELETE 뒤 재조회가
 * 항상 최신 DB 상태를 반환한다.
 */

import "server-only";

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getAuthSupabaseEnv } from "./auth-env";

/**
 * Next.js Request Memoization을 비활성화하기 위해 모든 Supabase 요청에
 * `cache: 'no-store'`를 강제하는 fetch wrapper.
 */
const noStoreFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "no-store" });

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
    global: {
      fetch: noStoreFetch,
    },
  });
}
