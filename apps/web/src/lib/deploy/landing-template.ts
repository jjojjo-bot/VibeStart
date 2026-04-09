/**
 * 첫 배포용 랜딩 페이지 HTML 생성.
 *
 * (라)-4에서 사용자의 GitHub repo에 push할 index.html을 만든다. Vercel이
 * 정적 사이트로 배포하면 "친구에게 보낼 수 있는 진짜 *.vercel.app 링크"가
 * 된다. 이후 사용자가 직접 수정해서 push하면 Vercel이 자동 재배포.
 *
 * 의존성 없는 순수 함수 — 테스트 가능.
 */

export function buildLandingHtml(projectName: string): string {
  // XSS 방지: HTML 특수문자 이스케이프
  const safe = projectName
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safe}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-950 text-white antialiased">
  <div class="flex min-h-screen flex-col items-center justify-center px-6 text-center">
    <div class="mx-auto max-w-lg">
      <div class="mb-6 inline-block rounded-full bg-emerald-500/10 px-4 py-1.5 text-sm text-emerald-400">
        Live on the internet
      </div>
      <h1 class="text-5xl font-bold tracking-tight sm:text-6xl">
        ${safe}
      </h1>
      <p class="mt-4 text-lg text-gray-400">
        Coming soon...
      </p>
      <p class="mt-12 text-xs text-gray-600">
        Built with <a href="https://vibestart.com" class="underline underline-offset-2 hover:text-gray-400">VibeStart</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}
