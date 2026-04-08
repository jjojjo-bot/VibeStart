/**
 * IdeBridgePort — 사용자 컴퓨터의 VS Code Extension과 통신하는 브릿지.
 *
 * 웹은 사용자 localhost를 직접 만질 수 없으므로 vibestart 서버가 메시지
 * 브로커가 된다. 이 포트의 1순위 어댑터는 WebSocket 기반 broker이며,
 * 도메인은 어떻게 메시지가 전달되는지 모른다 — `send`만 호출한다.
 *
 * 보안: shell.run 명령은 vibestart 서버가 서명한 사전 정의 스크립트만
 * 통과한다. 임의 셸 명령은 절대 허용하지 않는다.
 */

import type {
  IdeCommand,
  IdeCommandResult,
  UserId,
} from '@vibestart/shared-types';

export interface IdeBridgePort {
  /**
   * 사용자의 Extension이 현재 연결되어 있는지 확인한다.
   * 마일스톤 화면 상단 "● 연결됨" 표시에 사용된다.
   */
  isConnected(userId: UserId): Promise<boolean>;

  /**
   * Extension에 명령을 보내고 결과를 기다린다.
   * 타임아웃·재시도는 어댑터 책임. 도메인은 ok/error만 본다.
   */
  send(userId: UserId, command: IdeCommand): Promise<IdeCommandResult>;
}
