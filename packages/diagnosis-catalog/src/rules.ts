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
    causeKey: 'diagnosis.cause.virtualization-off',
    remedy: { kind: 'guide', guideKey: 'bios-virtualization' },
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
    causeKey: 'diagnosis.cause.wsl-kernel-outdated',
    remedy: { kind: 'script', remedyKey: 'wsl-update' },
    verifyStep: 'wsl-install',
  },
  // R3 · WSL 기능 미활성
  {
    id: 'wsl-features-missing',
    match: {
      markerCodes: ['0x80004005', '0x80070002'],
      signatures: ['wslregisterdistribution', '0x80004005', '0x80070002'],
      steps: ['wsl-install'],
    },
    confidence: 'high',
    causeKey: 'diagnosis.cause.wsl-features-missing',
    remedy: { kind: 'script', remedyKey: 'enable-wsl-features' },
    verifyStep: 'wsl-install',
  },
  // R4 · 명령을 못 찾음 (stale PATH 우선)
  {
    id: 'command-not-found',
    match: {
      signatures: ['command not found'],
      steps: ['tools-install', 'claude-install'],
    },
    confidence: 'high',
    causeKey: 'diagnosis.cause.command-not-found',
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
      ],
      steps: ['tools-install', 'claude-install'],
    },
    confidence: 'high',
    causeKey: 'diagnosis.cause.wrong-shell',
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
    causeKey: 'diagnosis.cause.reboot-needed',
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
        'enotfound',
        'etimedout',
        'could not resolve host',
      ],
    },
    confidence: 'medium',
    causeKey: 'diagnosis.cause.network-blocked',
    remedy: {
      kind: 'ask',
      questionKey: 'diagnosis.ask.network-kind',
      branchRuleIds: ['network-corporate', 'network-home'],
    },
    verifyStep: 'tools-install',
  },
  // R7-a · 회사/학교 네트워크 (분기 전용)
  {
    id: 'network-corporate',
    match: { signatures: ['proxy', 'forbidden by policy'] },
    confidence: 'medium',
    causeKey: 'diagnosis.cause.network-corporate',
    remedy: { kind: 'guide', guideKey: 'network-corporate' },
    verifyStep: 'tools-install',
  },
  // R7-b · 가정 네트워크 (분기 전용)
  {
    id: 'network-home',
    match: {},
    confidence: 'medium',
    causeKey: 'diagnosis.cause.network-home',
    remedy: { kind: 'guide', guideKey: 'network-retry' },
    verifyStep: 'tools-install',
  },
  // R8 · npm 권한 에러
  {
    id: 'permission-eacces',
    match: {
      signatures: ['eacces', 'permission denied'],
      steps: ['tools-install', 'claude-install'],
    },
    confidence: 'high',
    causeKey: 'diagnosis.cause.permission-eacces',
    remedy: { kind: 'script', remedyKey: 'npm-user-prefix' },
    verifyStep: 'claude-install',
  },
  // R8-b · 관리자 권한 필요 (PowerShell)
  {
    id: 'needs-admin',
    match: {
      signatures: [
        'requires administrator',
        'run this command as an administrator',
        'elevated permissions',
      ],
      steps: ['wsl-install'],
    },
    confidence: 'high',
    causeKey: 'diagnosis.cause.needs-admin',
    remedy: { kind: 'guide', guideKey: 'run-as-admin' },
    verifyStep: 'wsl-install',
  },
  // R9 · 디스크 부족
  {
    id: 'disk-space',
    match: { signatures: ['enospc', 'no space left on device'] },
    confidence: 'high',
    causeKey: 'diagnosis.cause.disk-space',
    remedy: { kind: 'guide', guideKey: 'free-disk-space' },
    verifyStep: 'tools-install',
  },
];
