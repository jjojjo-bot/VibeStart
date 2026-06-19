-- B′ 화면 4 — 퍼블리시: 발행 페이지 저장.
--
-- 익명 발행(owner_id null, expires_at = 발행 + TTL) → 가입 시 claim(owner_id 지정,
-- expires_at = null로 영구화). 접근은 전부 서버의 service-role 클라이언트로만 —
-- 공개 anon/authenticated 정책을 두지 않아 RLS로 직접 접근을 차단한다.
-- (service_role 키는 RLS를 우회하므로 서버 코드가 검증·레이트리밋을 책임진다.)

create table if not exists public.published_pages (
  slug         text primary key,
  template_id  text not null,
  values       jsonb not null default '{}'::jsonb,
  owner_id     uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz
);

-- 만료 청소·소유자 조회용 인덱스.
create index if not exists published_pages_expires_at_idx on public.published_pages (expires_at);
create index if not exists published_pages_owner_id_idx on public.published_pages (owner_id);

-- RLS 활성화 + 공개 정책 없음 → anon/authenticated 직접 접근 차단.
-- 모든 읽기/쓰기는 서버의 service-role 클라이언트(RLS 우회)로만 일어난다.
alter table public.published_pages enable row level security;

-- 만료된 익명 페이지 청소(주기 실행 권장: pg_cron 또는 외부 스케줄러).
--   delete from public.published_pages
--   where owner_id is null and expires_at is not null and expires_at <= now();
