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

  const data = dailyResult.data;
  const countryData = countryResult.data;

  const emptyToday = { date: new Date().toISOString().slice(0, 10), visitors: 0, completions: 0 };

  if (!data || data.length === 0) {
    return {
      today: emptyToday,
      totalVisitors: 0,
      totalCompletions: 0,
      daily: [],
      dailyCountries: [],
    };
  }

  const today = new Date().toISOString().slice(0, 10);
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
