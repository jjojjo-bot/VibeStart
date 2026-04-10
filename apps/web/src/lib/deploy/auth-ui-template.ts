/**
 * (마)-5용 Auth UI HTML 생성.
 *
 * (라)-4에서 push한 단순 랜딩 index.html을 덮어쓰고, Supabase JS SDK를 CDN에서
 * 로드해 Google 로그인 버튼을 보여준다. Supabase의 detectSessionInUrl 기본값이
 * true이므로 OAuth 리다이렉트 복귀 시 세션이 자동 감지되고 localStorage에
 * 저장된다. 별도 callback 페이지가 필요 없다.
 *
 * 보안 고려:
 *  - Supabase anon key는 공개 키다 (RLS로 보호된다는 전제). 프론트엔드 HTML에
 *    노출돼도 설계상 문제 없음.
 *  - supabaseUrl / anonKey / projectName은 서버에서 받은 문자열을 HTML에 그대로
 *    임베드하므로 XSS 방지를 위해 반드시 이스케이프.
 *
 * 의존성 없는 순수 함수 — 테스트 가능.
 */

export interface AuthUiTemplateInput {
  projectName: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJsString(s: string): string {
  // JSON.stringify는 따옴표/개행/백슬래시를 모두 안전하게 처리하고 유효한
  // JS 문자열 리터럴을 만든다. </script> 시퀀스만 추가로 분리한다.
  return JSON.stringify(s).replace(/<\/script>/gi, '<\\/script>');
}

export function buildAuthUiHtml(input: AuthUiTemplateInput): string {
  const safeName = escapeHtml(input.projectName);
  const jsUrl = escapeJsString(input.supabaseUrl);
  const jsKey = escapeJsString(input.supabaseAnonKey);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-950 text-white antialiased">
  <div class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
    <div class="mx-auto w-full max-w-md">
      <div id="badge" class="mb-6 inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
        Live on the internet
      </div>
      <h1 class="text-5xl font-bold tracking-tight sm:text-6xl">
        ${safeName}
      </h1>
      <p id="subtitle" class="mt-4 text-lg text-gray-400">
        로그인해서 시작해보세요
      </p>

      <!-- 로그아웃 상태 UI -->
      <div id="signed-out" class="mt-10 hidden">
        <button id="login-btn" type="button"
          class="inline-flex items-center gap-3 rounded-lg bg-white px-6 py-3 text-base font-medium text-gray-900 shadow transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60">
          <svg class="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18A10.997 10.997 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
          </svg>
          <span>Google로 로그인</span>
        </button>
        <p class="mt-3 text-xs text-gray-600">
          처음이면 자동으로 가입돼요
        </p>
      </div>

      <!-- 로그인 상태 UI -->
      <div id="signed-in" class="mt-10 hidden">
        <div class="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
          <div class="text-sm text-gray-500">환영합니다</div>
          <div id="user-email" class="mt-1 text-lg font-medium text-emerald-400"></div>
          <button id="logout-btn" type="button"
            class="mt-4 rounded-md border border-gray-700 bg-gray-900 px-4 py-2 text-sm text-gray-300 transition hover:border-gray-600 hover:bg-gray-800">
            로그아웃
          </button>
        </div>
      </div>

      <!-- 에러 표시 -->
      <div id="error-box" class="mt-6 hidden rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400"></div>

      <p class="mt-12 text-xs text-gray-600">
        Built with <a href="https://vibestart.com" class="underline underline-offset-2 hover:text-gray-400">VibeStart</a>
      </p>
    </div>
  </div>

  <script type="module">
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

    const SUPABASE_URL = ${jsUrl};
    const SUPABASE_ANON_KEY = ${jsKey};

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    });

    const signedOutEl = document.getElementById('signed-out');
    const signedInEl = document.getElementById('signed-in');
    const userEmailEl = document.getElementById('user-email');
    const errorBoxEl = document.getElementById('error-box');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    function showError(msg) {
      errorBoxEl.textContent = msg;
      errorBoxEl.classList.remove('hidden');
    }

    function clearError() {
      errorBoxEl.textContent = '';
      errorBoxEl.classList.add('hidden');
    }

    function render(session) {
      clearError();
      if (session && session.user) {
        signedOutEl.classList.add('hidden');
        signedInEl.classList.remove('hidden');
        userEmailEl.textContent = session.user.email || session.user.id;
      } else {
        signedOutEl.classList.remove('hidden');
        signedInEl.classList.add('hidden');
        userEmailEl.textContent = '';
      }
    }

    loginBtn.addEventListener('click', async () => {
      clearError();
      loginBtn.disabled = true;
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        });
        if (error) throw error;
      } catch (err) {
        loginBtn.disabled = false;
        showError('로그인 시작에 실패했어요: ' + (err && err.message ? err.message : String(err)));
      }
    });

    logoutBtn.addEventListener('click', async () => {
      clearError();
      logoutBtn.disabled = true;
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (err) {
        showError('로그아웃에 실패했어요: ' + (err && err.message ? err.message : String(err)));
      } finally {
        logoutBtn.disabled = false;
      }
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      render(session);
    });

    // 초기 세션 조회 + OAuth 리다이렉트 복귀 처리
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        render(data.session);
      } catch (err) {
        render(null);
        showError('세션 확인에 실패했어요: ' + (err && err.message ? err.message : String(err)));
      }
    })();
  </script>
</body>
</html>`;
}
