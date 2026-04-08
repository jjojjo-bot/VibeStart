-- VibeStart Phase 2a (라)-1 — OAuth 토큰 평문 컬럼 임시 도입
--
-- 001_init.sql은 oauth_connections.access_token_id가 vault.secrets(id)를
-- 참조하도록 설계되어 있으나, Supabase Vault(pgsodium)는 별도 설정이
-- 필요해 MVP에 부담이다. Phase 2a 기간 동안 평문 컬럼을 써서 OAuth 플로우를
-- 먼저 검증하고, Phase 2b에서 Vault로 이관한다.
--
-- 실행 위치: Phase 2 사용자 Supabase 프로젝트 SQL Editor
-- 전제 조건: 001_init.sql이 이미 실행되어 있어야 함

-- Vault 참조 컬럼 제거
alter table public.oauth_connections
  drop column if exists access_token_id,
  drop column if exists refresh_token_id;

-- 평문 토큰 컬럼 추가 (nullable로 우선 추가해 빈 테이블에서도 안전)
alter table public.oauth_connections
  add column if not exists access_token text,
  add column if not exists refresh_token text,
  add column if not exists provider_user_id text,
  add column if not exists provider_username text;

-- 빈 테이블이므로 access_token NOT NULL 제약 추가 가능
alter table public.oauth_connections
  alter column access_token set not null;

-- RLS 정책은 001_init.sql에서 이미 정의됨 (oauth owner all)
-- 새 컬럼도 기존 정책으로 자동 보호된다.

comment on column public.oauth_connections.access_token is
  'Phase 2a: 평문 저장. Phase 2b에서 pgsodium Vault로 이관 예정';
comment on column public.oauth_connections.refresh_token is
  'Phase 2a: 평문 저장. GitHub는 refresh token 미발급이라 주로 null';
comment on column public.oauth_connections.provider_user_id is
  '외부 서비스에서의 사용자 ID (예: GitHub user id). UI 표시용';
comment on column public.oauth_connections.provider_username is
  '외부 서비스에서의 사용자명 (예: GitHub login). UI 표시용';
