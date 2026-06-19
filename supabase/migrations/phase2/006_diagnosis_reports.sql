-- #13② 에스컬레이션 전송: 진단이 '모름'일 때 사용자가 붙여넣은(마스킹된) 출력을 수집.
--
-- 미인식 실패의 원본 재료 — 이후 새 진단 규칙·시그니처(③④)로 자란다.
-- 개인정보는 클라이언트·서버 양쪽에서 maskSensitive로 가린 뒤에만 저장한다.
-- 접근은 서버의 service-role 클라이언트로만(공개 정책 없음).

create table if not exists public.diagnosis_reports (
  id            uuid primary key default gen_random_uuid(),
  step          text,
  masked_output text not null,
  locale        text,
  created_at    timestamptz not null default now()
);

create index if not exists diagnosis_reports_created_at_idx on public.diagnosis_reports (created_at);

alter table public.diagnosis_reports enable row level security;
-- 공개 정책 없음 → anon/authenticated 직접 접근 차단(서버 service-role만).
