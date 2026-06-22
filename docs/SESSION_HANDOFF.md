# Session Handoff — 2026-06-22

다른 기기에서 새 Claude Code 세션을 시작할 때 이 문서를 먼저 읽으면 작업을 바로 이어갈 수 있다. 이 PC의 `~/.claude/projects/.../memory/` 메모리는 git에 안 올라가므로, 핵심 전략·다음 단계를 여기 합쳐 둔다.

**최신 커밋**: `4eb8ad4` (5분 체험 미리보기 4종 와이어업 완성 — shop/invitation 필드 연결 + todo→launch)
**브랜치**: `main` (origin과 동기화됨)
**기준일**: 2026-06-22
**프로덕션**: https://vibe-start.com (아래 §1 작업 전부 라이브 배포됨)

## 다른 기기에서 바로 이어가기

```bash
cd ~/VibeStart && git pull      # 4eb8ad4 이상 확인
pnpm install
pnpm dev:web                    # localhost:3000 (점유 시 3001 fallback)
```

새 세션 첫 메시지 예:
> "docs/SESSION_HANDOFF.md 읽고 §2 다음 할 일 1번부터 차례대로 이어가자."

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

---

## 2. 다음 할 일 (남은 것)

빠른 마무리 → B′ 마지막 화면 → 보강 순.

1. **B′ 화면 3 — AI 손질** ("말로 바꿔보세요", **미구현**): `PageEditPort`(헥사고날) + Claude API 어댑터. 모든 손질 undo 가능, AI 출력은 템플릿 스키마 검증 후 적용(생 에러 노출 ❌). 비용: Claude API. → B′ 흐름의 마지막 미완 화면.
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
