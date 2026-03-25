# VibeStart — 프로젝트 규칙

## 프로젝트 개요

비전공자가 웹에서 개발 목적을 선택하면, 맞춤 셸 스크립트를 단계별로 제공하여 개발 도구 설치와 초기 세팅을 안내하는 서비스.

- **MVP 타겟**: Windows 우선, macOS 지원 → Git / Node.js / VS Code / Next.js 프로젝트 생성까지
- **구성**: 웹앱(Next.js)만으로 동작. 별도 앱 설치 없음
- **핵심 UX**: 단계별 스크립트 복붙 → 각 단계 완료 시 성취감 → 이탈율 최소화

---

## 모노레포 구조

```
apps/
  web/               — Next.js 웹앱 (@vibestart/web)
packages/
  shared-types/      — 공유 타입 정의 (@vibestart/shared-types)
  task-catalog/      — Task 정의 및 레지스트리 (@vibestart/task-catalog)
  policy-engine/     — 실행 정책 및 allowlist 검증 (@vibestart/policy-engine)
  script-generator/  — OS별 셸 스크립트 조립 엔진 (@vibestart/script-generator)
```

---

## 사용자 플로우

```
1. 웹 온보딩 — OS / 목적 / 경험 수준 선택
2. 맞춤 플랜 표시 — "Git, Node.js, VS Code, Next.js 프로젝트를 설치합니다"
3. 단계별 실행 — Step 1/4 → [스크립트 복사] → 터미널에 붙여넣기 → 실행 → 완료 확인
4. 완료 — 모든 단계 완료 시 축하 화면
```

- 각 단계는 독립적 스크립트. 이전 단계 완료 확인 후 다음 단계 활성화
- MVP에서 "완료 확인"은 사용자 체크박스 (자동 검증은 이후 확장)
- 웹 ↔ 로컬 통신 없음 (MVP). 스크립트가 터미널에 진행상황 직접 출력

---

## 패키지 매니저

- **pnpm만 사용**. npm, yarn 절대 사용하지 않음
- 패키지 설치: `pnpm add <pkg>` (특정 워크스페이스: `pnpm --filter @vibestart/web add <pkg>`)
- 전체 설치: `pnpm install`
- 루트에서 전체 실행: `pnpm -r <script>`

---

## 아키텍처 원칙 (헥사고날)

- **도메인 로직은 포트(인터페이스)에만 의존**. 외부 시스템(DB, OS, UI)에 직접 의존하지 않음
- **어댑터는 포트를 구현**. 어댑터끼리 직접 참조 금지
- **의존성 방향**: `adapter → domain (port)`. 역방향 금지
- 새 외부 연동이 생기면 반드시 Port 인터페이스를 먼저 정의하고, 그 다음 Adapter 구현
- 비즈니스 규칙은 `packages/` 안에만 위치. `apps/`에 비즈니스 로직 작성 금지

---

## TypeScript 규칙

- `any` 사용 금지. 불가피하면 `unknown` + 타입 가드 사용
- 모든 공개 함수/메서드에 반환 타입 명시
- `interface`는 포트(계약) 정의에, `type`은 데이터 형태 정의에 사용
- `tsconfig.base.json`의 strict 설정 유지 (`strict: true`)
- 타입은 `packages/shared-types`에서 관리. 앱/패키지에서 중복 정의 금지

---

## 코드 스타일

- 포매터: Prettier (`.prettierrc` 기준)
- 탭 대신 스페이스 2칸
- 함수형 스타일 선호. 사이드 이펙트는 어댑터 레이어에 격리
- 파일명: `kebab-case.ts`, 클래스/인터페이스: `PascalCase`, 변수/함수: `camelCase`
- 포트 인터페이스 파일명 접미사: `*Port.ts`, 어댑터: `*Adapter.ts`, 서비스: `*Service.ts`

---

## 보안 원칙

- **스크립트는 Task Catalog에 정의된 명령만 포함** (allowlist 방식). 임의 명령 생성 금지
- 사용자 입력을 셸 명령에 직접 삽입하지 않음 (command injection 방지)
- 스크립트 생성은 `policy-engine`의 allowlist/path-safety 규칙 통과 후에만 수행

---

## 주요 스크립트

```bash
pnpm dev:web          # 웹앱 개발 서버 (localhost:3000)
pnpm typecheck        # 전체 타입 체크
pnpm build            # 전체 빌드
pnpm lint             # 전체 린트
```

---

## 커밋 컨벤션

```
<type>(<scope>): <subject>

type: feat | fix | refactor | test | docs | chore
scope: web | shared-types | task-catalog | policy-engine | script-generator
```

예시: `feat(web): 온보딩 플로우 UI 구현`

---

## 작업 우선순위 (MVP 완료 기준)

1. 웹앱 UI (랜딩 → 온보딩 → 플랜 → 단계별 실행 → 완료)
2. script-generator 구현 (OS별 스크립트 조립)
3. task-catalog ↔ script-generator 연동
4. 에러 핸들링 및 오류 시나리오 대응
5. 테스트 및 CI/CD

MVP 완료 기준: **비전공자가 웹에서 목적 선택 → 단계별 스크립트 복붙 실행 → Git/Node/VS Code/Next.js 설치 완료**
