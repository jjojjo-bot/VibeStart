# VibeStart Phase 2 — Supabase 셋업 가이드

Phase 2의 사용자/프로젝트/OAuth/통계 데이터는 단일 Supabase 프로젝트(`vibestart-auth`)에 저장됩니다.

> **2026-04-08 결정**: 통계와 사용자 데이터를 두 프로젝트로 물리 분리하기로 했음.
> **2026-04-09 결정 변경**: Supabase Free 플랜의 organization당 active 프로젝트 2개 한도로 인해 (마)-2 단계의 사용자 사이트 DB 자동 생성이 막혔다. 통계 테이블을 RLS로 격리(익명 SELECT 허용 + RPC만 쓰기)해 동일 DB에 통합하고 옛 통계 프로젝트를 폐기. 마이그레이션 절차는 `MIGRATION_GUIDE_003.md` 참조.

이 가이드는 새 Supabase 프로젝트 생성부터 vibestart 로컬 개발 환경에서 Google 로그인이 작동하기까지의 전 과정을 설명합니다.

---

## 1. 새 Supabase 프로젝트 만들기

1. https://supabase.com/dashboard 접속 → **New project** 클릭
2. 프로젝트 이름: `vibestart-auth` (또는 원하는 이름)
3. 데이터베이스 비밀번호: 안전하게 저장 (나중에 필요)
4. 리전: **Northeast Asia (Seoul) ap-northeast-2**
5. 플랜: Free
6. **Create new project** 클릭 → 프로비저닝에 1~2분

## 2. 환경변수 받기

프로젝트가 준비되면:

1. 좌측 사이드바 → **Project Settings** → **API**
2. 다음 3개를 복사:
   - **Project URL** → `NEXT_PUBLIC_AUTH_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY`
   - **service_role** key → `AUTH_SUPABASE_SERVICE_ROLE_KEY` (서버 전용, 절대 클라이언트 노출 금지)

## 3. `apps/web/.env.local` 업데이트

```bash
# 기존 (통계용 — 건드리지 마세요)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# 새로 추가 (Phase 2 — 사용자/프로젝트)
NEXT_PUBLIC_AUTH_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY=eyJ...
AUTH_SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

> **중요**: `.env.local`은 `.gitignore`에 이미 포함되어 있습니다. 절대 커밋하지 마세요.

Vercel 프로덕션 배포에도 같은 3개 env를 Vercel 대시보드에서 추가해야 합니다.

## 4. SQL 마이그레이션 실행

1. Supabase 대시보드 → 좌측 **SQL Editor** → **New query**
2. 이 레포의 `supabase/migrations/phase2/001_init.sql` 파일 내용을 전체 복사
3. SQL Editor에 붙여넣고 **Run** 클릭
4. 에러 없이 끝나면 `users`, `projects`, `milestone_status`, `oauth_connections`, `project_resources` 5개 테이블이 생성됩니다
5. 좌측 **Table Editor**에서 확인

## 5. Google OAuth 클라이언트 만들기 (Google Cloud Console)

1. https://console.cloud.google.com/ 접속
2. 프로젝트 생성 (혹은 기존 프로젝트 선택): `vibestart-oauth`
3. 좌측 메뉴 → **APIs & Services** → **OAuth consent screen**
   - User Type: **External**
   - App name: `VibeStart`
   - User support email: 본인 이메일
   - Developer contact: 본인 이메일
   - **Save and continue** → Scopes는 기본값 → Save
4. 좌측 메뉴 → **Credentials** → **Create credentials** → **OAuth client ID**
   - Application type: **Web application**
   - Name: `VibeStart Supabase`
   - Authorized redirect URIs에 다음 **2개** 추가:
     - `https://xxxxxx.supabase.co/auth/v1/callback` (위 Supabase Project URL 뒤에 `/auth/v1/callback`)
     - 프로덕션 배포가 끝났다면 프로덕션 도메인의 것도 추가
5. **Create** → **Client ID**와 **Client Secret**을 복사해 둡니다

## 6. Supabase Auth에 Google Provider 연결

1. Supabase 대시보드 → 좌측 **Authentication** → **Providers**
2. **Google**을 찾아 토글 켜기
3. 위에서 받은 **Client ID**와 **Client Secret** 붙여넣기
4. **Save**

## 7. Redirect URL 허용 목록 설정

1. Supabase 대시보드 → **Authentication** → **URL Configuration**
2. **Site URL**: `http://localhost:3000` (개발) 또는 프로덕션 도메인
3. **Redirect URLs**에 다음 추가:
   - `http://localhost:3000/auth/callback`
   - `https://vibe-start.com/auth/callback`
   - 6개 locale을 쓰므로 각 locale 프리픽스는 URL 쿼리로 처리됨 — 별도 등록 불필요

## 8. 로컬에서 테스트

```bash
cd apps/web
pnpm dev
```

브라우저에서:

1. http://localhost:3000/login 접속
2. "Google로 계속하기" 버튼 클릭
3. Google 계정 선택 → 동의 → `/auth/callback`으로 복귀 → `/dashboard`로 리다이렉트
4. 대시보드에서 본인 이름/이메일이 보이면 성공

## 9. 검증

Supabase 대시보드 → **Authentication** → **Users**에서 방금 로그인한 계정이 보이는지 확인.
Supabase 대시보드 → **Table Editor** → `public.users`에서 같은 사용자가 한 행 생겼는지 확인 (auth.users 트리거가 자동으로 복제).

## 문제 해결

- **"Phase 2 Supabase 프로젝트 환경변수가 설정되지 않았습니다" 에러**
  → `.env.local`에 3개 env를 넣은 뒤 `pnpm dev`를 **완전히 재시작**
- **Google 로그인 후 `redirect_uri_mismatch`**
  → Google Cloud Console의 Authorized redirect URIs에 Supabase URL이 정확히 `/auth/v1/callback`으로 끝나는지 확인
- **"missing_code" 에러**
  → Supabase Redirect URLs 허용 목록에 `http://localhost:3000/auth/callback`이 있는지 확인
- **로그인 후 바로 로그아웃됨 (무한 루프)**
  → proxy.ts가 `getUser()` 호출 전에 응답을 커밋하는 경우. `apps/web/src/proxy.ts`를 확인하고 `supabase.auth.getUser()`가 intl 응답 생성보다 먼저 실행되는지 점검

---

## 다음 단계 (Phase 2a 코드 작업)

이 셋업이 끝나면 다음 작업:

1. **(다)** 정적 트랙 페이지 골격 — `/projects/new`, `/projects/[id]`, `/projects/[id]/m/[milestoneId]`
2. **(라)** M1 실제 동작 — GitHub OAuth + Vercel OAuth + 저장소/배포 자동 생성
