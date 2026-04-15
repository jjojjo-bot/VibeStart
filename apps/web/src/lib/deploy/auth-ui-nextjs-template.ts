/**
 * (마)-5용 Next.js Auth 스캐폴딩.
 *
 * 사용자가 Phase 1에서 자유롭게 만든 사이트(어떤 도메인이든)를 보존하면서,
 * Google 로그인 기능에 필요한 최소 자료만 GitHub에 push한다. 다음 3개 파일/
 * 변경만 담당하며 사용자가 작성한 page.tsx/layout.tsx 등은 절대 건드리지 않는다:
 *
 *   1. src/lib/supabase.ts — Supabase browser client (신규 파일)
 *   2. src/components/auth-button.tsx — 드롭인 로그인/로그아웃 버튼 (신규 파일)
 *   3. package.json 의존성에 @supabase/supabase-js 추가
 *
 * 실제로 버튼을 사이트에 끼워넣는 작업은 사용자가 Claude Code(또는 Cursor)에
 * "내 사이트에 Google 로그인 버튼 추가해줘" 같은 자연어 프롬프트로 처리한다.
 * Phase 1↔M3와 동일한 멘탈 모델 — VibeStart는 결정론으로 안전한 부분만,
 * 코드 머지는 LLM이 처리.
 *
 * Supabase URL / anon key는 환경변수가 아닌 코드에 직접 임베드한다.
 * (비전공자가 .env.local을 만들어야 하는 진입장벽 제거. anon key는 공개 키.)
 *
 * 의존성 없는 순수 함수 — 테스트 가능.
 */

export interface NextJsAuthTemplateInput {
  projectName: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

function escapeBacktick(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}

/**
 * src/lib/supabase.ts — Supabase browser client
 */
export function buildSupabaseClientFile(input: NextJsAuthTemplateInput): string {
  return `import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "${escapeBacktick(input.supabaseUrl)}";
const supabaseAnonKey = "${escapeBacktick(input.supabaseAnonKey)}";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;
}

/**
 * src/components/auth-button.tsx — 사용자 사이트 어디든 import해서 쓸 수 있는
 * 드롭인 Google 로그인/로그아웃 버튼.
 *
 * - 기본 Tailwind 스타일을 갖되 className prop으로 외부에서 덮어쓸 수 있음.
 * - 세션 상태에 따라 "Google로 로그인" ↔ "이메일 + 로그아웃" 자동 토글.
 * - useSyncExternalStore 대신 onAuthStateChange + 초기 getSession 패턴 사용
 *   (App Router의 일반적인 클라이언트 패턴, 사용자 코드와 충돌 가능성 낮음).
 */
export function buildAuthButtonComponent(): string {
  return `"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface AuthButtonProps {
  className?: string;
}

export function AuthButton({ className }: AuthButtonProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, next) => {
        if (mounted) setSession(next);
      },
    );
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div
        className={className ?? "inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-400"}
      >
        ...
      </div>
    );
  }

  if (session) {
    return (
      <div
        data-auth-button="signed-in"
        className={className ?? "inline-flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-1.5 text-sm"}
      >
        <span className="truncate max-w-[160px]">{session.user.email}</span>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs text-zinc-500 hover:text-zinc-900"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      data-auth-button="signed-out"
      onClick={handleLogin}
      className={className ?? "inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50"}
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.997 10.997 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
      </svg>
      Google로 로그인
    </button>
  );
}
`;
}

/**
 * package.json에 @supabase/supabase-js 의존성을 추가한 새 내용 반환.
 * 기존 package.json 문자열을 받아 dependencies에 추가.
 */
export function addSupabaseDependency(packageJsonContent: string): string {
  try {
    const pkg = JSON.parse(packageJsonContent);
    if (!pkg.dependencies) pkg.dependencies = {};
    if (!pkg.dependencies["@supabase/supabase-js"]) {
      pkg.dependencies["@supabase/supabase-js"] = "^2";
    }
    return JSON.stringify(pkg, null, 2) + "\n";
  } catch {
    // JSON 파싱 실패 시 원본 그대로 반환
    return packageJsonContent;
  }
}
