/**
 * Phase 2 — 마일스톤 "정의"(카탈로그 상수) 도메인 타입.
 *
 * MilestoneStatus가 "어떤 사용자의 어떤 프로젝트에서 이 마일스톤이 지금
 * 어디까지 왔는가"를 표현한다면, MilestoneDefinition은 "정적 트랙 M3는
 * Vercel Analytics와 GA4를 켜는 단계이고 5개의 서브스텝으로 이루어져 있다"
 * 처럼 트랙/마일스톤의 불변 정의를 담는다.
 *
 * 이 타입들은 @vibestart/track-catalog 패키지가 구현하며, 도메인 전체에서
 * 정적 데이터로 취급된다 (빌드 타임에 고정).
 */

import type { MilestoneId, ProjectTrack } from './project.types';

/**
 * 서브스텝의 종류 — UI가 각 종류에 맞는 시각적 단서를 그릴 수 있도록 구분.
 */
export type SubstepKind =
  | 'oauth' // 외부 서비스 OAuth 연결 (사용자 클릭 → vibestart 자동 처리)
  | 'auto' // vibestart가 백그라운드에서 자동 실행
  | 'user-action' // 사용자가 외부 대시보드에서 직접 작업 (Google Cloud Console 등)
  | 'verify' // 결과 검증 (배포 URL 열림 확인 등)
  | 'copy-paste'; // 명령/코드 복붙 (Phase 1 스타일 fallback)

/**
 * 단일 서브스텝 정의.
 */
export interface Substep {
  /** 'm1.s1.github-oauth' 같은 안정 ID (메트릭/로그 키) */
  id: string;
  kind: SubstepKind;
  /** i18n 메시지 키. 예: 'Milestones.m1-deploy.substeps.m1.s1.github-oauth' */
  titleKey: string;
  /** user-action 타입일 때 사용자가 열 외부 URL */
  externalUrl: string | null;
  /** 자동 실행 단계의 예상 소요 시간(초). null이면 즉시/사용자 대기 */
  estimatedSeconds: number | null;
}

/**
 * 마일스톤 종료 시 Claude Code에 자동 등록되는 MCP 서버 + 슬래시 커맨드.
 * Phase 2의 핵심 차별점: 사용자가 외부 대시보드 안 가도 Claude Code에서
 * 자연어로 운영 가능한 상태로 각 마일스톤이 끝나야 한다.
 */
export interface McpInstall {
  /** Claude Code mcp.json에 등록될 이름 */
  name: string;
  /** 사용자 UI 설명용 i18n 키 */
  descriptionKey: string;
  /** 함께 설치되는 슬래시 커맨드 목록 (UI 노출용) */
  slashCommands: ReadonlyArray<string>;
}

/**
 * 결과 미리보기(ResultPreview 컴포넌트)의 종류.
 * 각 마일스톤이 완료되면 무엇이 "눈에 보이는 변화"로 나타나는지 결정.
 */
export type MilestonePreviewKind =
  | 'vercel-deploy'
  | 'auth-form'
  | 'analytics-chart'
  | 'sentry-issue'
  | 'domain-banner'
  | 'vibe-coding-diff';

/**
 * 마일스톤의 불변 정의 (카탈로그 항목).
 */
export interface MilestoneDefinition {
  id: MilestoneId;
  track: ProjectTrack;
  /** 트리 내 순서 (1-based) */
  order: number;
  /** i18n 키 — 제목 */
  titleKey: string;
  /** i18n 키 — "완료하면" 결과물 문구 */
  outcomeKey: string;
  /** i18n 키 — 한 줄 설명 */
  shortDescriptionKey: string;
  substeps: ReadonlyArray<Substep>;
  mcpInstalls: ReadonlyArray<McpInstall>;
  previewKind: MilestonePreviewKind;
  /** 다음 마일스톤 ID. 마지막이면 null */
  unlocks: MilestoneId | null;
}
