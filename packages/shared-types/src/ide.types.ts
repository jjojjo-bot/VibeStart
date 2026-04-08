/**
 * Phase 2 — VS Code Extension 브릿지 데이터 형태.
 *
 * 웹은 사용자 컴퓨터의 localhost를 직접 만질 수 없으므로 vibestart 서버를
 * 메시지 브로커로 두고, Extension과 웹이 서버에 WebSocket으로 붙는다.
 *
 * 보안: shell.run 명령은 vibestart 서버가 서명한 사전 정의 스크립트만
 * 수락한다. 임의 셸 명령은 절대 허용하지 않는다.
 */

import type { UserId } from './auth.types';

/**
 * 웹이 Extension에 보내는 명령. 모든 명령은 화이트리스트 형태로만 정의된다.
 */
export type IdeCommand =
  | { kind: 'git.clone'; repoUrl: string; targetDir: string }
  | { kind: 'file.write'; relPath: string; content: string }
  | {
      kind: 'shell.run';
      cwd: string;
      command: string;
      argv: readonly string[];
      /** vibestart 서버의 Ed25519 서명 — Extension이 검증한다 */
      signature: string;
    }
  | { kind: 'vscode.open'; folderPath: string }
  | { kind: 'mcp.install'; name: string; config: Record<string, unknown> }
  | { kind: 'slashCommand.install'; name: string; body: string }
  | { kind: 'subagent.install'; name: string; profile: Record<string, unknown> };

export interface IdeCommandResult {
  correlationId: string;
  ok: boolean;
  data: unknown;
  error: { code: string; message: string } | null;
}

/**
 * Extension이 자발적으로 보내는 이벤트 (사용자 파일 저장, 폴더 열림 등).
 * 마일스톤 진행 중 사용자가 수동으로 변경한 사항을 웹이 알아채는 용도.
 */
export interface IdeEvent {
  name: string;
  payload: Record<string, unknown>;
}

/**
 * 페어링 결과. 웹에서 6자리 코드를 표시하면 Extension이 입력해 교환한다.
 */
export interface IdePairing {
  userId: UserId;
  /** 30일 long-lived JWT (Extension keychain에 저장) */
  token: string;
  expiresAt: string;
}
