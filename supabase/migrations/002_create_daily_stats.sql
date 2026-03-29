-- 일별 통계 테이블
create table if not exists daily_stats (
  date date primary key default current_date,
  visitors bigint not null default 0,
  completions bigint not null default 0
);

-- 일별 카운터 증가 함수 (동시성 안전, 오늘 날짜 자동)
create or replace function increment_daily_stat(stat_type text)
returns void as $$
begin
  insert into daily_stats (date, visitors, completions)
  values (current_date, 0, 0)
  on conflict (date) do nothing;

  if stat_type = 'visitors' then
    update daily_stats set visitors = visitors + 1 where date = current_date;
  elsif stat_type = 'completions' then
    update daily_stats set completions = completions + 1 where date = current_date;
  end if;
end;
$$ language plpgsql security definer;

-- RLS 설정
alter table daily_stats enable row level security;

create policy "Anyone can read daily_stats"
  on daily_stats for select
  using (true);

-- 실행 권한
grant execute on function increment_daily_stat(text) to anon;
grant execute on function increment_daily_stat(text) to authenticated;
