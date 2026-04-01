-- 일별 통계: current_date(UTC) → KST(Asia/Seoul) 기준으로 변경
create or replace function increment_daily_stat(stat_type text)
returns void as $$
declare
  kst_today date := (now() at time zone 'Asia/Seoul')::date;
begin
  insert into daily_stats (date, visitors, completions)
  values (kst_today, 0, 0)
  on conflict (date) do nothing;

  if stat_type = 'visitors' then
    update daily_stats set visitors = visitors + 1 where date = kst_today;
  elsif stat_type = 'completions' then
    update daily_stats set completions = completions + 1 where date = kst_today;
  end if;
end;
$$ language plpgsql security definer;

-- 일별 국가별 통계: current_date(UTC) → KST(Asia/Seoul) 기준으로 변경
create or replace function increment_daily_country_stat(p_country_code text, stat_type text)
returns void as $$
declare
  kst_today date := (now() at time zone 'Asia/Seoul')::date;
begin
  insert into daily_country_stats (date, country_code, visitors, completions)
  values (kst_today, p_country_code, 0, 0)
  on conflict (date, country_code) do nothing;

  if stat_type = 'visitors' then
    update daily_country_stats
      set visitors = visitors + 1
      where date = kst_today and country_code = p_country_code;
  elsif stat_type = 'completions' then
    update daily_country_stats
      set completions = completions + 1
      where date = kst_today and country_code = p_country_code;
  end if;
end;
$$ language plpgsql security definer;
