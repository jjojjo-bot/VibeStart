/**
 * Phase 2 — proxy.ts(구 middleware)용 Supabase 클라이언트.
 *
 * NextRequest/NextResponse를 주고받아 요청/응답 쿠키에 세션을 동기화한다.
 * Supabase가 토큰을 리프레시한 경우 새 쿠키가 response에 기록되어야 다음
 * 요청에서 로그인 상태가 유지된다.
 *
 * IMPORTANT: 이 클라이언트를 만든 직후 반드시 getUser()를 호출해야 한다.
 * 응답이 커밋된 뒤에 리프레시되면 새 쿠키가 사라져 다음 요청이 또 리프레시를
 * 반복하게 된다.
 */

import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getAuthSupabaseEnv } from "./auth-env";

export interface ProxySupabaseContext {
  supabase: SupabaseClient;
  response: NextResponse;
}

/**
 * 요청마다 새 NextResponse를 만들고, Supabase가 쿠키를 쓰면 그 응답에 반영한다.
 * 호출자는 반환된 response를 그대로 반환하거나, 다른 미들웨어와 병합해야 한다.
 */
export function createAuthProxyClient(request: NextRequest): ProxySupabaseContext {
  const { url, anonKey } = getAuthSupabaseEnv();

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  return {
    supabase,
    get response() {
      return response;
    },
  };
}
