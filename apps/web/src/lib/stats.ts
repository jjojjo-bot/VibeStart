import { supabase } from "./supabase";

export interface DailyStat {
  date: string;
  visitors: number;
  completions: number;
}

export interface SiteStats {
  today: DailyStat;
  totalVisitors: number;
  totalCompletions: number;
  daily: DailyStat[];
}

export async function getSiteStats(): Promise<SiteStats> {
  const { data, error } = await supabase
    .from("daily_stats")
    .select("date, visitors, completions")
    .order("date", { ascending: true })
    .limit(30);

  if (error || !data || data.length === 0) {
    return {
      today: { date: new Date().toISOString().slice(0, 10), visitors: 0, completions: 0 },
      totalVisitors: 0,
      totalCompletions: 0,
      daily: [],
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayRow = data.find((row) => row.date === today) ?? {
    date: today,
    visitors: 0,
    completions: 0,
  };

  const totalVisitors = data.reduce((sum, row) => sum + row.visitors, 0);
  const totalCompletions = data.reduce((sum, row) => sum + row.completions, 0);

  return {
    today: todayRow,
    totalVisitors,
    totalCompletions,
    daily: data,
  };
}

export async function incrementVisitors(): Promise<void> {
  await supabase.rpc("increment_daily_stat", { stat_type: "visitors" });
}

export async function incrementCompletions(): Promise<void> {
  await supabase.rpc("increment_daily_stat", { stat_type: "completions" });
}
