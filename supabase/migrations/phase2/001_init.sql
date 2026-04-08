-- VibeStart Phase 2 — 사용자/프로젝트/마일스톤/OAuth 초기 스키마
--
-- 실행 위치: 기존 통계용 Supabase 프로젝트가 아닌 "새로 만든" Supabase 프로젝트
--           (결정일 2026-04-08 — 통계와 사용자 데이터는 분리해 운영)
--
-- 실행 방법: Supabase 대시보드 → SQL Editor에서 이 파일 내용을 붙여넣고 Run

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================================
-- users — Supabase Auth의 auth.users를 확장하는 public 프로필 테이블
-- =============================================================================
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =============================================================================
-- projects — 사용자가 만든 프로젝트 (Phase 2 진행 단위)
-- =============================================================================
do $$ begin
  create type project_track as enum ('static', 'dynamic', 'ai', 'ecommerce');
exception when duplicate_object then null; end $$;

create table if not exists public.projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  slug text not null,
  track project_track not null,
  current_milestone int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists idx_projects_user on public.projects(user_id);

-- =============================================================================
-- milestone_status — 프로젝트별 마일스톤 진행 상태
-- =============================================================================
do $$ begin
  create type milestone_state as enum ('locked', 'in_progress', 'completed', 'failed');
exception when duplicate_object then null; end $$;

create table if not exists public.milestone_status (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone_id text not null,            -- 'm1-deploy', 'm2-google-auth', ...
  state milestone_state not null default 'locked',
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (project_id, milestone_id)
);

create index if not exists idx_milestone_project on public.milestone_status(project_id);

-- =============================================================================
-- oauth_connections — 외부 서비스 OAuth 토큰 (Vault secret id만 저장)
-- =============================================================================
do $$ begin
  create type oauth_provider as enum (
    'github', 'vercel', 'supabase_mgmt', 'cloudflare', 'resend', 'sentry'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.oauth_connections (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider oauth_provider not null,
  access_token_id uuid not null,         -- vault.secrets.id 참조 (평문 토큰은 저장 금지)
  refresh_token_id uuid,
  scope text not null default '',
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,  -- team_id, org_slug 등
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

-- =============================================================================
-- project_resources — vibestart가 사용자 대신 만들어준 외부 리소스 추적
-- =============================================================================
do $$ begin
  create type resource_type as enum (
    'github_repo', 'vercel_project', 'supabase_project',
    'r2_bucket', 'resend_domain', 'sentry_project', 'domain'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.project_resources (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider oauth_provider not null,
  resource_type resource_type not null,
  external_id text not null,
  url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_resources_project on public.project_resources(project_id);

-- =============================================================================
-- 트리거: updated_at 자동 갱신
-- =============================================================================
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists users_updated on public.users;
create trigger users_updated
  before update on public.users
  for each row execute function public.set_updated_at();

drop trigger if exists projects_updated on public.projects;
create trigger projects_updated
  before update on public.projects
  for each row execute function public.set_updated_at();

-- =============================================================================
-- 트리거: auth.users에 사용자가 생기면 public.users 행도 함께 생성
-- =============================================================================
create or replace function public.handle_new_user() returns trigger as $$
begin
  insert into public.users (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- RLS — 사용자는 본인 데이터만 본다
-- =============================================================================
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.milestone_status enable row level security;
alter table public.oauth_connections enable row level security;
alter table public.project_resources enable row level security;

drop policy if exists "users self read" on public.users;
create policy "users self read"
  on public.users for select using (id = auth.uid());

drop policy if exists "users self update" on public.users;
create policy "users self update"
  on public.users for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "projects owner all" on public.projects;
create policy "projects owner all"
  on public.projects for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "milestone via project" on public.milestone_status;
create policy "milestone via project"
  on public.milestone_status for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "oauth owner all" on public.oauth_connections;
create policy "oauth owner all"
  on public.oauth_connections for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "resources via project" on public.project_resources;
create policy "resources via project"
  on public.project_resources for all
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );
