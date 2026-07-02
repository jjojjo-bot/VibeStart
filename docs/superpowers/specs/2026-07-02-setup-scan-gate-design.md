# 설계: 설치 경험 분기 + 환경 스캔 게이트 (Windows 트랙)

- **날짜**: 2026-07-02
- **상태**: 사용자 승인됨 (구현 전)
- **배경**: Phase 1 이탈 1순위 지점이 재부팅(코드 주석 `setup-steps.ts` windowsRebootStep 참조)과 VS Code 설치라는 가설. Ubuntu(WSL)·VS Code 설치 단계를 "환경 준비" 구간으로 분리하고, 설치 경험이 있는 사용자는 스캔으로 건너뛰게 한다.

## 목표

1. 복귀자·부분 설치자(이미 WSL/VS Code 보유)가 설치 단계를 건너뛰고 본편에 바로 진입
2. 재부팅 포함 "환경 준비" 구간과 "본편"의 구조적 분리 — 퍼널 계측도 분리
3. VS Code 설치를 재부팅 앞으로 이동해 창 왕복 축소 + WSL PATH 스테일 문제 구조적 해결

## 비목표 (후속 과제)

- 신규 유저의 재부팅 이탈 자체를 줄이는 장치 (재부팅 후 브라우저 자동 재오픈 — RunOnce 등). 이번 변경과 **병행 관계**이며 별도 설계.
- macOS 스캔 (재부팅 없음, 두 허들 모두 Windows 고유)
- WSL 내부 도구(git/node/claude) 스캔 — 미초기화 배포판에서 `wsl` 실행 시 계정 생성 화면이 뜨는 부작용 때문에 의도적으로 제외

## 1. 온보딩 — "설치 경험" 질문 추가

- 위치: `apps/web/src/app/[locale]/onboarding/page.tsx` 위저드, os에서 **Windows 선택 시에만** 표시. macOS 플로우는 무변경.
- 질문: "이 컴퓨터에 개발 도구를 설치해본 적 있나요?"
  - ① 처음이에요 (`first`) — 절대초보 기본 경로, 스캔 없음, 기존 플로우 100% 동일
  - ② 해본 적 있어요 (`prior`)
  - ③ 모르겠어요 (`unsure`)
- 전달: URL 파라미터 `exp=first|prior|unsure` 로 `/setup`에 전달 (기존 os/goal/project 파라미터 패턴 동일). 파라미터 부재 시 `first`로 간주 (기존 링크·북마크 하위호환).
- 컴포넌트: `components/onboarding/step-experience.tsx` 신규 (step-os.tsx 패턴).

## 2. 스캔 게이트 — "내 컴퓨터 확인하기"

- 조건: `exp`가 `prior`/`unsure`이고 스캔 미완료(localStorage에 스캔 결과 없음)일 때, `/setup` 단계 목록 앞에 게이트 화면 표시.
- 구성:
  - PowerShell 여는 법 — 접힌 가이드 (기존 terminal 단계 detailedGuide 재사용/참조)
  - 스캔 명령 한 줄 + 복사 버튼 (기존 ScriptBlock 컴포넌트 재사용)
  - 출력 붙여넣기 textarea — **stuck-helper 패턴 그대로**: 붙여넣은 출력은 신뢰 불가, 마커 매칭에만 사용, 명령 합성 금지
  - 탈출구: "그냥 처음부터 할래요" 버튼 → 게이트 닫고 풀 트랙 (스캔이 막다른 길이 되지 않도록 필수)
- 스캔 결과는 localStorage에 저장 (진행상황 키와 동일한 os-goal-project 스코프). 재부팅 후 복귀 시 게이트 재표시 없음.

## 3. 스캔 명령

PowerShell 한 줄(세미콜론 체인 — 복붙 시 `>>` 연속 프롬프트 방지, wslVscodeStep 컨벤션 동일). 마커 출력은 **2줄** — 기존 `parseMarkers`(step/result/code 키만 파싱)를 무변경 재사용하기 위해 검사 항목당 마커 1개를 낸다:

```
VIBESTART::step=scan-wsl::result=ok|fail
VIBESTART::step=scan-vscode::result=ok|fail
```

(`result=ok` = 설치됨, `fail` = 미설치. 해석 함수 `parseScanOutput`은 `@vibestart/diagnosis-catalog`에 두어 비즈니스 규칙을 packages에 위치시킨다 — 헥사고날 원칙.)

- **WSL 판정**: `wsl.exe -l -q` 출력에 **Ubuntu 배포판이 있는지**로 판정. 단순 "목록 비어있지 않음"이 아닌 이유: Docker Desktop이 docker-desktop 배포판을 등록하므로 오탐이 남. 출력은 UTF-16이라 null 문자(`` `0 ``) 제거 후 매칭하고, `wsl.exe` 부재·오류는 Get-Command 가드 + try/catch + `$LASTEXITCODE` 확인으로 `fail` 처리.
- **VS Code 판정**: `Get-Command code` 존재 여부.
- WSL 내부 명령은 절대 실행하지 않음 (비목표 참조).
- 관리자 권한 불필요 — 스캔은 일반 PowerShell에서 동작해야 함 (preflight와 다름).

## 4. 플랜 반영 — 완료 셋 미리 채우기

`getSetupSteps` 로직 무변경. 스캔 결과를 기존 `completed: Set<stepId>` (localStorage 저장)에 pre-populate:

| 스캔 결과 | 완료 처리할 단계 id |
|---|---|
| `wsl=ok` | `preflight`, `wsl`, `reboot` |
| `vscode=ok` | `editor` |

- `wsl-open`은 완료 처리하지 않음 — WSL이 있어도 리눅스 창은 열어야 함.
- 단계는 숨기지 않고 ✓ 완료 상태로 표시 — 진행바가 채워진 채 시작 (endowed progress 효과).
- 이미 사용자가 진행한 completed 셋이 있으면 합집합(union)으로 병합 — 스캔이 기존 진행을 되돌리지 않음.

## 5. 단계 순서 재배치 — VS Code를 재부팅 앞으로

`getSetupSteps`의 Windows 분기 순서 변경:

- 현재: terminal → preflight → wsl → reboot → wsl-open → dev-tools-basic → (dev-tools-nodejs) → **editor** → ai-setup → project…
- 변경: terminal → preflight → **editor** → wsl → reboot → wsl-open → dev-tools-basic → (dev-tools-nodejs) → ai-setup → project…

효과:
1. 창 왕복 3회 → 1회 (PowerShell 구간 연속 → 재부팅 → Ubuntu 구간 연속)
2. Ubuntu 첫 실행 전 VS Code 설치 완료 → 새 Ubuntu 셸 PATH에 `code` 포함 → ai-setup의 `code --install-extension` 실패 원인(문서화된 PATH 스테일 위험) 구조적 소멸
3. 재부팅 전 쉬운 성공 1개 적립 (이탈 완충)

부수 변경:
- `wslVscodeStep`의 `group`을 `toolInstall` → `envPrep`로 이동 — "환경 준비(재부팅 포함)" vs "본편" 구간 분리를 그룹 라벨로 명확화.
- **주의**: group 변경만 하면 진단 매핑(`GROUP_TO_DIAGNOSIS_STEP`)이 envPrep→`wsl-install`로 바뀌어 StuckHelper가 엉뚱한 규칙을 적용함 → `diagnosisStep: "tools-install"`을 명시 오버라이드해 기존 진단 동작을 보존한다 (SetupStep 인터페이스가 정확히 이 용도로 제공하는 필드).
- editor 단계의 detailedGuide.windows에서 "Ubuntu 창을 닫고 다시 열라" 안내는 새 순서에서 불필요(Ubuntu가 아직 존재하지 않음) → "지금 열려 있는 PowerShell 창에서 바로 실행" 안내로 재작성 (6개 언어 값 동기화).

## 6. 계측 (GA4)

`lib/ga.ts`에 이벤트 3종 추가 (기존 trackSetup* 컨벤션):

- `setup_scan_shown` — 게이트 노출
- `setup_scan_result` — 파라미터: `wsl`(ok|missing), `vscode`(ok|missing)
- `setup_scan_skipped` — "그냥 처음부터 할래요" 선택

기존 `trackSetupStart(os, goal)`에 `exp` 파라미터를 추가해 경험 응답별 퍼널 분리를 가능하게 한다.

## 7. i18n

새 UI 문자열(경험 질문, 스캔 게이트, 탈출구 등)은 `ko.json` 원본 작성 후 en/ja/zh/es/hi 5개 파일 동기화. 셸 스크립트·마커는 번역하지 않음.

## 8. 보안·아키텍처 원칙 준수

- 스캔 명령은 정적 문자열 — 사용자 입력 삽입 없음 (command injection 원천 차단)
- 붙여넣은 출력은 매칭에만 사용, 명령 합성 금지 (stuck-helper 원칙 동일)
- 웹↔로컬 통신 없음 유지 (MVP 원칙) — 결과 회수는 수동 복붙

## 테스트 포인트

- 스캔 마커 파싱: ok/missing 4조합 + 마커 없음/오염된 출력 → 판정 불가 시 "풀 트랙" 안전 기본값
- `exp` 파라미터 부재/이상값 → `first` 폴백
- completed 병합이 기존 진행을 보존하는지
- 순서 재배치 후 스냅샷/단계 id 의존 테스트(diagnosis-mask, harden-diagnosis 등) 회귀 확인
- i18n 6개 언어 키 동기화 검증
