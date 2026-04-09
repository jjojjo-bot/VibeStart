-- VibeStart Phase 2a — 통계 테이블을 vibestart-auth Supabase로 통합
--
-- 배경:
-- 2026-04-08 결정: 통계와 사용자 데이터를 물리적으로 분리해 두 개의 Supabase
-- 프로젝트를 운영하기로 했으나, Supabase Free 플랜의 organization당 active
-- 프로젝트 2개 한도로 인해 (마)-2 단계에서 사용자가 자기 사이트용 Supabase
-- 프로젝트를 만들 슬롯이 부족해졌다.
--
-- 해결: 통계 테이블을 vibestart-auth로 옮긴다. RLS로 익명 read/익명 RPC 쓰기를
-- 명시적으로 허용해 보안 손실 없이 vibestart 프로젝트를 삭제 → 슬롯 1개 확보.
--
-- 이 SQL은 vibestart-auth Supabase 프로젝트의 SQL Editor에서 한 번 실행한다.
--
-- 옮기는 대상 (현재 코드가 사용하는 것만):
--   - daily_stats (일별 시작자/완료자 카운트, KST 기준)
--   - daily_country_stats (일별 국가별 카운트, KST 기준)
--   - increment_daily_stat(text)
--   - increment_daily_country_stat(text, text)
--
-- 옮기지 않는 것 (현재 코드 미사용):
--   - 구 stats 전역 카운터, country_stats 누적 카운터 — phase1 잔재. 옛
--     vibestart 프로젝트 삭제 시 함께 사라짐.
--
-- 실행 순서:
--   1. 이 SQL 전체를 vibestart-auth SQL Editor에서 실행
--   2. 옛 vibestart의 daily_stats / daily_country_stats 데이터를 export
--   3. 이 프로젝트(vibestart-auth)에 import
--   4. 검증 후 옛 vibestart 프로젝트 삭제

-- ─────────────────────────────────────────────────────────────
-- daily_stats: 일별 시작자/완료자 (KST 기준)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.daily_stats (
  date date primary key default current_date,
  visitors bigint not null default 0,
  completions bigint not null default 0
);

create or replace function public.increment_daily_stat(stat_type text)
returns void as $$
declare
  kst_today date := (now() at time zone 'Asia/Seoul')::date;
begin
  insert into public.daily_stats (date, visitors, completions)
  values (kst_today, 0, 0)
  on conflict (date) do nothing;

  if stat_type = 'visitors' then
    update public.daily_stats set visitors = visitors + 1 where date = kst_today;
  elsif stat_type = 'completions' then
    update public.daily_stats set completions = completions + 1 where date = kst_today;
  end if;
end;
$$ language plpgsql security definer;

alter table public.daily_stats enable row level security;

-- 누구나 읽을 수 있다 (랜딩 페이지 통계 표시용 — 익명 anon key로 SELECT)
drop policy if exists "Anyone can read daily_stats" on public.daily_stats;
create policy "Anyone can read daily_stats"
  on public.daily_stats for select
  using (true);

-- 쓰기는 RPC 함수(security definer)로만 가능. 익명/인증 사용자에게 실행권한.
grant execute on function public.increment_daily_stat(text) to anon;
grant execute on function public.increment_daily_stat(text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- daily_country_stats: 일별 국가별 (KST 기준)
-- ─────────────────────────────────────────────────────────────

create table if not exists public.daily_country_stats (
  date date not null default current_date,
  country_code text not null,
  visitors bigint not null default 0,
  completions bigint not null default 0,
  primary key (date, country_code)
);

create or replace function public.increment_daily_country_stat(
  p_country_code text,
  stat_type text
)
returns void as $$
declare
  kst_today date := (now() at time zone 'Asia/Seoul')::date;
begin
  insert into public.daily_country_stats (date, country_code, visitors, completions)
  values (kst_today, p_country_code, 0, 0)
  on conflict (date, country_code) do nothing;

  if stat_type = 'visitors' then
    update public.daily_country_stats
      set visitors = visitors + 1
      where date = kst_today and country_code = p_country_code;
  elsif stat_type = 'completions' then
    update public.daily_country_stats
      set completions = completions + 1
      where date = kst_today and country_code = p_country_code;
  end if;
end;
$$ language plpgsql security definer;

alter table public.daily_country_stats enable row level security;

drop policy if exists "Anyone can read daily_country_stats" on public.daily_country_stats;
create policy "Anyone can read daily_country_stats"
  on public.daily_country_stats for select
  using (true);

grant execute on function public.increment_daily_country_stat(text, text) to anon;
grant execute on function public.increment_daily_country_stat(text, text) to authenticated;

-- ─────────────────────────────────────────────────────────────
-- 검증 쿼리 (마이그레이션 후 SQL Editor에서 수동 실행)
-- ─────────────────────────────────────────────────────────────
-- 1) 테이블 존재 확인
--    select tablename from pg_tables where schemaname='public' and tablename like 'daily_%';
-- 2) RLS 활성화 확인
--    select tablename, rowsecurity from pg_tables where schemaname='public' and tablename like 'daily_%';
-- 3) 함수 권한 확인
--    select proname, proacl from pg_proc where proname like 'increment_%';
-- 4) RPC 호출 테스트
--    select public.increment_daily_stat('visitors');
--    select public.increment_daily_country_stat('KR', 'visitors');
--    select * from public.daily_stats;
--    select * from public.daily_country_stats;
