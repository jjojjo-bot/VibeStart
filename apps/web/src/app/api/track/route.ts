import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const VALID_TYPES = new Set(["visitors", "completions"]);

const BOT_PATTERN = /bot|crawler|spider|crawling|googlebot|bingbot|yandex|baidu|duckduck|slurp|ia_archiver|facebookexternalhit|twitterbot|linkedinbot|semrush|ahref|mj12bot|dotbot|petalbot|bytespider/i;

function isBot(ua: string | null): boolean {
  if (!ua) return true;
  return BOT_PATTERN.test(ua);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ua = request.headers.get("user-agent");
  if (isBot(ua)) {
    return NextResponse.json({ ok: true });
  }

  const body = (await request.json()) as { type?: string };
  const statType = body.type;

  if (!statType || !VALID_TYPES.has(statType)) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  // Vercel이 자동으로 제공하는 IP 기반 국가코드
  const countryCode = request.headers.get("x-vercel-ip-country") ?? undefined;

  // daily_stats 증가. 에러는 로그만 남기고 응답은 200 유지 —
  // 통계 기록 실패가 사용자 플로우(예: /complete 렌더)를 깨지 않도록.
  // 반드시 console.error로 찍어 Vercel 로그에 잡히게 한다.
  const { error: dailyErr } = await supabase.rpc("increment_daily_stat", {
    stat_type: statType,
  });
  if (dailyErr) {
    console.error("[api/track] increment_daily_stat failed", {
      statType,
      message: dailyErr.message,
      code: dailyErr.code,
    });
  }

  // daily_country_stats 증가 (국가코드가 있을 때만)
  if (countryCode && countryCode !== "XX") {
    const { error: countryErr } = await supabase.rpc(
      "increment_daily_country_stat",
      {
        p_country_code: countryCode,
        stat_type: statType,
      },
    );
    if (countryErr) {
      console.error("[api/track] increment_daily_country_stat failed", {
        statType,
        countryCode,
        message: countryErr.message,
        code: countryErr.code,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
