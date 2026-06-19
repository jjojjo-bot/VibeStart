import type { DiagnosisRule } from '@vibestart/shared-types';

/**
 * 시드 진단 규칙 (Windows 중심 + 공통).
 *
 * - markerCodes: 우리 래퍼가 심은 code (고신뢰)
 * - signatures: 하위 도구가 뱉는 에러 문자열 (정규식 소스, 대소문자 무시)
 * - causeKey/guideKey/questionKey: i18n·가이드 카탈로그 키 (실콘텐츠는 별도)
 *
 * ⚠️ signatures는 대표값 — 실기기/로케일별 문자열로 보강(자가개선 루프 1차 수확).
 */
export const diagnosisRules: DiagnosisRule[] = [
  // R1 · 가상화(BIOS) 꺼짐 — 스크립트 불가, 그림 가이드
  {
    id: 'virtualization-off',
    match: {
      markerCodes: ['0x80370102'],
      signatures: ['0x80370102', 'virtualiz', 'hyper-v'],
      steps: ['preflight', 'wsl-install'],
    },
    confidence: 'high',
    causeKey: 'cause.virtualization-off',
    remedy: {
      kind: 'guide',
      guideKey: 'bios-virtualization',
      image: { src: '/diagnosis/bios-virtualization.svg', altKey: 'guideImage.bios-virtualization' },
    },
    verifyStep: 'preflight',
  },
  // R2 · WSL 커널 오래됨
  {
    id: 'wsl-kernel-outdated',
    match: {
      signatures: ['wsl 2 requires an update to its kernel'],
      steps: ['wsl-install'],
    },
    confidence: 'high',
    causeKey: 'cause.wsl-kernel-outdated',
    remedy: { kind: 'script', remedyKey: 'wsl-update' },
    verifyStep: 'wsl-install',
  },
  // R3 · WSL 기능 미활성
  // ⚠️ 'wslregisterdistribution'는 모든 등록 실패의 공통 래퍼라 가상화(0x80370102)
  //    에러와도 겹쳐 모호성을 유발 → 구체 코드만 시그니처로 둔다(R1과 분리).
  {
    id: 'wsl-features-missing',
    match: {
      markerCodes: ['0x80004005', '0x80070002'],
      signatures: ['0x80004005', '0x80070002'],
      steps: ['wsl-install'],
    },
    confidence: 'high',
    causeKey: 'cause.wsl-features-missing',
    remedy: { kind: 'script', remedyKey: 'enable-wsl-features' },
    verifyStep: 'wsl-install',
  },
  // R4 · 명령을 못 찾음 (stale PATH 우선)
  {
    id: 'command-not-found',
    match: {
      // 한국어 Ubuntu/WSL: "bash: xxx: 명령을 찾을 수 없습니다"
      signatures: ['command not found', '명령을 찾을 수 없습니다'],
      steps: ['tools-install', 'claude-install'],
    },
    confidence: 'high',
    causeKey: 'cause.command-not-found',
    remedy: { kind: 'script', remedyKey: 'refresh-shell' },
    verifyStep: 'tools-install',
  },
  // R5 · 창을 잘못 씀 (PowerShell에 bash 명령)
  {
    id: 'wrong-shell',
    match: {
      signatures: [
        'is not recognized as the name of a cmdlet',
        "'apt' is not recognized",
        "'sudo' is not recognized",
        // 한국어 PowerShell: "'apt' 용어가 cmdlet, 함수, 스크립트 파일 ... 인식되지 않습니다"
        'cmdlet, 함수, 스크립트',
      ],
      steps: ['tools-install', 'claude-install'],
    },
    confidence: 'high',
    causeKey: 'cause.wrong-shell',
    remedy: { kind: 'guide', guideKey: 'open-ubuntu-terminal' },
    verifyStep: 'tools-install',
  },
  // R6 · 재부팅 안 함
  {
    id: 'reboot-needed',
    match: {
      signatures: ['please restart', 'reboot to complete', 'restart your computer'],
      steps: ['wsl-install'],
    },
    confidence: 'medium',
    causeKey: 'cause.reboot-needed',
    remedy: { kind: 'reboot' },
    verifyStep: 'wsl-install',
  },
  // R7 · 네트워크 차단 — 모호하므로 한 번 물어보고 분기
  {
    id: 'network-blocked',
    match: {
      signatures: [
        'curl: \\(6\\)',
        'curl: \\(7\\)',
        'curl: \\(28\\)',
        'enotfound',
        'etimedout',
        'could not resolve host',
        'temporary failure in name resolution',
        'network is unreachable',
      ],
    },
    confidence: 'medium',
    causeKey: 'cause.network-blocked',
    remedy: {
      kind: 'ask',
      questionKey: 'ask.network-kind',
      branchRuleIds: ['network-corporate', 'network-home'],
    },
    verifyStep: 'tools-install',
  },
  // R7-a · 회사/학교 네트워크 (분기 전용)
  {
    id: 'network-corporate',
    match: { signatures: ['proxy', 'forbidden by policy'] },
    confidence: 'medium',
    causeKey: 'cause.network-corporate',
    remedy: { kind: 'guide', guideKey: 'network-corporate' },
    verifyStep: 'tools-install',
  },
  // R7-b · 가정 네트워크 (분기 전용)
  {
    id: 'network-home',
    match: {},
    confidence: 'medium',
    causeKey: 'cause.network-home',
    remedy: { kind: 'guide', guideKey: 'network-retry' },
    verifyStep: 'tools-install',
  },
  // R8 · npm 권한 에러
  {
    id: 'permission-eacces',
    match: {
      signatures: ['eacces', 'permission denied', 'operation not permitted'],
      steps: ['tools-install', 'claude-install'],
    },
    confidence: 'high',
    causeKey: 'cause.permission-eacces',
    remedy: { kind: 'script', remedyKey: 'npm-user-prefix' },
    verifyStep: 'claude-install',
  },
  // R8-b · 관리자 권한 필요 (PowerShell) — pre-flight 사전점검 포함
  {
    id: 'needs-admin',
    match: {
      markerCodes: ['needs-admin'],
      signatures: [
        'requires administrator',
        'run this command as an administrator',
        'elevated permissions',
        'requires elevation',
        'the requested operation requires elevation',
        'not administrator - reopen powershell as administrator',
      ],
      steps: ['preflight', 'wsl-install'],
    },
    confidence: 'high',
    causeKey: 'cause.needs-admin',
    remedy: { kind: 'guide', guideKey: 'run-as-admin' },
    verifyStep: 'wsl-install',
  },
  // R9 · 디스크 부족
  {
    id: 'disk-space',
    match: { signatures: ['enospc', 'no space left on device'] },
    confidence: 'high',
    causeKey: 'cause.disk-space',
    remedy: { kind: 'guide', guideKey: 'free-disk-space' },
    verifyStep: 'tools-install',
  },
];
