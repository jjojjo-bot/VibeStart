# Session Handoff — 2026-06-19

다른 기기에서 새 Claude Code 세션을 시작할 때 이 문서를 먼저 읽으면 작업을 바로 이어갈 수 있다. 이 PC의 `~/.claude/projects/.../memory/` 메모리는 git에 안 올라가므로, 핵심 전략·다음 단계를 여기 합쳐 둔다.

**최신 커밋**: `c3175f8` (랜딩 메인 CTA → /start 전환)
**브랜치**: `main` (origin과 동기화됨)
**기준일**: 2026-06-19
**프로덕션**: https://vibe-start.com (이번 세션 작업 전부 라이브 배포됨)

## 다른 기기에서 바로 이어가기

```bash
cd ~/VibeStart && git pull      # c3175f8 이상 확인
pnpm install
pnpm dev:web                    # localhost:3000 (점유 시 3001 fallback)
```

새 세션 첫 메시지 예:
> "docs/SESSION_HANDOFF.md 읽고 §2 다음 할 일 1번부터 차례대로 이어가자."

---

## 0. 큰 그림 (이번 세션에서 확정된 전략)

상세 근거는 메모리 `project_target_persona_verification`에 있음. 요약:

- **핵심 타겟 = 절대 초보** ("가정주부형": 시간 O, 지식 0, 어디서 시작할지 모름). 졸업자 pivot은 **기각**.
- **검증 결과**(웹리서치 4에이전트, 적대적): 콜드 비개발자+로컬퍼스트+터미널-Claude 첫터치 = 2026 트렌드 대비 최약. 멀티스텝 로컬셋업에서 95% 이탈. → 적은 "단계 수"가 아니라 **실패·혼란**.
- **설계 방향**:
  - **B′** = 설치 0 "첫 성공"을 먼저 (브라우저에서 5분 만에 페이지) → 그다음 로컬로 졸업.
  - **2단 졸업 브릿지**: 🆓 무료 졸업(내 GitHub+내 Vercel, 설치·터미널 없음, 모바일 OK) / 🚀 AI 가속(로컬 설치+Claude 월 $20~, $20 게이트는 '첫 AI 사용' 시점). 무서운 로컬설치를 유료·고의향 경로로 격리.
  - **D′** = from-zero 로컬셋업을 "무실패"로 (단계별 자동검증·실패 자동복구).
- **비용 정직성**: Claude Code 무료 티어 없음(최소 Pro $20). "무제한" 주장 금지.
- **브랜드 라인**: "다른 곳은 돈 내도 못 나가는데, 우리는 무료로도 완전히 당신 것." (acquisition 아니라 비교/retention 무기 — 졸업 브릿지·About에 배치)

---

## 1. 2026-06-19 세션에서 완료한 것 (전부 프로덕션 배포)

### 1-1. 진단 루프 ("안 됐어요?" 복구) — 커밋 `670562e`, `7073a1f`
사용자가 로컬 셋업에서 막혔을 때 터미널 출력을 붙여넣으면 원인 진단 + 사전 검증된 복구만 제시.
- **신규 패키지 `packages/diagnosis-catalog`**: `DiagnosisRule` 시드 카탈로그(rules.ts) + 매처(matcher.ts) + 복구 스크립트(remedies.ts) + 카탈로그 무결성/안전 검증(validate-catalog.ts, policy-engine `DANGEROUS_PATTERNS` 재사용).
- `shared-types/diagnosis.types.ts`, `policy-engine/dangerous-patterns.ts`(단일 출처로 분리).
- 웹: `apps/web/src/components/diagnosis/stuck-helper.tsx` → `/setup` 각 활성 스텝 카드에 마운트. 매칭은 클라이언트, 인식/모호/모름 3분기 + 재검증. 붙여넣은 출력은 매칭 전용(명령 합성 안 함).
- i18n `Diagnosis` 6언어 + cause 12/guide 6/ask 1 본문.
- ⚠️ 현재 `/setup`은 **pre-D′(레거시 복붙)** 플로우 — 진단 루프는 시그니처 매칭으로 작동하지만, 구조화 마커(`VIBESTART::`)는 D′ 하드닝(§2-6) 후에야 나옴.

### 1-2. B′ 첫성공 빌더 — 커밋 `2af2c0d`
- **신규 패키지 `packages/template-catalog`**: 템플릿 정의(나 소개·가게·초대장) + 결정론적 렌더 + **XSS 이스케이프**(render.ts). `shared-types/template.types.ts`.
- 웹: `apps/web/src/components/start/build-wizard.tsx` (카테고리 → 빈칸 채우기 → iframe 라이브 미리보기, 빈 칸은 샘플 자동 채움). `/start` 라우트(`app/[locale]/start/{layout,page}.tsx`).
- **liquid-glass 디자인** 적용: `apps/web/src/styles/liquid-glass.css`(벤더) + route-layout으로 /start에만 스코프. 튜너(`public/glass-tuner.js`)는 dev에서만 로드.
- i18n `Start` 6언어. 렌더 유닛 테스트(`src/test/template-render.test.ts`, XSS 포함).

### 1-3. 랜딩 메인 CTA → /start 전환 — 커밋 `c3175f8`
- 히어로·하단 CTA 둘 다: 메인(filled) "설치 없이 5분 체험" → `/start`, 보조(outline) "개발 환경 설치하기" → `/onboarding`.
- i18n `Landing.startCta`/`Landing.fullSetupCta` 6언어.
- 라이브 검증 완료: vibe-start.com 랜딩 CTA + /start 빌더 정상 렌더.

---

## 2. 다음 할 일 (차례대로)

빠른 마무리 → B′ 흐름 완성(화면 순) → D′ 하드닝 → 보강 순.

1. **/start 글래스 톤 시각 튜닝** (빠름). `pnpm dev:web` → /start 우하단 🎛(또는 Ctrl+Shift+G)로 블러·농도·모서리 조정 → "CSS 복사"한 `:root` knob 블록을 `liquid-glass.css` 상단에 굽기. (현재 시각 확인 안 됨 — 눈으로 보고 결정)
2. **죽은 i18n 키 3개 청소** (빠름): `Diagnosis.foundProblem`, `Diagnosis.remedy.guidePlaceholder`, `Diagnosis.remedy.askPrompt` — 6언어 모두에서 제거(i18n-sync 유지).
3. **B′ 화면 4 — 퍼블리시**: 미리보기 → 라이브 URL(`name.vibestart.app` 서브도메인) + **적시 가입**(올리기 직전, 카카오 우선). 첫성공 도파민 완성. 인프라: 와일드카드 서브도메인 호스팅 + 익명 임시 저장 + 가입.
4. **B′ 화면 5 — 졸업 브릿지** (2단). 🆓 무료=기존 **M1**(GitHub+Vercel OAuth) 재프레이밍 + 브라우저 기본편집 유지. 🚀 AI=**Phase 1 설치(D′)** + **M3** Claude, $20 게이트는 M3 진입 직전. 매니페스토(브랜드 라인) 두 카드 위.
5. **B′ 화면 3 — AI 손질** ("말로 바꿔보세요"): `PageEditPort`(헥사고날) + Claude API 어댑터. 모든 손질 undo 가능, AI 출력은 템플릿 스키마 검증 후 적용(생 에러 노출 ❌). 비용: Claude API.
6. **D′ 셋업 스크립트 하드닝** (`apps/web/src/lib/setup-steps.ts`): `trap`+구조화 마커(`VIBESTART::step=…::result=…::code=…`) + 항상 ✅/❌ 종료, pre-flight 점검(가상화/버전/관리자), 재부팅 체크포인트 UI, stale-PATH 검증(새 셸서 도구 확인), 멱등화, projectCreate → `git clone` 사용자 저장소로(스캐폴딩 대신). → 진단 루프 마커 매칭이 실제로 작동.
7. **진단 카탈로그 보강**: 실제 에러 시그니처 정규식(로케일/버전별), BIOS 그림 가이드 스크린샷, ③ 에스컬레이션 전송(마스킹), 자가개선 루프(미인식 붙여넣기 → 새 규칙).

### 이전 백로그 (여전히 유효, 위 끝낸 뒤)
- Phase 1→2 폴더 핸드오프 옵션 A (`PHASE1_DATA_COOKIE`를 onboarding/setup 진입 시 세팅, TTL 7일). 메모리 `project_phase1_handoff_pending` 참조.
- web-python 트랙 실기기 풀사이클 검증 · auth-ui locale 반영 · verify substep 실제 HTTP · 서버액션 에러 친화 메시지 · M2 메타 Vault 이관 · Phase 2b 트랙 전환 마이그레이션 가드.

---

## 3. 검증 명령

```bash
pnpm -r typecheck
pnpm --filter @vibestart/web lint
pnpm --filter @vibestart/web test     # 65 tests (i18n-sync 6언어 + 템플릿 렌더/XSS 포함)
pnpm --filter @vibestart/web build    # 푸시 전 게이트 (배포 = main push)
```

## 4. 이번 세션 커밋

```
c3175f8 feat(web): 랜딩 메인 CTA를 /start(설치 없이 5분 체험)로 전환
2af2c0d feat(web): B′ 첫성공 빌더 — 템플릿 카탈로그 + 라이브 미리보기(liquid-glass)
7073a1f feat(web): 진단 루프 cause/guide 본문 + 6개 언어 채움
670562e feat(web): 셋업 실패 진단 루프 추가 (diagnosis-catalog + StuckHelper)
```

## 5. 운영 규칙 (잊지 말기)

- **Vercel Hobby Co-Author 차단**: 커밋 메시지에 `Co-Authored-By` 태그 절대 금지.
- **커밋/푸시는 사용자 지시 시에만**. 푸시 = main → Vercel 배포 트리거.
- **근본 원인 우선**: 재현·검증 기반 수정, 가설은 검증 전 commit 금지.
- **데이터 보호**: 실데이터/실비밀 컨텍스트 반입 금지(전역 지침). 데모·검증은 합성 데이터.
- **i18n**: ko 원본, 6언어 동기화 필수(테스트가 강제). 새 메시지 키는 6개 다 추가.
- **헥사고날**: 비즈니스 로직은 packages/, 새 외부연동은 Port 먼저. 사용자 입력 셸/HTML 직접 삽입 금지(이스케이프/allowlist).
