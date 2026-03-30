-- 일별 국가별 통계 테이블
create table if not exists daily_country_stats (
  date date not null default current_date,
  country_code text not null,
  visitors bigint not null default 0,
  completions bigint not null default 0,
  primary key (date, country_code)
);

-- 일별 국가별 카운터 증가 함수 (동시성 안전, upsert)
create or replace function increment_daily_country_stat(p_country_code text, stat_type text)
returns void as $$
begin
  insert into daily_country_stats (date, country_code, visitors, completions)
  values (current_date, p_country_code, 0, 0)
  on conflict (date, country_code) do nothing;

  if stat_type = 'visitors' then
    update daily_country_stats
      set visitors = visitors + 1
      where date = current_date and country_code = p_country_code;
  elsif stat_type = 'completions' then
    update daily_country_stats
      set completions = completions + 1
      where date = current_date and country_code = p_country_code;
  end if;
end;
$$ language plpgsql security definer;

-- RLS 설정
alter table daily_country_stats enable row level security;

create policy "Anyone can read daily_country_stats"
  on daily_country_stats for select
  using (true);

-- 실행 권한
grant execute on function increment_daily_country_stat(text, text) to anon;
grant execute on function increment_daily_country_stat(text, text) to authenticated;
