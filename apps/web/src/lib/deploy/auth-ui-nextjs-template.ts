/**
 * (마)-5용 Next.js Auth UI 생성.
 *
 * 기존 index.html 방식을 대체. Next.js App Router 프로젝트의 소스 파일을
 * 직접 생성하여 GitHub에 push한다. 3개 파일을 생성:
 *
 *   1. src/lib/supabase.ts — Supabase browser client 설정
 *   2. src/app/page.tsx — Google 로그인 UI (클라이언트 컴포넌트)
 *   3. src/app/auth/callback/route.ts — OAuth callback 처리
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
 * src/app/page.tsx — Google 로그인 UI
 */
export function buildPageTsx(input: NextJsAuthTemplateInput): string {
  const safeName = escapeBacktick(input.projectName);

  return `"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error: err }) => {
      if (err) setError(err.message);
      else setSession(data.session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
    if (error) setError(error.message);
  };

  const handleLogout = async () => {
    setError(null);
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-6 text-center text-white">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-6 inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
          Live on the internet
        </div>
        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          ${safeName}
        </h1>

        {!session ? (
          <div className="mt-10">
            <button
              onClick={handleLogin}
              className="inline-flex items-center gap-3 rounded-lg bg-white px-6 py-3 text-base font-medium text-zinc-900 shadow transition hover:bg-zinc-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.997 10.997 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Google로 로그인
            </button>
            <p className="mt-3 text-xs text-zinc-600">
              처음이면 자동으로 가입돼요
            </p>
          </div>
        ) : (
          <div className="mt-10">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <p className="text-sm text-zinc-500">환영합니다</p>
              <p className="mt-1 text-lg font-medium text-emerald-400">
                {session.user.email}
              </p>
              <button
                onClick={handleLogout}
                className="mt-4 rounded-md border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800"
              >
                로그아웃
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <p className="mt-12 text-xs text-zinc-600">
          Built with{" "}
          <a
            href="https://vibe-start.com"
            className="underline underline-offset-2 hover:text-zinc-400"
          >
            VibeStart
          </a>
        </p>
      </div>
    </div>
  );
}
`;
}

/**
 * src/app/auth/callback/route.ts — OAuth callback
 *
 * Supabase OAuth는 리다이렉트 후 URL fragment(#)에 토큰이 오는데,
 * Next.js에서는 이를 처리하기 위한 callback route가 필요하다.
 * 클라이언트에서 supabase.auth.exchangeCodeForSession()을 호출한다.
 */
export function buildAuthCallbackRoute(input: NextJsAuthTemplateInput): string {
  return `import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "${escapeBacktick(input.supabaseUrl)}";
const supabaseAnonKey = "${escapeBacktick(input.supabaseAnonKey)}";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(origin);
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
