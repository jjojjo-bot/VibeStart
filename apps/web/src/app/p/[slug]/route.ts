/**
 * 발행 페이지 서빙 — /p/{slug}.
 *
 * 저장된 templateId + 값을 결정론적으로 렌더(renderTemplate, XSS-safe)해 완전한
 * HTML 문서를 그대로 내보낸다. locale 무관(사용자 콘텐츠)이라 proxy.ts 매처에서
 * 제외돼 next-intl을 타지 않는다. 없거나 만료면 친화 404.
 */

import type { NextRequest } from "next/server";
import { getTemplate, renderTemplate } from "@vibestart/template-catalog";

import { getPublishedPage } from "@/lib/publish/published-page-store";

function notFound(): Response {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>페이지를 찾을 수 없어요</title><style>body{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#0a0d15;color:#e6e9ef}.box{text-align:center;padding:2rem}a{color:#7aa2ff}</style></head><body><div class="box"><h1>페이지를 찾을 수 없어요</h1><p>주소가 틀렸거나, 임시 페이지가 만료됐을 수 있어요.</p><p><a href="/start">내 페이지 만들어보기 →</a></p></div></body></html>`;
  return new Response(html, {
    status: 404,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) return notFound();

  const tpl = getTemplate(page.templateId);
  if (!tpl) return notFound();

  const html = renderTemplate(tpl, page.values);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      // 만료·클레임 상태가 즉시 반영되도록 캐시하지 않는다(MVP).
      "cache-control": "no-store",
    },
  });
}
