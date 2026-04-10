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

### M2 Google Auth 트랙 — 전체 완료

- (마)-1 Supabase Management OAuth (`m2-s1-supabase-oauth`) ✅
- (마)-2 Supabase 프로젝트 자동 생성 (`m2-s2-create-supabase-project`) ✅
- (마)-3 Google OAuth 키 수집 (`m2-s3-google-oauth-keys`) ✅ — 신규 `user-action` kind. 3단계 가이드 UI (Console 링크 → redirect URI 복사 → client_id/secret 폼) + 저장된 키 마스킹 표시 + "수정하기"로 리셋 플로우. Supabase 프로젝트 ref에서 redirect URI 자동 계산. 실기기 브라우저 검증 완료 (2026-04-09, commit `1b49c65`).
- (마)-4 Google provider 활성화 (`m2-s4-enable-google-provider`) ✅ — `auto` kind. `PATCH /v1/projects/{ref}/config/auth`로 `external_google_enabled` / `external_google_client_id` / `external_google_secret` 주입. 엔드포인트와 body 키는 Supabase OpenAPI spec(`UpdateAuthConfigBody`)에서 확정. 선행 3개(supabase_project / google_oauth_keys / supabase_mgmt 토큰) 모두 검증 후 호출. 성공 시 `supabase_project.metadata.googleProviderEnabled = true` 플래그 기록 (다른 단계에서 derive용). `EnableGoogleProviderPanel` (auto kind, 단일 버튼) UI. 임의값 검증 완료 (운영 commit `60ffea6`).
- (마)-5 Auth UI 설치 (`m2-s5-install-auth-ui`) ✅ — `auto` kind. 선행 리소스 3개(github_repo / supabase_project / vercel_project) + 토큰 2개(github / supabase_mgmt) 검증 → `fetchSupabaseAnonKey(reveal=true)`로 anon key 조회하고 metadata에 캐시 → `updateSupabaseSiteConfig`로 site_url / uri_allow_list를 Vercel URL로 업데이트 → `buildAuthUiHtml`로 Google 로그인 버튼 + Supabase JS SDK(CDN) + 세션 감지 포함된 index.html 생성 → `pushFileToGitHub`로 (라)-4 index.html 덮어쓰기(422 retry 자동) → `supabase_project.metadata.authUiInstalled = true` 플래그 + substep 완료. 완료 시 내부 `completeSubstep()`이 다음 verify substep을 자동 완료((라)-5 firstDeployAction 패턴 재사용).
- (마)-6 회원가입 검증 (`m2-s6-verify-signup`) ✅ — `verify` kind. (마)-5의 `completeSubstep()`이 다음 verify substep을 자동 마킹하는 패턴으로 처리. 별도 UI 없음.

### M2에서 만들어진 재사용 가능 블록

- `resourceType: 'google_oauth_keys'` — metadata에 `{ clientId, clientSecret }` (평문, Phase 2b Vault 이관 예정)
- `OAuthProvider` 유니온에 `google` 추가됨. PROVIDER_LABEL / PROVIDER_EMOJI 모두 반영.
- `removeProjectResourceByType()` in-memory-store 헬퍼 — 리셋 필요 시 재사용.
- `updateProjectResourceMetadata()` in-memory-store 헬퍼 — 기존 리소스 metadata에 patch를 머지. (마)-4/(마)-5가 supabase_project에 `googleProviderEnabled` / `authUiInstalled` / `anonKey` 플래그를 기록할 때 사용.
- `updateGoogleProvider(token, ref, { clientId, clientSecret })` / `updateSupabaseSiteConfig(token, ref, { siteUrl, redirectUris })` / `fetchSupabaseAnonKey(token, ref)` in `supabase-mgmt-adapter.ts` — 모두 `PATCH/GET /v1/projects/{ref}/config/auth` 또는 `api-keys?reveal=true`. 향후 다른 Supabase auth config 조작 시 패턴 재사용 가능.
- `buildAuthUiHtml({ projectName, supabaseUrl, supabaseAnonKey })` in `lib/deploy/auth-ui-template.ts` — Supabase JS SDK(CDN) + Google OAuth 로그인 버튼 + 세션 자동 감지가 포함된 단일 index.html. `escapeJsString`은 `JSON.stringify` + `</script>` 분리로 안전하게 처리.
- `GoogleOAuthKeysPanel` 패턴은 추후 Sentry PAT, Cloudflare API token 같은 user-action 서브스텝의 템플릿으로 재활용 가능.
- `EnableGoogleProviderPanel` / `InstallAuthUiPanel` 패턴은 추후 모든 `auto` kind 단계 (3-4 state machine: needs-X / ready / done / installed)의 템플릿.

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

## M2 풀 사이클 실기기 검증 시 알아야 할 것

M1 배포 트랙을 (라)-1~(라)-5까지 전부 끝낸 프로젝트가 있어야 M2를 테스트할 수 있다 (vercel_project 리소스가 필요). 새 프로젝트라면 먼저 M1 풀 사이클부터.

### (마)-4 검증 포인트
1. (마)-3까지 끝낸 상태에서 "Google 로그인 켜기" 버튼 클릭.
2. Supabase 대시보드 → Authentication → Providers → Google이 enabled로 바뀌고 client_id가 표시되는지.
3. idempotent: 같은 키로 두 번 눌러도 200.

### (마)-5 검증 포인트
1. (마)-4까지 끝낸 상태에서 "로그인 버튼 설치" 버튼 클릭.
2. GitHub repo의 index.html이 새 커밋으로 덮어써지는지 (`feat: add Google sign-in via VibeStart`).
3. Vercel이 자동 재배포 트리거되어 1~2분 안에 사이트 갱신.
4. 사용자 사이트 열어 Google 로그인 버튼이 보이는지 + 클릭 시 Google OAuth 플로우로 넘어가는지.
5. Supabase 대시보드 → Authentication → URL Configuration에서 Site URL이 Vercel URL로 업데이트됐는지 + Redirect URLs에 해당 URL + `/**` 패턴 + localhost가 있는지.
6. Google OAuth 완료 후 사용자 사이트로 돌아왔을 때 로그인 상태 UI(이메일 표시 + 로그아웃 버튼)로 전환되는지.
7. 사이드바에서 m2-s5 + m2-s6 모두 자동 체크되는지 → M2 completed → M3 unlock.

### (마)-5 실패 시 디버깅 포인트
- `fetch_key_failed:supabase:invalid_token` → supabase_mgmt OAuth 재연결 필요
- `site_config_failed:supabase:forbidden` → Management API scope 부족 (OAuth App 설정 확인)
- `push_failed:github:unauthorized` → GitHub OAuth 재연결 필요
- Google OAuth는 되는데 사이트로 안 돌아옴 → 사용자 Supabase 프로젝트의 URL Configuration 확인. `updateSupabaseSiteConfig`가 제대로 반영됐는지.

## 다음 작업 시작 명령어 (다른 기기)

```bash
git pull                # (마)-5/(마)-6 commit 포함 확인
pnpm install
pnpm dev:web
```

M2 풀 사이클 테스트 시 Supabase Free 플랜 2-project 한도를 먼저 정리해야 (마)-2가 성공한다.
