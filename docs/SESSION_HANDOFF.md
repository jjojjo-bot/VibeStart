# Session Handoff — 2026-04-14

다른 기기에서 새 Claude Code 세션을 시작할 때 이 문서를 먼저 읽으면 작업을 바로 이어갈 수 있다. 이 PC의 `~/.claude/projects/.../memory/` 메모리는 git에 안 올라가므로, 그 내용을 여기 한 파일로 합쳐 둔다.

**최신 커밋**: `4a5abf0` (M2 사용자 코드 보존 재설계)
**브랜치**: `main`
**기준일**: 2026-04-14

## 다른 기기에서 바로 이어가기

```bash
git clone <repo> # 또는 cd ~/VibeStart
git pull         # 4a5abf0 이상 확인
pnpm install
pnpm dev:web     # localhost:3000 (점유 시 3001로 fallback)
```

환경변수: `apps/web/.env.example` 참조.
Supabase Free 플랜 2-project 한도: M2 테스트 전 기존 무료 프로젝트 정리 필요.

새 Claude Code 세션 첫 메시지 예:
> "docs/SESSION_HANDOFF.md 읽고 이어서 작업하자. Phase 1 폴더 핸드오프 옵션 C부터 진행."

---

## 1. 2026-04-14 세션에서 완료한 것

### 1-1. M2 사용자 코드 보존 재설계 (커밋 `4a5abf0`)

**문제:** 기존 M2 `installAuthUiAction`이 사용자가 Phase 1에서 만든 `src/app/page.tsx`를 Auth 랜딩 템플릿으로 통째로 덮어쓰고 있었다. 사용자 의도(자기 사이트가 M3까지 살아남으면서 로그인 버튼만 추가됨)와 정반대 동작이라, 사용자가 만든 약속 잡기 사이트든 블로그든 다 사라졌다. Phase 1과 M3는 이미 "Claude Code에 자연어 프롬프트로 위임"하는 모델인데 M2만 결정론적 덮어쓰기였다.

**해결:** M2를 "스캐폴딩 + LLM 위임" 패턴으로 재정렬.

**서버가 자동으로 하는 것 (`installAuthUiAction`):**
1. `src/lib/supabase.ts` — Supabase 클라이언트 (신규 파일, 충돌 없음)
2. `src/components/auth-button.tsx` — 드롭인 Google 로그인 버튼 (신규 파일)
3. `package.json` — `@supabase/supabase-js` 의존성 추가
4. `supabase_project.metadata.authUiInstalled = true` (기존 플래그 흐름 보존)
5. **사용자 코드는 절대 건드리지 않음**

**사용자가 Claude Code로 하는 것:**
- M2 완료 화면에 `ClaudeCodePromptCard` 노출 — 비전공자 톤 자연어 프롬프트
- 사용자가 "메시지 복사" → Claude Code 창에 붙여넣기
- Claude Code가 사용자 사이트 코드를 직접 읽고 적절한 위치에 AuthButton 끼워 넣음

**톤 가이드 (사용자 합의):** 비전공자에게 보여줄 프롬프트는 파일 경로/컴포넌트 이름/import 같은 기술 어휘 0개. "Google 로그인", "버튼" 정도까지만. Claude Code는 충분히 똑똑하므로 prescriptive하게 적지 않아도 프로젝트 코드를 직접 읽고 판단함.

**변경 파일:**
- `apps/web/src/lib/deploy/auth-ui-nextjs-template.ts` — `buildPageTsx` 제거 → `buildAuthButtonComponent` 신규
- `apps/web/src/app/[locale]/projects/[id]/m/[milestoneId]/actions.ts` — `installAuthUiAction`이 page.tsx 대신 auth-button.tsx push
- `apps/web/src/components/milestone/install-auth-ui-panel.tsx` — installed 상태에서 ClaudeCodePromptCard 렌더, 신규 optional labels
- `apps/web/src/components/milestone/claude-code-prompt-card.tsx` — **신규** 컴포넌트
- `apps/web/src/app/[locale]/projects/[id]/m/[milestoneId]/page.tsx` — InstallAuthUiPanel에 새 라벨 전달
- `apps/web/messages/{ko,en,ja,zh,es,hi}.json` — 6개 신규 키 (`claudePrompt`, `claudeCardHeading/Subheading/Badge/Copy/Copied`) + 기존 `description/installedSuccess/installedPending/alreadyInstalled` 톤 정렬
- `apps/web/src/lib/deploy/nextjs-landing-template.ts` — stale 주석 정리 (M2 덮어쓰기 가정 제거)
- `apps/web/src/test/deploy.test.ts` — stale 주석 정리

**M3는 점검 통과 (수정 없음):** M3(`m3-vibe-coding`)의 모든 substep은 `user-action`/`copy-paste`/`verify`로, 서버에서 사용자 코드를 건드리는 부분이 0. 추천 프롬프트(`step2Prompt`)도 이미 비전공자 톤. 우리가 M2에 도입한 패턴의 참조 모델이었다.

**알려진 corner case (블로커 아님):** 옛 M2를 이미 진행했던 dev 사용자는 `metadata.authUiInstalled === true`라 신규 install 버튼이 안 보임 → `auth-button.tsx` 파일이 그들 repo에 없음. 새 프롬프트 카드는 노출되지만 Claude Code가 파일 없는 것을 보고 새로 만들거나 inline으로 처리. 자동 마이그레이션은 안 되지만 운영 데이터 손실은 0. 이 사용자 그룹은 본인 + 일부 실기기 검증 정도로 매우 작음.

### 1-2. 결과물 충격 패키지 (커밋 `b008228` → `c8915d7`)

M1 완료 모먼트가 너무 약했던 문제 해결:

- `SitePreviewFrame` (16:9 iframe + 브라우저 크롬 + 8초 timeout fallback)
- `ShareActions` (URL 복사 / Web Share API / X / QR 4개 버튼)
- `MilestoneCelebration` hero 모드 — `deployedUrl` + `projectName` + `userName` + share labels 모두 있을 때 활성화. 없으면 기존 간단 배너 폴백 (M2/M3 호환 보존)
- 개인화 share card: `/api/og?type=share&project=&user=&url=` 변형 추가
- CI 에러 fix: `useEffect` setState → `useSyncExternalStore`로 react-hooks/set-state-in-effect 규칙 통과

### 1-3. OG 이미지 + 폰트 정렬 (커밋 `370d603` → `9acc50b`)

- 로고 배지 제거, `>_` 마크만 워드마크 옆에 락업
- Google Fonts CSS API에서 Geist + Noto Sans KR 서브셋 fetch → ImageResponse fonts에 주입
- 메인 사이트와 동일한 Geist 800으로 워드마크 렌더
- `OG_VERSION` 상수로 SNS 캐시 무효화 (현재 v=4)

### 1-4. /projects/new Server Component 크래시 수정 (커밋 `259cda9`)

- `<form>`에 인라인 `onSubmit`이 있어 Server Component 렌더링 터지던 문제
- `ProjectCreateForm` 클라이언트 컴포넌트로 분리, `fd.get("track")` → `fd.get("trackId")` 필드명 오타 동시 정정

---

## 2. 다음 할 일 (우선순위 순)

### 2-1. Phase 1 → Phase 2 폴더 핸드오프 마찰 해소 (다음 PR) ⬅️ 가장 우선

**문제:** `PHASE1_DATA_COOKIE`는 `/complete` 페이지의 두 액션(`signInFromCompleteAction`, `goToDashboardWithPhase1Action`)에서만 세팅된다. 사용자가 Complete를 거치지 않고:

1. Phase 1 끝나고 홈으로 돌아감
2. 홈의 "내 사이트 만들기 →" 링크 클릭 → `/dashboard` (`apps/web/src/app/[locale]/page.tsx:54`)
3. 로그인 → 대시보드 → 새 프로젝트 → `/projects/new`

이 경로를 타면 쿠키가 비어 있어서 `/projects/new` 입력란이 기본값 `"my-portfolio"`로 시작. 사용자는 자기 로컬 폴더 이름을 기억해서 직접 타이핑해야 하고, 이름이 다르면 M1의 `cd {projectName} && git push` 명령에서 폴더 이름을 머릿속으로 치환해야 함 — 비전공자에게 큰 함정.

**옵션 C — M1 git push 안내에 안전망 한 줄 (즉시, 비용 0)**

M1 m1-s3-git-push 단계의 명령어 박스 옆에 한 줄:

> 내 컴퓨터에 있는 실제 폴더 이름이 다르면 `{projectName}` 부분만 그 이름으로 바꿔주세요

i18n 6언어 추가 필요. 효과는 작지만 즉시 적용 가능.

**옵션 A — `PHASE1_DATA_COOKIE`를 더 일찍 세팅 (근본 해결)**

지금: Complete 페이지의 두 버튼만 세팅
바꿔서: onboarding에서 프로젝트 이름 입력하는 순간(또는 setup 진입 시) 세팅

- `apps/web/src/app/[locale]/onboarding/page.tsx`의 projectName step 다음 또는 setup 페이지 진입 effect에서 cookie 세팅
- TTL 5분 → 7일로 확장
- Complete를 거치지 않아도 Phase 2가 자동 prefill
- 95% 케이스 자동 해결

**옵션 B는 보류** — `/projects/new`에 "이전에 만든 프로젝트 폴더가 있어요" 토글은 A가 잘 동작하면 굳이 안 만들어도 됨.

**구현 시 주의:**
- A는 client-side에서 cookie 세팅이 어려우므로 server action 또는 route handler로 처리 (onboarding은 client component)
- 가장 깔끔한 방법: setup 페이지 진입 시 server action 호출하거나, projectName step에서 form action으로 cookie 세팅
- 검증: Complete 거치지 않은 새 시나리오 + Complete 거친 기존 시나리오 둘 다 동작 확인

**합의된 진행 순서:** C 먼저 (즉시 적용) → A 별도 PR

### 2-2. 결과물 충격 패키지 실기기 검증

- M1 완료 후 hero 모드(iframe + share card + share buttons)가 실제 프로덕션에서 잘 보이는지 확인
- 카카오톡/X/QR 공유 흐름 모바일 검증
- iframe X-Frame-Options 거부 케이스에서 fallback 동작 확인

### 2-3. M2 새 흐름 실기기 검증

- 사용자 코드 보존되는지 확인 (이전 M2 진행 사용자 + 신규 사용자)
- ClaudeCodePromptCard 메시지 복사 → Claude Code 붙여넣기 → AuthButton 끼워넣기 end-to-end
- 6언어 톤 확인

### 2-4. 이전부터 남아 있던 항목 (이전 진행 상황 메모리에서 이월)

1. web-python 트랙 (마)-3~(마)-6 실기기 풀 사이클 검증
2. `auth-ui-nextjs-template` 한국어 하드코딩 → 사용자 locale 반영 (AuthButton 컴포넌트의 "Google로 로그인" / "로그아웃" 텍스트)
3. verify substep들 실제 HTTP fetch 검증 추가
4. 서버 액션 에러 메시지 영어 코드 → 사용자 친화 메시지
5. M2 메타데이터 Vault 이관 (현재 평문 저장)
6. Phase 2b: 트랙별 고유 마일스톤 도입 시 트랙 전환 마이그레이션 가드 로직 필요

---

## 3. 검증 명령

```bash
pnpm -r typecheck
pnpm --filter @vibestart/web lint
pnpm --filter @vibestart/web test    # 66 tests, i18n-sync 포함
pnpm --filter @vibestart/web build
```

## 4. 최근 커밋 흐름 (2026-04-14)

```
4a5abf0 refactor(web): M2를 사용자 코드 보존형으로 재설계
c8915d7 fix(web): ShareActions useEffect setState를 useSyncExternalStore로 교체
b008228 feat(web): 마일스톤 완료 화면에 결과물 충격 패키지 도입
9acc50b fix(web): OG 이미지 폰트를 메인 사이트와 동일한 Geist + Noto Sans KR로
0fe8c42 refactor(web): OG 이미지 로고 배지 제거 — 마크만 노출
45f3f3e fix(web): OG 이미지 URL에 캐시 버스터(v=2) 추가
370d603 feat(web): OG 이미지에 로고 배지 + 락업 적용
259cda9 fix(web): /projects/new Server Component onSubmit 크래시 수정
```

## 5. 운영 규칙 메모 (잊지 말기)

- **Vercel Hobby Co-Author 차단**: 커밋 메시지에 `Co-Authored-By` 태그 절대 금지 (Vercel Hobby 배포 차단됨)
- **커밋/푸시는 사용자 지시 시에만**: 자동 commit·push 금지
- **근본 원인 우선**: quick fix보다 재현·검증 기반 근본 수정. 가설은 검증 전 commit 금지
