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

### M2 Google Auth 트랙 — 1, 2, 3단계 완료

- (마)-1 Supabase Management OAuth (`m2-s1-supabase-oauth`) ✅
- (마)-2 Supabase 프로젝트 자동 생성 (`m2-s2-create-supabase-project`) ✅
- (마)-3 Google OAuth 키 수집 (`m2-s3-google-oauth-keys`) ✅ — 신규 `user-action` kind. 3단계 가이드 UI (Console 링크 → redirect URI 복사 → client_id/secret 폼) + 저장된 키 마스킹 표시 + "수정하기"로 리셋 플로우. Supabase 프로젝트 ref에서 redirect URI 자동 계산. 실기기 브라우저 검증 완료 (2026-04-09, commit `1b49c65`).

## 남은 작업 — M2 (마)-4 이후

`packages/track-catalog/src/milestones/m2-google-auth.ts` 카탈로그 기준:

- **(마)-4 `m2-s4-enable-google-provider`** (kind: `auto`) — Supabase Management API로 Google provider 활성화 + client_id/secret 주입. (마)-3의 `google_oauth_keys` 리소스 + (마)-2의 `supabase_project` ref + (마)-1의 supabase access_token 사용. 엔드포인트: `PATCH /v1/projects/{ref}/config/auth`로 추정되지만 Supabase docs에서 정확한 경로/body 키(`external_google_enabled`, `external_google_client_id`, `external_google_secret`) 재확인 필요. `supabase-mgmt-adapter.ts`에 `updateSupabaseAuthConfig(token, ref, config)` 헬퍼 추가 예상.
- **(마)-5 `m2-s5-install-auth-ui`** (kind: `auto`) — GitHub repo에 auth UI 파일들 push (HTML + JS — Supabase JS SDK CDN으로 Google 로그인 버튼 + 콜백 처리). pushFileToGitHub 헬퍼 재사용. supabase_project metadata에서 apiUrl + anon key 필요 → (마)-2에서 anon key는 저장 안 됐으므로 (마)-5에서 추가 API 호출(`GET /v1/projects/{ref}/api-keys`) 필요.
- **(마)-6 `m2-s6-verify-signup`** (kind: `verify`) — auto-complete 패턴 ((라)-5와 동일).

### (마)-3에서 만들어진 재사용 가능 블록

- `resourceType: 'google_oauth_keys'` — metadata에 `{ clientId, clientSecret }` (평문, Phase 2b Vault 이관 예정)
- `OAuthProvider` 유니온에 `google` 추가됨. PROVIDER_LABEL / PROVIDER_EMOJI 모두 반영.
- `removeProjectResourceByType()` in-memory-store 헬퍼 — (마)-4 이후 단계에서 리셋 필요 시 재사용 가능.
- `GoogleOAuthKeysPanel` 패턴은 추후 Sentry PAT, Cloudflare API token 같은 user-action 서브스텝의 템플릿으로 재활용 가능.

## 다른 기기에서 작업 이어갈 때 필요한 것

### 환경 변수 (`apps/web/.env.local`)

`.env.local`은 git에 없으니 새 기기에서 별도 셋업 필요. 필수 키 (vibestart-auth Supabase로 통합 후 상태):

- `NEXT_PUBLIC_AUTH_SUPABASE_URL` / `NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY` / `AUTH_SUPABASE_SERVICE_ROLE_KEY` — Supabase 프로젝트 (사용자 데이터 + 통계 통합)
- `GITHUB_OAUTH_CLIENT_ID` / `GITHUB_OAUTH_CLIENT_SECRET` — GitHub OAuth App
- `SUPABASE_OAUTH_CLIENT_ID` / `SUPABASE_OAUTH_CLIENT_SECRET` — Supabase Management OAuth App (https://supabase.com/dashboard/org/<slug>/apps)
- `OAUTH_STATE_SECRET` — 32+자 랜덤 문자열 (`openssl rand -base64 48`)

`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`는 **삭제됨** (옛 통계 프로젝트 폐기됨, 통합 완료).

### Supabase 상태

- (마)-2 동작 검증 완료. 프로젝트 자동 생성 → `{ref}.supabase.co` ACTIVE_HEALTHY 도달 확인됨.
- **⚠️ Free 플랜 2-project 한도 이슈** — 2026-04-09 세션에서 `jjojjo-bot` 조직이 한도 초과 에러 반환 (`plan_limit`). (마)-4 테스트 전 supabase.com 대시보드에서 기존 무료 프로젝트 하나 삭제 필요. 최근 (마)-3 테스트 시점에는 `hypwetpwjaqiqqxwnyaf.supabase.co` 프로젝트가 살아있어 redirect URI 계산은 정상 동작했음.

### 관련 문서

- 통합 결정 배경: 커밋 메시지 `f9bad78 chore(web): Supabase 통계 + 사용자 데이터 단일 프로젝트로 통합`
- 마이그레이션 절차: `supabase/migrations/phase2/MIGRATION_GUIDE_003.md`
- Phase 2 셋업 가이드: `supabase/migrations/phase2/SETUP.md`

## (마)-4 시작 시 알아야 할 것

1. **Supabase Management API 엔드포인트 불확실**. 공식 문서로 정확한 path/body 재확인 필요:
   - 후보 1: `PATCH /v1/projects/{ref}/config/auth` — body에 `external_google_enabled`, `external_google_client_id`, `external_google_secret`
   - 후보 2: 별도 `/v1/projects/{ref}/config/auth/providers/google` 형태일 수도 있음
   - 어댑터 위치: `apps/web/src/lib/adapters/supabase-mgmt/supabase-mgmt-adapter.ts`에 `updateGoogleProvider(token, ref, { clientId, clientSecret })` 같은 헬퍼 추가
2. **선행 조건 3개 모두 필요**:
   - `getProjectResourceByType(projectId, 'supabase_project')` → metadata.ref + metadata (마)-1 토큰
   - `getProjectResourceByType(projectId, 'google_oauth_keys')` → metadata.clientId + metadata.clientSecret
   - `getOAuthAccessToken(userId, 'supabase_mgmt')`
3. **(마)-4 패널은 auto kind** — `CreateSupabaseProjectPanel`과 패턴 동일. 상태: `needs-supabase` | `needs-keys` | `ready` | `enabled`. "활성화" 버튼 하나 + pending/success/error 토스트.
4. **오류 케이스**: Supabase 토큰 만료, 프로젝트 INIT 중, 이미 활성화됨 (idempotent하게 처리), Google 키 형식 거부 (Supabase 쪽 검증).
5. **서버 액션**: `enableGoogleProviderAction`. 서브스텝 완료 후 `result` 리소스는 별도 저장 안 하고 `supabase_project.metadata.googleProviderEnabled: true` 플래그로 기록할지 검토.

## 다음 작업 시작 명령어 (다른 기기)

```bash
git pull                # 1b49c65 이상 포함 확인
pnpm install            # root에서 — 새 deps는 없지만 workspace 링크 갱신
pnpm dev:web
```

별도 `.env.local` 셋업은 "환경 변수" 섹션 참조. Supabase 프로젝트 한도 이슈 먼저 해결.

`.env.local` 셋업 후 dev 서버 띄우면 끝. (마)-3 작업 시작.
