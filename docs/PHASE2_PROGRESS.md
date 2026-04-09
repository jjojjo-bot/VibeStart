# Phase 2a 진행 상황 (M1 + M2 부분)

> VibeStart Phase 2a의 마일스톤별 구현 완료 상태와 남은 작업.
> 다른 기기에서 작업을 이어받을 수 있도록 git에 함께 보관.

**기준 시점**: 2026-04-09. 최신 업데이트는 git log 참조.

## 완료 상태

### M1 배포 트랙 — 풀 사이클 ✅

- (라)-1 GitHub OAuth (`m1-s1-github-oauth`)
- (라)-2 GitHub repo 자동 생성 (`m1-s2-create-repo`, auto_init README)
- (라)-3 Vercel PAT 연결 (`m1-s3-vercel-oauth`, OAuth 대신 PAT — Vercel은 일반 OAuth Integration 차단됨)
- (라)-4 첫 배포 (`m1-s4-first-deploy`, GitHub repo에 index.html push → Vercel 프로젝트 생성 + git link → 자동 배포 → canonical URL 추출)
- (라)-5 verify URL (`m1-s5-verify-url`, deploy 성공 시 다음 verify substep 자동 완료)

### M2 Google Auth 트랙 — 1, 2단계만 완료

- (마)-1 Supabase Management OAuth (`m2-s1-supabase-oauth`) ✅
- (마)-2 Supabase 프로젝트 자동 생성 (`m2-s2-create-supabase-project`) ✅

## 남은 작업 — M2 (마)-3 이후

`packages/track-catalog/src/milestones/m2-google-auth.ts` 카탈로그 기준:

- **(마)-3 `m2-s3-google-oauth-keys`** (kind: `user-action`) — **신규 패턴**. 사용자가 Google Cloud Console에서 OAuth 클라이언트를 만들고 client_id/secret을 vibestart 폼에 붙여넣음. (라)-3 Vercel PAT와 비슷하지만 외부 페이지 안내 + 두 개 값 입력. 새 user-action UI 컴포넌트 필요.
- **(마)-4 `m2-s4-enable-google-provider`** (kind: `auto`) — Supabase Management API로 PATCH /v1/projects/{ref}/config/auth (또는 별도 endpoint)에 Google provider 활성화 + client_id/secret 주입. (마)-2의 supabase_project metadata에서 ref + 연결 토큰 사용.
- **(마)-5 `m2-s5-install-auth-ui`** (kind: `auto`) — GitHub repo에 auth UI 파일들 push (HTML + JS — Supabase JS SDK CDN으로 Google 로그인 버튼 + 콜백 처리). pushFileToGitHub 헬퍼 재사용. supabase_project metadata에서 apiUrl + anon key 필요 → (마)-2에서 anon key는 저장 안 됐으므로 (마)-5에서 추가 API 호출(GET /v1/projects/{ref}/api-keys) 필요.
- **(마)-6 `m2-s6-verify-signup`** (kind: `verify`) — auto-complete 패턴 ((라)-5와 동일).

## 다른 기기에서 작업 이어갈 때 필요한 것

### 환경 변수 (`apps/web/.env.local`)

`.env.local`은 git에 없으니 새 기기에서 별도 셋업 필요. 필수 키 (vibestart-auth Supabase로 통합 후 상태):

- `NEXT_PUBLIC_AUTH_SUPABASE_URL` / `NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY` / `AUTH_SUPABASE_SERVICE_ROLE_KEY` — Supabase 프로젝트 (사용자 데이터 + 통계 통합)
- `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` — GitHub OAuth App
- `SUPABASE_OAUTH_CLIENT_ID` / `SUPABASE_OAUTH_CLIENT_SECRET` — Supabase Management OAuth App (https://supabase.com/dashboard/org/<slug>/apps)
- `OAUTH_STATE_SECRET` — 32+자 랜덤 문자열 (`openssl rand -base64 48`)

`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 **삭제됨** (옛 통계 프로젝트 폐기됨, 통합 완료).

### Supabase 상태

- 옛 `vibestart` 프로젝트 삭제 완료 → organization에 active 프로젝트 1개 슬롯 여유
- (마)-2 동작 검증 완료. 새 프로젝트 자동 생성 → `(project.slug).supabase.co` 형태로 ACTIVE_HEALTHY 상태 도달 확인됨.

### 관련 문서

- 통합 결정 배경: 커밋 메시지 `f9bad78 chore(web): Supabase 통계 + 사용자 데이터 단일 프로젝트로 통합`
- 마이그레이션 절차: `supabase/migrations/phase2/MIGRATION_GUIDE_003.md`
- Phase 2 셋업 가이드: `supabase/migrations/phase2/SETUP.md`

## (마)-3 시작 시 알아야 할 것

1. **`user-action` kind는 신규**. 기존 SubstepList는 user-action에 대해 "직접 해주세요 + 외부 링크" 메타만 표시하는데, (마)-3에서는 **폼 입력**이 필요. 새 패널 컴포넌트 만들거나 SubstepList 확장.
2. **Google Cloud Console은 API로 OAuth 클라이언트 생성 불가** — 사용자가 직접 만들고 값 붙여넣는 방식이 유일.
3. **수집할 값 2개**: `client_id`, `client_secret`. 둘 다 in-memory store의 project_resources 또는 별도 슬롯에 저장. (마)-4에서 Supabase Auth Provider 설정에 사용.
4. **(마)-4 의존성**: (마)-3에서 받은 client_id/secret + (마)-2의 supabase_project ref + (마)-1의 supabase access_token으로 Supabase Management API 호출.

## 다음 작업 시작 명령어

```bash
git pull
cd apps/web && pnpm install
pnpm dev:web
```

`.env.local` 셋업 후 dev 서버 띄우면 끝. (마)-3 작업 시작.
