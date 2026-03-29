-- 통계 카운터 테이블
create table if not exists stats (
  id text primary key,
  count bigint not null default 0
);

-- 초기 데이터
insert into stats (id, count) values ('visitors', 0) on conflict do nothing;
insert into stats (id, count) values ('completions', 0) on conflict do nothing;

-- 카운터 증가 함수 (동시성 안전)
create or replace function increment_stat(stat_id text)
returns void as $$
begin
  update stats set count = count + 1 where id = stat_id;
end;
$$ language plpgsql security definer;

-- 누구나 읽기 가능, 증가는 RPC로만
alter table stats enable row level security;

create policy "Anyone can read stats"
  on stats for select
  using (true);

-- RPC 함수 실행 권한
grant execute on function increment_stat(text) to anon;
grant execute on function increment_stat(text) to authenticated;
