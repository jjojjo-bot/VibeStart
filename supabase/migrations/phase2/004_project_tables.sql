-- 004_project_tables.sql
-- Phase 2b: in-memory store → Supabase DB 이관
-- 프로젝트, 서브스텝 완료 상태, 외부 리소스를 영구 저장한다.

-- ============================================================
-- 1. projects
-- ============================================================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  slug text not null,
  track text not null,                -- 'static' | 'dynamic' | 'ai' | 'ecommerce'
  current_milestone int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 사용자별 프로젝트 목록 조회 최적화
create index if not exists idx_projects_user_id on public.projects(user_id);

alter table public.projects enable row level security;

-- 본인 프로젝트만 SELECT/INSERT/UPDATE/DELETE
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can create own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- ============================================================
-- 2. completed_substeps
-- ============================================================
create table if not exists public.completed_substeps (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  milestone_id text not null,
  substep_id text not null,
  completed_at timestamptz not null default now(),
  unique (project_id, milestone_id, substep_id)
);

-- 프로젝트+마일스톤 기준 조회 최적화
create index if not exists idx_completed_substeps_project_milestone
  on public.completed_substeps(project_id, milestone_id);

alter table public.completed_substeps enable row level security;

-- RLS: projects 테이블을 조인해서 본인 프로젝트의 substep만 접근
create policy "Users can view own substeps"
  on public.completed_substeps for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = completed_substeps.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own substeps"
  on public.completed_substeps for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = completed_substeps.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own substeps"
  on public.completed_substeps for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = completed_substeps.project_id
        and projects.user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. project_resources
-- ============================================================
create table if not exists public.project_resources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  provider text not null,             -- 'github' | 'vercel' | 'supabase_mgmt' | 'google'
  resource_type text not null,        -- 'github_repo' | 'vercel_project' | 'supabase_project' | 'google_oauth_keys'
  external_id text not null,
  url text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- (project_id, resource_type, external_id) 유니크 — idempotent upsert용
create unique index if not exists idx_project_resources_unique
  on public.project_resources(project_id, resource_type, external_id);

-- 프로젝트별 리소스 조회 최적화
create index if not exists idx_project_resources_project_id
  on public.project_resources(project_id);

alter table public.project_resources enable row level security;

create policy "Users can view own resources"
  on public.project_resources for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_resources.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own resources"
  on public.project_resources for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = project_resources.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own resources"
  on public.project_resources for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_resources.project_id
        and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own resources"
  on public.project_resources for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = project_resources.project_id
        and projects.user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. updated_at 자동 갱신 트리거 (projects)
-- ============================================================
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row
  execute function public.update_updated_at_column();
