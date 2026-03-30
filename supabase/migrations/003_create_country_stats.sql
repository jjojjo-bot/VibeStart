-- 국가별 통계 테이블
create table if not exists country_stats (
  country_code text primary key,
  visitors bigint not null default 0,
  completions bigint not null default 0
);

-- 국가별 카운터 증가 함수 (동시성 안전, upsert)
create or replace function increment_country_stat(p_country_code text, stat_type text)
returns void as $$
begin
  insert into country_stats (country_code, visitors, completions)
  values (p_country_code, 0, 0)
  on conflict (country_code) do nothing;

  if stat_type = 'visitors' then
    update country_stats set visitors = visitors + 1 where country_code = p_country_code;
  elsif stat_type = 'completions' then
    update country_stats set completions = completions + 1 where country_code = p_country_code;
  end if;
end;
$$ language plpgsql security definer;

-- RLS 설정
alter table country_stats enable row level security;

create policy "Anyone can read country_stats"
  on country_stats for select
  using (true);

-- 실행 권한
grant execute on function increment_country_stat(text, text) to anon;
grant execute on function increment_country_stat(text, text) to authenticated;
