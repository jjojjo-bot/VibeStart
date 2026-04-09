/**
 * 통계용 Supabase 클라이언트.
 *
 * 2026-04-08 결정으로 통계와 사용자 데이터를 두 프로젝트로 분리했으나,
 * Supabase Free 플랜의 organization당 active 프로젝트 2개 한도로 인해
 * (마)-2 단계에서 사용자 사이트용 슬롯이 부족해져 통계를 vibestart-auth
 * (Phase 2 사용자 데이터 프로젝트)로 통합했다. 통계 테이블은 RLS로
 * "익명 SELECT 허용 + RPC만 쓰기 가능"으로 격리되어 사용자 데이터와
 * 동일 DB에 있어도 노출 위험 없음.
 *
 * 이 모듈은 stats.ts / api/track 등 익명 anon key가 필요한 곳에서 사용한다.
 * 사용자 인증/RLS 보호된 데이터에는 lib/supabase/auth-server.ts의
 * createAuthServerClient()를 사용할 것.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_AUTH_SUPABASE_URL ?? "http://localhost";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY ?? "local";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
