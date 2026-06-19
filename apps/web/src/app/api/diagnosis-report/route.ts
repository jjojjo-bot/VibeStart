/**
 * 진단 에스컬레이션 전송 — /api/diagnosis-report.
 *
 * POST { step?, output, locale? } → (마스킹 후) 저장. 진단 '모름'에서 사용자가
 * 보낸 출력을 수집한다. 공개 엔드포인트라 best-effort 레이트리밋 + 길이 상한.
 * 마스킹은 저장소가 한 번 더 수행(서버 방어).
 */

import { NextRequest, NextResponse } from "next/server";

import { saveDiagnosisReport } from "@/lib/diagnosis/report-store";

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > MAX_PER_WINDOW;
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-vercel-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: { step?: unknown; output?: unknown; locale?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const output = typeof body.output === "string" ? body.output : "";
  if (output.trim().length === 0) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const saved = await saveDiagnosisReport({
    step: typeof body.step === "string" ? body.step : undefined,
    output,
    locale: typeof body.locale === "string" ? body.locale : undefined,
  });

  return NextResponse.json({ ok: saved }, { status: saved ? 200 : 503 });
}
