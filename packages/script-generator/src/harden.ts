import type { DiagnosisStep } from '@vibestart/shared-types';

/**
 * D′ 셋업 스크립트 하드닝 — 진단 루프가 매칭할 구조화 마커를 심는다.
 *
 * 사용자가 복붙해 실행하는 스크립트 끝에, 성공/실패와 (가능하면) 에러 코드를
 * 담은 한 줄 마커를 출력하도록 감싼다. 진단 매처(@vibestart/diagnosis-catalog)는
 * 이 마커를 고신뢰 신호로 사용한다.
 *
 *   VIBESTART::step=<DiagnosisStep>::result=ok
 *   VIBESTART::step=<DiagnosisStep>::result=fail::code=<코드>
 *
 * 원칙:
 * - 원본 스크립트의 동작/디렉터리 이동을 바꾸지 않는다(현재 셸에서 그대로 실행).
 * - 대화형 셸을 종료시키지 않는다(파괴적 exit 금지).
 * - 마커 외에 다른 출력을 추가하지 않는다(사용자가 보는 결과를 어지럽히지 않음).
 */

export type HardenShell = 'bash' | 'powershell';

export interface HardenOptions {
  /** 마커에 심을 진단 단계(매처의 step-scoping 키). */
  step: DiagnosisStep;
  /** 실행 셸 — Windows의 wsl/editor 단계는 powershell, 그 외 대부분 bash. */
  shell: HardenShell;
}

/** 마커 prefix. 매처의 정규식(VIBESTART::...)과 단일 출처로 맞춘다. */
export const MARKER_PREFIX = 'VIBESTART';

function hardenBash(raw: string, step: DiagnosisStep): string {
  // 원본을 현재 셸에서 실행 → 직후 $? 캡처 → 마커. (exit 없음: 대화형 셸 보존)
  return [
    raw,
    `__vs_code=$?`,
    `if [ "$__vs_code" -eq 0 ]; then`,
    `  echo "${MARKER_PREFIX}::step=${step}::result=ok"`,
    `else`,
    `  echo "${MARKER_PREFIX}::step=${step}::result=fail::code=$__vs_code"`,
    `fi`,
  ].join('\n');
}

function hardenPowerShell(raw: string, step: DiagnosisStep): string {
  // 균형 모드: 원본을 그대로 보이게 두고($LASTEXITCODE만 확인) 한 줄 result 마커.
  // HRESULT(예: 0x80370102)는 도구가 출력 텍스트로 뱉으므로 진단은 signature가
  // 잡는다 — 비전공자의 첫 명령 복붙을 무겁게 만들지 않기 위해 캡처/추출은 생략.
  return [
    raw,
    `if ($LASTEXITCODE -eq 0) { Write-Output "${MARKER_PREFIX}::step=${step}::result=ok" } else { Write-Output "${MARKER_PREFIX}::step=${step}::result=fail::code=$LASTEXITCODE" }`,
  ].join('\n');
}

/**
 * 원본 스크립트를 마커-방출 래퍼로 감싼다. 빈 스크립트는 그대로 둔다
 * (안내 전용 단계 — 실행할 게 없으면 마커도 의미 없음).
 */
export function hardenScript(raw: string, options: HardenOptions): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return raw;
  return options.shell === 'powershell'
    ? hardenPowerShell(trimmed, options.step)
    : hardenBash(trimmed, options.step);
}
