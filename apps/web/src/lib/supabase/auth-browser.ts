/**
 * Phase 2 — 브라우저(Client Component) 전용 Supabase 클라이언트.
 *
 * document.cookie를 통해 세션을 읽고 쓴다. Server Component/Action에서 쓰는
 * createServerClient와 호환되도록 @supabase/ssr의 createBrowserClient를 쓴다.
 */

"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthSupabaseEnv } from "./auth-env";

let cached: SupabaseClient | null = null;

export function createAuthBrowserClient(): SupabaseClient {
  if (cached) return cached;
  const { url, anonKey } = getAuthSupabaseEnv();
  cached = createBrowserClient(url, anonKey);
  return cached;
}
