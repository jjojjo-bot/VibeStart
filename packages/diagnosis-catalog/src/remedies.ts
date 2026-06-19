import type { RemedyScript } from '@vibestart/shared-types';

/**
 * 시드 복구 스크립트 — 전부 사전 작성·허용목록 검증 대상.
 * 의도적으로 sudo·command substitution·`curl|bash`를 피해
 * policy-engine의 DANGEROUS_PATTERNS를 통과하도록 작성한다.
 *
 * ⚠️ 정확한 에러 문자열/명령은 실기기 검증으로 보강(자가개선 루프).
 */

/** R2 · WSL 커널 오래됨 */
export const remedyWslUpdate: RemedyScript = {
  remedyKey: 'wsl-update',
  displayName: 'WSL 커널 업데이트',
  description: 'WSL 커널 부품을 최신으로 업데이트한다.',
  requiresElevation: true,
  actions: [
    { type: 'powershell', command: 'wsl --update', elevated: true, timeoutMs: 180000 },
    { type: 'powershell', command: 'wsl --status', elevated: true, timeoutMs: 30000 },
  ],
};

/** R3 · WSL 기능 미활성 (이후 재부팅 필요) */
export const remedyEnableWslFeatures: RemedyScript = {
  remedyKey: 'enable-wsl-features',
  displayName: 'WSL 기능 활성화',
  description: 'WSL과 가상 머신 플랫폼 Windows 기능을 켠다. 이후 재부팅이 필요하다.',
  requiresElevation: true,
  actions: [
    {
      type: 'powershell',
      command:
        'dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart',
      elevated: true,
      timeoutMs: 120000,
    },
    {
      type: 'powershell',
      command:
        'dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart',
      elevated: true,
      timeoutMs: 120000,
    },
  ],
};

/** R4 · 방금 깐 도구가 현재 셸에 안 잡힘(stale PATH) */
export const remedyRefreshShell: RemedyScript = {
  remedyKey: 'refresh-shell',
  displayName: '터미널 새로고침',
  description: '방금 설치한 도구가 현재 셸에 안 잡힐 때 PATH를 다시 읽고 확인한다.',
  requiresElevation: false,
  actions: [
    { type: 'bash', command: 'source ~/.bashrc 2>/dev/null || true', timeoutMs: 10000 },
    { type: 'bash', command: 'command -v node && command -v git', timeoutMs: 10000 },
  ],
};

/** R8 · npm 권한 에러(EACCES) — sudo 없이 사용자 폴더 설치로 전환 */
export const remedyNpmUserPrefix: RemedyScript = {
  remedyKey: 'npm-user-prefix',
  displayName: 'npm 사용자 폴더 설정',
  description:
    '권한 에러(EACCES) 없이 설치하도록 npm 전역 경로를 사용자 폴더로 바꾼다(sudo 미사용).',
  requiresElevation: false,
  actions: [
    { type: 'bash', command: 'mkdir -p ~/.npm-global', timeoutMs: 10000 },
    { type: 'bash', command: 'npm config set prefix ~/.npm-global', timeoutMs: 10000 },
    {
      type: 'bash',
      command:
        'grep -q ".npm-global/bin" ~/.bashrc || echo "export PATH=~/.npm-global/bin:$PATH" >> ~/.bashrc',
      timeoutMs: 10000,
    },
  ],
};

export const remedyScripts: RemedyScript[] = [
  remedyWslUpdate,
  remedyEnableWslFeatures,
  remedyRefreshShell,
  remedyNpmUserPrefix,
];
