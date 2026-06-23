# Session Handoff — 2026-06-23

다른 기기에서 새 Claude Code 세션을 시작할 때 이 문서를 먼저 읽으면 작업을 바로 이어갈 수 있다. 이 PC의 `~/.claude/projects/.../memory/` 메모리는 git에 안 올라가므로, 핵심 전략·다음 단계를 여기 합쳐 둔다.

**최신 커밋**: `main` HEAD = `ae66549` /start 빌더 GA4 퍼널 계측 6종 (아래 §1-F)
**브랜치**: `main` (origin과 동기화됨)
**기준일**: 2026-06-23 (다른 PC로 이어가기)
**프로덕션**: https://vibe-start.com (아래 §1 작업 전부 라이브 배포됨)

> **이 핸드오프의 핵심 (2026-06-23)**: 딥리서치 시장검증은 어제 완주 → 전략 정제(§0). 오늘 B′ `/start` 빌더를 **드디어 측정 가능**하게 만듦 — GA4 퍼널 6종 계측 추가·배포(`ae66549`). **다른 PC에서 할 일**: ⚠️먼저 **GA4 맞춤 측정기준 3개 등록**(`category`·`choice`·`locale` — 안 하면 페르소나 분해가 표준 보고서에 안 뜸, §1-F) → 그다음 §2 우선순위의 **A-1 수익화(평생교육원/도서관 수요 타진)** 또는 **GA4 `goal` 분포 확인(페르소나 판정)**.

## 다른 기기에서 바로 이어가기

```bash
cd ~/VibeStart && git pull      # ae66549 이상 확인
pnpm install
pnpm dev:web                    # localhost:3000 (점유 시 3001 fallback)
```

새 세션 첫 메시지 예:
> "docs/SESSION_HANDOFF.md 읽고, GA4 맞춤 측정기준 등록(§1-F)부터 §2 우선순위 순서대로 이어가자."

---

## 0. 큰 그림 (확정된 전략)

상세 근거는 메모리 `project_target_persona_verification`에 있음. 요약:

- **핵심 타겟 = 절대 초보** ("가정주부형": 시간 O, 지식 0, 어디서 시작할지 모름). 졸업자 pivot은 **기각**.
- **검증 결과**(웹리서치 4에이전트, 적대적): 콜드 비개발자+로컬퍼스트+터미널-Claude 첫터치 = 2026 트렌드 대비 최약. 멀티스텝 로컬셋업에서 95% 이탈. → 적은 "단계 수"가 아니라 **실패·혼란**.
- **설계 방향**:
  - **B′** = 설치 0 "첫 성공"을 먼저 (브라우저에서 5분 만에 페이지) → 그다음 로컬로 졸업.
  - **2단 졸업 브릿지**: 🆓 무료 졸업(내 GitHub+내 Vercel, 설치·터미널 없음, 모바일 OK) / 🚀 AI 가속(로컬 설치+Claude 월 $20~, $20 게이트는 '첫 AI 사용' 시점). 무서운 로컬설치를 유료·고의향 경로로 격리.
  - **D′** = from-zero 로컬셋업을 "무실패"로 (단계별 자동검증·실패 자동복구).
- **비용 정직성**: Claude Code 무료 티어 없음(최소 Pro $20). "무제한" 주장 금지.
- **브랜드 라인**: "다른 곳은 돈 내도 못 나가는데, 우리는 무료로도 완전히 당신 것." (acquisition 아니라 비교/retention 무기 — 졸업 브릿지·About에 배치)

### 2026-06-22 시장검증 후 정제 (딥리서치 → `docs/research/market-verification-2026-06.md`)

- **죽은 가치**: "무실패 설치"는 Anthropic이 직접 제거(무터미널 GUI·Node 불필요) → 더는 해자 아님. "능력을 가르친다"도 한국서 ₩11k~264k 유료로 포화(FastCampus·Inflearn 13,000+·잔재미·retn).
- **히어로 전환**: 설치 → **첫 성공 + 프롬프팅**. 절대초보를 *첫 진짜 결과 + 프롬프트하는 법*까지. (B′ 5분 빌더 4종이 정확히 이 축의 제품 — 설치 제품 아님.)
- **해자 = 포맷·유통·신선도**(콘텐츠 아님): 무료 × 인터랙티브 웹 × 한국어 × 윈도우우선 × 절대제로 × 5분 첫성공의 *조합*. 각 축은 개별 점유됐으나 조합 복제 경쟁자 없음(얇은 조합 해자).
- **수익화 가설(확정, AI 과금·강의판매 없이)** = **(c) B2B·교육 파트너십**(지자체 디지털교육·평생교육원·도서관에 플랫폼/커리큘럼) + **(d) 제휴·리퍼럴**(Claude Pro·호스팅). 자체 유료 AI 금지 유지.
- **베팅 전 검증 2개**: (i) 무료 가이드 후 진짜-제로 초보가 *첫성공*까지 가나 vs 프롬프팅 갭 이탈; (ii) 타겟이 진짜 지식0인가 업스킬 개발자인가.
- **플랫폼 리스크**: Anthropic이 무료티어+한국어+초보가이드 붙이면 웨지 붕괴 가능 → 한국어 무료 선점 *속도*가 관건.

---

## 1. 완료된 것 (전부 프로덕션 배포)

### 1-A. B′ 첫성공 플로우 (브라우저에서 5분 만에 라이브 페이지)

`/start` → 카테고리 선택 → 빈칸 채우기(빈 칸은 샘플 자동) → 라이브 미리보기 → 발행 → 졸업 브릿지.
컴포넌트: `apps/web/src/components/start/build-wizard.tsx`. 렌더/이스케이프는 도메인 `packages/template-catalog`에 위임.

- **템플릿 카탈로그 4종** (`packages/template-catalog`): `intro`(링크인바이오) / `shop`(매장 랜딩) / `launch`(Coming Soon) / `invitation`(청첩장). 카테고리마다 **구조가 완전히 다른** 다크 오로라 글래스 정적 레이아웃 + 마우스 색-물결 + 템플릿별 시그니처 파티클. `render.ts`가 결정론적으로 값→HTML(이스케이프).
- **미리보기 와이어업 완성** (커밋 `4eb8ad4`, 2026-06-22): shop은 `menu/hours/location`, invitation은 `date/venue/location/photos` 필드가 정의에 연결돼 메뉴판·추상지도·사진 히어로·자동 달력이 실제로 렌더됨. **todo 템플릿 제거 → launch로 교체**. render.ts 하드코딩 한국어 9종을 `TemplatePreviewLabels`로 분리해 로케일 주입(영어 등에서 한국어 누수 없음). 렌더 테스트 8종 추가.
- **화면 4 — 퍼블리시** (`a42558c` 등): 슬러그 선택 → 익명 발행(TTL 24h) → 라이브 URL `/p/{slug}`(`app/p/[slug]/route.ts`, locale 무관, no-store). 발행 직후 pending slug를 쿠키에 심고, 가입 시 `claim-pending.ts`로 영구 연결. 슬러그 검증·한글 IME·충돌 방지 QA 반영.
- **화면 5 — 졸업 브릿지** (`graduate` step): 🆓 무료(`/dashboard`) / 🚀 AI(`/onboarding`) 2갈래 + 매니페스토(브랜드 라인).
- **liquid-glass** 디자인: `apps/web/src/styles/liquid-glass.css`(벤더) route-layout 스코프. 튜너는 dev에서만.
- i18n `Start` 6언어 (preview 라벨 + 템플릿/필드 라벨 + 샘플 전부 번역, 키 동기화).

### 1-B. 진단 루프 ("안 됐어요?" 복구)

사용자가 로컬 셋업에서 막혔을 때 터미널 출력을 붙여넣으면 원인 진단 + 사전 검증된 복구만 제시.
- `packages/diagnosis-catalog`: 시드 카탈로그(rules.ts) + 매처 + 복구 스크립트 + 무결성/안전 검증. 마스킹(`mask.ts`).
- 웹: `components/diagnosis/stuck-helper.tsx` → `/setup` 활성 스텝 카드에 마운트. 인식/모호/모름 3분기.
- **보강 완료**: BIOS 가상화 그림 가이드(`feee51f`), '모름' 에스컬레이션 전송(`1913aef`), 관리자 검토 화면 `/admin/diagnosis`(이메일 게이트, `73c96a4`), 리포트 저장(`api/diagnosis-report`).

### 1-C. D′ 셋업 스크립트 하드닝

`apps/web/src/lib/setup-steps.ts` + `packages/script-generator/src/harden.ts`.
- 구조화 마커(`VIBESTART::`) + 항상 ✅/❌ 종료, pre-flight 점검(가상화/버전/관리자, `eacc1bb`), 재부팅 체크포인트 UI(`83fdf3f`), Windows editor 단계는 내부 exit이라 하드닝 제외(`1affc7b`).

### 1-D. 랜딩 메인 CTA → /start 전환

히어로·하단 CTA 메인(filled) "설치 없이 5분 체험" → `/start`, 보조 "개발 환경 설치하기" → `/onboarding`.

### 1-E. SEO/a11y/보안 하드닝 스윕 (2026-06-22 오후, 라이브)

Lighthouse SEO/접근성 감점 정리 + 보안 헤더. 4eb8ad4 이후 커밋들:
- `f3fc5e4` 5분 체험 미리보기 깜빡임 제거(`use-debounced`) + invitation 사진을 외부 picsum 의존 대신 **사진 슬롯 플레이스홀더**로 (백로그 §2-2 처리됨).
- `87e8f9c` `/start` self-canonical·hreflang + a11y(중복 alt·헤딩 교정) + **보안 헤더**(`next.config.ts`). canonical 헬퍼 `lib/canonical.ts` 신설.
- `4788fa2` 하위 6개 마케팅 페이지(onboarding/plan/setup/complete/about/terms) self-canonical·hreflang (`lib/page-metadata.ts`, `createPageMetadata`).
- **(이번 커밋)** 스윕에서 빠졌던 **`privacy` 페이지** self-canonical·hreflang 마무리 — `privacy/layout.tsx` 추가 + `createPageMetadata` union에 `"privacy"` + 테스트 단언. (privacy는 client 컴포넌트라 layout 래퍼로 metadata 주입.)

> 패턴: 루트 `[locale]/layout.tsx`는 로케일-루트만 canonical을 줌 → 하위 라우트는 `createPageMetadata(locale, page)`로 자기 경로 canonical+hreflang을 따로 줘야 함. 새 마케팅 페이지 추가 시 동일 패턴 반복(또는 layout.tsx에서 generateMetadata).

### 1-F. B′ /start 빌더 GA4 퍼널 계측 (2026-06-23, `ae66549`, 라이브)

B′ 빌더가 그동안 **측정 무방비**였음(랜딩 CTA는 /start로 갔는데 이벤트 0). 이게 검증 A-2(i)"첫성공 전환"을 측정 불가능하게 만들고 있었음. GA4 6종 추가 — `lib/ga.ts`에 `trackStart*` 헬퍼 + `components/start/build-wizard.tsx` 와이어업. (GA4 only, DB·공개카운터 미변경)

| 이벤트 | param | 지점 |
|---|---|---|
| `start_open` | locale | 마운트 1회(퍼널 분모) |
| `start_category` | category | `pick()` — 페르소나 신호 |
| `start_publish_click` | category | `publish()` 시도 |
| **`start_publish_success`** | category | 발행 성공(★ 첫성공) |
| `start_claim_click` | category | "이대로 저장"→/login |
| `start_graduate_choice` | choice(free/ai) | 졸업 분기 |

읽는 법: 첫성공 전환 = `start_publish_success / start_open`. 페르소나 = `category` 분포.
**⚠️ 미완 TODO (배포 직후 필수): GA4 관리›맞춤 정의에서 `category`·`choice`·`locale`를 "맞춤 측정기준(이벤트 범위)"으로 등록.** 미등록 시 이벤트는 카운트되나 페르소나 분해가 표준 보고서에 안 뜸(실시간/탐색에서만 보임).

---

## 2. 다음 할 일 (남은 것)

> **✅ 딥리서치 시장검증 완료 (2026-06-22).** 결과·근거: `docs/research/market-verification-2026-06.md` (107에이전트·18 confirmed/7 killed). 핵심: "능력을 준다" 틈새는 한국서 포화·유료, 설치 해자는 Anthropic이 제거 → **§0 "2026-06-22 정제" 참조.** **다음 = §0의 검증 2개(첫성공 잔존·페르소나 정체) + 수익화 가설 (c)교육 파트너십·(d)리퍼럴 탐색.**

### 🎯 다음 우선순위 (2026-06-23 세션에서 정함)

**데이터 현황 (오늘 확인):** 공개 카운터(Supabase 집계) = 누적 시작 **421** / 완료 **62** = 설치 트랙 완료율 **14.7%**(≈85% 이탈). 단 이 숫자엔 페르소나(goal/os)가 없음 — *볼륨·국가만*. 페르소나 신호는 **GA4에만** 있음(설치퍼널 `goal`, /start `category`). "누가 오나"는 반드시 GA4를 봐야 함.

**남은 모호함 = 린치핀:** 설치 완료율 14.7% > 리서치 둠수치 5%. 두 해석 — (a)제품(D′ 하드닝)이 콜드초보를 끌어올림 vs (b)완료자가 그냥 역량자(개발자). **GA4 `goal` 분포가 이걸 가름**(421이면 표본 충분). 이게 §0 검증 2개 중 (ii) 페르소나 정체.

0. **⚠️ [배포 직후·필수] GA4 맞춤 측정기준 등록** — `category`·`choice`·`locale` (§1-F TODO). 안 하면 오늘 추가한 계측의 페르소나 분해가 안 보임. 이거 먼저.
1. **A-1 수익화 탐색 (메인 가설 (c)):** §0의 B2B·교육 파트너십을 실수요로 검증. 평생교육원/도서관/지자체 디지털배움터 1~2곳에 수요 타진(메일 1통이 페르소나+수익화 동시 검증). **핵심 연결고리 = "가정주부형 페르소나(시간O·지식0) = 평생교육 수강생 집단".** (Claude가 메일 초안 작성 가능 — 다음 세션에서 부탁)
2. **A-2 검증:** (i) 계측 수집 후 GA4 `start_publish_success/start_open`으로 첫성공 전환 (ii) 설치퍼널 `goal` 분포로 페르소나 (a)/(b) 판정(사용자가 GA4 열어 확인).
3. **A-3 히어로 메시지:** 랜딩/카피를 "설치"→"첫 성공+프롬프팅"으로(B′가 이미 그 제품).

### 선택적 코드 백로그 (우선순위↓)

1. ~~**B′ 화면 3 — AI 손질**~~ **(취소 확정, 2026-06-22)**: 자체 유료 AI 기능 금지 방침으로 폐기. AI는 졸업 후 사용자 몫(로컬 Claude).
2. **(선택) invitation 샘플 사진 소스 결정**: 현재 데모 사진은 `picsum.photos`(시드 고정) **외부 URL**. 사진 히어로/갤러리를 데모에서 보여주려는 의도지만 외부 의존이 생김. 자체 호스팅 이미지로 교체하거나, 비워서 비-사진 히어로로 폴백할지 결정.
3. **(선택) /start 글래스 톤 시각 튜닝**: dev에서 우하단 🎛(Ctrl+Shift+G)로 블러·농도·모서리 조정 → "CSS 복사"한 `:root` knob을 `liquid-glass.css` 상단에 굽기. (눈으로 보고 결정, 우선순위↓)

### 이전 백로그 (여전히 유효)
- Phase 1→2 폴더 핸드오프 옵션 A (`PHASE1_DATA_COOKIE`를 onboarding/setup 진입 시 세팅, TTL 7일). 메모리 `project_phase1_handoff_pending` 참조.
- web-python 트랙 실기기 풀사이클 검증 · auth-ui locale 반영 · verify substep 실제 HTTP · 서버액션 에러 친화 메시지 · M2 메타 Vault 이관 · Phase 2b 트랙 전환 마이그레이션 가드.

---

## 3. 검증 명령

```bash
pnpm -r typecheck
pnpm --filter @vibestart/web lint     # 0 errors (기존 무관 warning 14개)
pnpm --filter @vibestart/web test     # 111 tests (i18n-sync 6언어 + 템플릿 렌더 4종/XSS/라벨 주입 포함)
pnpm --filter @vibestart/web build    # 푸시 전 게이트 (배포 = main push)
```

## 4. 최근 주요 커밋

```
4eb8ad4 feat(web): 5분 체험 미리보기 4종 와이어업 완성 — shop/invitation 필드 연결 + todo→launch 교체
a9bdb90 feat(web): /start 출력 페이지 4종 다크 글래스 리디자인 + 마우스 인터랙션
73c96a4 feat(web): 진단 리포트 관리자 검토 화면(/admin/diagnosis, 이메일 게이트)
1913aef feat(web): 진단 에스컬레이션 전송 (#13②) — '모름' 번들 수집
feee51f feat(web): 진단 BIOS 가상화 그림 가이드 (#13①)
a42558c feat(web): B′ 화면 4 — 퍼블리시 (미리보기 → 라이브 URL /p/{slug})
eacc1bb feat(web): D′ pre-flight 점검 단계 — wsl 설치 전 관리자·Windows 버전 확인
```

## 5. 운영 규칙 (잊지 말기)

- **Vercel Hobby Co-Author 차단**: 커밋 메시지에 `Co-Authored-By` 태그 절대 금지.
- **커밋/푸시는 사용자 지시 시에만**. 푸시 = main → Vercel 배포 트리거.
- **근본 원인 우선**: 재현·검증 기반 수정, 가설은 검증 전 commit 금지.
- **데이터 보호**: 실데이터/실비밀 컨텍스트 반입 금지(전역 지침). 데모·검증은 합성 데이터.
- **i18n**: ko 원본, 6언어 동기화 필수(테스트가 강제). 새 메시지 키는 6개 다 추가.
- **헥사고날**: 비즈니스 로직은 packages/, 새 외부연동은 Port 먼저. 사용자 입력 셸/HTML 직접 삽입 금지(이스케이프/allowlist).

---

## 6. 딥리서치 — 시장경쟁력 검증 ✅ 완료 (2026-06-22, 결과 `docs/research/market-verification-2026-06.md`)

> ✅ 재실행 완주(107에이전트). 아래 질문(args)은 추적 리서치/재재실행용으로 보존.

이전 실행 `wf_be4ff7f5-f0e`이 29/30 에이전트 완료 후 세션 크래시로 중단됨(최종 합성만 미완 → 리포트 미생성). 이 PC의 `~/.claude/.../268e82d1.../` 세션에 중간 산출물은 남아있지만 다른 기기에선 못 쓰니, **집에서 아래 질문으로 `/deep-research`를 그냥 새로 돌리는 게 가장 깔끔**하다. (웹 데이터는 몇 시간새 거의 안 변함.)

재실행 질문(args) — 전문 그대로:

> VibeStart(비개발자 절대초보가 로컬에 Claude Code 등 AI 코딩 환경을 무실패로 설치·학습하도록 돕고, 5분 체험 템플릿 빌더로 입문시키는 한국어 우선 웹서비스)의 2026년 상반기 시장 경쟁력 검증. 핵심 리서치 질문: (1) 제로설치 브라우저형 AI 앱 빌더(Lovable, Bolt.new, v0, Replit Agent, Create.xyz, a0.dev 등)의 현재 가격·무료티어·역량·한국어 지원·시장 점유/모멘텀; (2) 비개발자에게 '직접 로컬에서 AI로 빌드하는 능력'을 가르치는(락인 없는 자립) 방향의 직접 경쟁자가 존재하는가; (3) Anthropic의 Claude Code 자체 온보딩이 얼마나 초보 친화적이 되었는가(플랫폼 의존 리스크); (4) 한국 시장에서 비개발자 AI 앱제작/바이브코딩 타겟 플레이어(예: 뤼튼 등); (5) '시간 많고 지식 0인 절대초보가 AI로 직접 만들기' 세그먼트의 크기·성장·결제의향 신호. 목표: VibeStart가 '앱을 준다(Lovable에 패배)' vs '직접 만들 능력을 준다(틈새)' 중 어느 포지션이 방어 가능한지 판단할 근거.

- 리서치 목적은 메모리 `project_target_persona_verification`의 2026-06 시장검증 후속(적대적 재검증). 결과 나오면 그 메모리 + 이 문서 §0 전략에 반영.
- 결과는 토큰 큼(이전 실행 73만 토큰/~12분). 비용 감안해 한 번에 끝까지 돌리기.
