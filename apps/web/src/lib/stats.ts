import { supabase } from "./supabase";

export interface DailyStat {
  date: string;
  visitors: number;
  completions: number;
}

export interface CountryStat {
  countryCode: string;
  visitors: number;
  completions: number;
}

export interface DailyCountryStat {
  date: string;
  countryCode: string;
  visitors: number;
  completions: number;
}

export interface SiteStats {
  today: DailyStat;
  totalVisitors: number;
  totalCompletions: number;
  daily: DailyStat[];
  dailyCountries: DailyCountryStat[];
}

/** KST(UTC+9) 기준 오늘 날짜를 YYYY-MM-DD 형식으로 반환 */
function getKSTToday(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export async function getSiteStats(): Promise<SiteStats> {
  const [dailyResult, countryResult] = await Promise.all([
    supabase
      .from("daily_stats")
      .select("date, visitors, completions")
      .order("date", { ascending: true })
      .limit(365),
    supabase
      .from("daily_country_stats")
      .select("date, country_code, visitors, completions")
      .order("date", { ascending: true })
      .limit(3650),
  ]);

  // Supabase 에러는 dailyResult.error에 담겨 내려오므로 null data만으로는
  // 환경변수 누락 같은 문제를 감지할 수 없다. 에러가 있으면 로그로 남겨
  // 브라우저 콘솔에서 원인 파악이 가능하게 한다.
  if (dailyResult.error) {
    console.error("[getSiteStats] daily_stats fetch failed", {
      message: dailyResult.error.message,
      code: dailyResult.error.code,
    });
  }
  if (countryResult.error) {
    console.error("[getSiteStats] daily_country_stats fetch failed", {
      message: countryResult.error.message,
      code: countryResult.error.code,
    });
  }

  const data = dailyResult.data;
  const countryData = countryResult.data;

  const today = getKSTToday();
  const emptyToday = { date: today, visitors: 0, completions: 0 };

  if (!data || data.length === 0) {
    return {
      today: emptyToday,
      totalVisitors: 0,
      totalCompletions: 0,
      daily: [],
      dailyCountries: [],
    };
  }
  const todayRow = data.find((row) => row.date === today) ?? emptyToday;

  const totalVisitors = data.reduce((sum, row) => sum + row.visitors, 0);
  const totalCompletions = data.reduce((sum, row) => sum + row.completions, 0);

  const dailyCountries: DailyCountryStat[] = (countryData ?? []).map((row) => ({
    date: row.date,
    countryCode: row.country_code,
    visitors: row.visitors,
    completions: row.completions,
  }));

  return {
    today: todayRow,
    totalVisitors,
    totalCompletions,
    daily: data,
    dailyCountries,
  };
}

export async function incrementVisitors(): Promise<void> {
  await fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "visitors" }),
  });
}

export async function incrementCompletions(): Promise<void> {
  await fetch("/api/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "completions" }),
  });
}
