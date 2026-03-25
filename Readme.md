# VibeStart Agent 프로젝트 명세

## 1. 프로젝트 개요

### 프로젝트명

VibeStart Agent

### 한 줄 정의

비전공자가 웹에서 개발 목적을 선택하면, 로컬 에이전트가 사용자 승인 후 PC에 필요한 개발 도구 설치와 초기 세팅을 자동으로 수행해 주는 바이브코딩 스타터 서비스.

### 해결하려는 문제

비전공자는 바이브코딩을 시작하고 싶어도 다음 단계에서 자주 이탈한다.

* 무엇을 설치해야 하는지 모른다.
* Git, Node.js, VS Code, GitHub, Claude Code 같은 도구 관계를 모른다.
* Windows 환경에서 PATH, 권한, 버전 충돌 같은 문제를 해결하지 못한다.
* 설치가 끝나도 다음에 무엇을 해야 하는지 모른다.

이 프로젝트는 단순 설치 가이드가 아니라, **비전공자를 실제 개발 가능한 상태까지 이동시키는 자동 온보딩 시스템**을 목표로 한다.

---

## 2. 제품 목표

### 1차 목표

Windows 비전공자가 최소한의 클릭만으로 웹앱 개발을 시작할 수 있는 환경을 만든다.

### MVP 완료 기준

아래 상태까지 완료되면 MVP 성공으로 본다.

* Git 설치 완료
* Node.js LTS 설치 완료
* VS Code 설치 완료
* 기본 개발 폴더 생성 완료
* Next.js 템플릿 프로젝트 생성 완료
* `npm install` 완료
* `npm run dev` 실행 완료
* 사용자가 브라우저에서 로컬 앱 첫 화면 확인 완료

### 핵심 가치

* 설명이 아니라 실행
* 원격 제어가 아니라 사용자 승인 기반 자동화
* 설치가 아니라 “개발 시작 가능 상태”까지 연결

---

## 3. 핵심 타겟

### 1차 타겟

* IT 비전공자
* Windows 11 사용자
* 웹앱이나 간단한 서비스 제작을 목표로 하는 사용자
* Claude Code, Cursor, ChatGPT 같은 AI 개발 툴에 관심은 있으나 개발환경 세팅에 익숙하지 않은 사용자

### 대표 사용자 예시

1. 1인 창업 준비자
2. 기획자 / 사무직 / 마케터
3. 콘텐츠 제작자 / 셀러 / 자영업자

---

## 4. 제품 범위

### MVP 포함 범위

* 사용자 환경 진단
* 개인 맞춤 설치 플랜 생성
* 로컬 에이전트 다운로드 및 실행
* 사용자 승인 기반 설치/세팅 실행
* 설치 결과 검증
* Next.js 스타터 프로젝트 생성
* 개발 서버 실행 확인
* 대표 오류 안내

### MVP 제외 범위

* macOS 지원
* Linux 지원
* Docker 세팅
* 모바일 앱 개발 환경 세팅
* Android Studio / Xcode 세팅
* DB 로컬 설치
* 복잡한 기업망/프록시 최적화
* 원격 무인 제어

---

## 5. 핵심 원칙

### 원칙 1. 사용자 PC를 원격으로 직접 제어하지 않는다

서버는 설치 계획만 전달하고 실제 실행은 반드시 로컬 에이전트가 담당한다.

### 원칙 2. 모든 작업은 실행 전에 공개된다

사용자에게 다음 항목을 명확히 보여준다.

* 무엇을 설치하는지
* 어떤 변경이 발생하는지
* 관리자 권한이 필요한지
* 어느 단계까지 자동으로 처리되는지

### 원칙 3. 사용자 승인 후에만 실행한다

설치 및 설정 변경은 반드시 승인 후 수행한다.

### 원칙 4. 임의 명령 실행을 허용하지 않는다

에이전트는 문자열 명령을 그대로 실행하지 않고, 미리 정의된 Task Catalog 기반으로만 동작한다.

### 원칙 5. AI는 추천과 오류 해석에만 관여한다

AI가 임의 shell 명령을 생성해 즉시 실행하는 구조는 금지한다.

---

## 6. 시스템 구조

### 전체 구성

1. 웹 애플리케이션
2. 로컬 에이전트
3. Task Catalog
4. 실행 엔진
5. 정책 엔진
6. 검증 및 리포팅 모듈

### 역할 분리

#### 웹 애플리케이션

* 사용자 온보딩
* OS/목표/경험 수준 입력
* 설치 플랜 생성
* 실행 상태 표시
* 오류 가이드 제공

#### 로컬 에이전트

* 로컬 환경 감지
* 설치 전 미리보기 제공
* 사용자 승인 수집
* 실제 설치 및 초기 세팅 수행
* 실행 로그 수집
* 검증 결과 전송

#### Task Catalog

* 허용된 작업 정의
* 작업별 선행 조건, 액션, 검증 규칙 정의
* 버전 관리

#### Policy Engine

* 허용된 Task만 실행
* 허용된 Action만 실행
* 위험한 경로/명령 차단
* 승인 여부 확인
* 관리자 권한 요구 조건 검증

#### Executor

* PowerShell 기반 명령 실행
* stdout/stderr 수집
* timeout 관리
* exit code 처리

#### Verifier

* 실행 후 실제 성공 여부 확인
* 버전 체크
* 파일/폴더 존재 확인
* 포트 오픈 여부 확인

---

## 7. 에이전트 실행 흐름

### 1단계. Detect

로컬 PC의 현재 상태를 점검한다.

예시:

* winget 사용 가능 여부
* Git 설치 여부
* Node 설치 여부
* VS Code 설치 여부
* 사용자 홈 경로
* 작업 폴더 권한 상태

### 2단계. Resolve

이미 설치된 항목은 건너뛰고 필요한 작업만 남긴다.

### 3단계. Preview

사용자에게 실행 예정 작업을 보여준다.

예시:

* Git 설치
* Node.js LTS 설치
* Next.js 프로젝트 생성
* npm 패키지 설치
* 개발 서버 실행

### 4단계. Approve

사용자가 전체 또는 일부 작업을 승인한다.

### 5단계. Execute

승인된 작업을 순서대로 실행한다.

### 6단계. Verify

각 작업이 실제로 성공했는지 검증한다.

### 7단계. Report

작업 결과를 UI와 서버에 반영한다.

---

## 8. Task 기반 실행 모델

### Task를 사용하는 이유

서버가 임의 명령 문자열을 직접 내려보내는 구조는 보안상 위험하다. 따라서 모든 실행은 Task Catalog에 미리 정의된 Task Key를 통해 수행한다.

### Task 구성 요소

* `taskKey`
* `prechecks`
* `actions`
* `verifications`
* `rollback`
* `retryPolicy`
* `ui`

### 예시 Task

* `detect_winget`
* `detect_git`
* `install_git`
* `install_node_lts`
* `install_vscode`
* `create_nextjs_app`
* `npm_install`
* `run_dev_server`

---

## 9. MVP Task Catalog

### Detect 계열

* detect_winget
* detect_git
* detect_node
* detect_vscode
* detect_workspace_permissions

### Install 계열

* install_git
* install_node_lts
* install_vscode

### Project Init 계열

* create_nextjs_app
* npm_install
* run_dev_server

### Verify 계열

* verify_git
* verify_node
* verify_vscode
* verify_project_files
* verify_dev_server_port

---

## 10. 권장 기술 스택

### 웹

* Next.js
* Tailwind CSS
* shadcn/ui
* Supabase

### 로컬 에이전트

* TypeScript
* Node.js 기반 CLI 또는 Tauri

### 실행 엔진

* Windows PowerShell
* winget

### AI 활용

* 설치 플랜 추천
* 에러 메시지 해석
* 다음 액션 제안

---

## 11. 폴더 구조 제안

```text
project/
 ├─ apps/
 │   ├─ web/
 │   └─ agent/
 │
 ├─ packages/
 │   ├─ task-catalog/
 │   ├─ shared-types/
 │   ├─ policy-engine/
 │   └─ executor-core/
 │
 ├─ docs/
 │   ├─ product/
 │   ├─ architecture/
 │   └─ tasks/
 │
 └─ README.md
```

### agent 내부 예시

```text
apps/agent/src/
 ├─ domain/
 │   ├─ task.types.ts
 │   ├─ task.schema.ts
 │   ├─ plan.types.ts
 │   └─ plan.schema.ts
 │
 ├─ catalog/
 │   ├─ install-git.task.ts
 │   ├─ install-node-lts.task.ts
 │   ├─ install-vscode.task.ts
 │   ├─ create-nextjs-app.task.ts
 │   └─ index.ts
 │
 ├─ services/
 │   ├─ env-detector.ts
 │   ├─ variable-resolver.ts
 │   ├─ task-validator.ts
 │   ├─ approval-service.ts
 │   └─ report-service.ts
 │
 ├─ policy/
 │   └─ policy-engine.ts
 │
 ├─ executor/
 │   ├─ process-executor.ts
 │   ├─ action-runner.ts
 │   └─ verification-runner.ts
 │
 └─ app/
     └─ bootstrap.ts
```

---

## 12. 상태 머신

### Task 상태

* PENDING
* PRECHECKING
* AWAITING_APPROVAL
* APPROVED
* RUNNING
* VERIFYING
* SUCCEEDED
* FAILED
* SKIPPED
* BLOCKED
* ROLLED_BACK

### Plan 상태

* CREATED
* DETECTING
* READY_FOR_APPROVAL
* EXECUTING
* PARTIAL_FAILED
* COMPLETED
* CANCELLED

---

## 13. 보안 정책

### 기본 정책

1. Allowlist 기반 Task만 실행
2. Allowlist 기반 Action만 실행
3. 사용자 승인 없는 medium/high risk 작업 차단
4. 사용자 작업 폴더 바깥 파일 수정 금지
5. 시스템 핵심 경로 접근 금지
6. 임의 URL 오픈 금지
7. 관리자 권한은 필요한 작업에만 요청

### 차단해야 할 예시

* 시스템 전체 삭제 명령
* 포맷 관련 명령
* 레지스트리 위험 수정
* 허용되지 않은 네트워크 다운로드
* 사용자 홈 바깥 대규모 파일 조작

---

## 14. 대표 오류 시나리오

MVP 단계에서 우선 대응할 오류는 아래 10개다.

1. winget 사용 불가
2. 관리자 권한 부족
3. PATH 반영 안 됨
4. git 설치 후 명령 인식 실패
5. node 설치 후 npm 오류
6. 회사 PC 정책으로 설치 차단
7. 네트워크 차단 또는 프록시 문제
8. 기존 구버전 Node 충돌
9. 프로젝트 폴더 권한 부족
10. 포트 충돌로 dev server 실행 실패

---

## 15. 사용자 플로우

### 화면 1. 랜딩

* 서비스 소개
* 시작 버튼

### 화면 2. 환경 진단

* OS 선택
* 목적 선택
* 경험 수준 선택

### 화면 3. 맞춤 세팅 플랜

* 설치 항목 목록
* 이미 설치된 항목 표시
* 예상 변경사항 표시

### 화면 4. 에이전트 다운로드 및 연결

* 로컬 에이전트 다운로드
* 실행 안내
* 연결 확인

### 화면 5. 실행 승인

* 작업 리스트
* 관리자 권한 필요 여부
* 실행 버튼

### 화면 6. 진행 상태

* 현재 작업
* 로그
* 성공/실패 표시

### 화면 7. 첫 프로젝트 확인

* 로컬 주소 열기
* VS Code 열기
* 다음 단계 안내