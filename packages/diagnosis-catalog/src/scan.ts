import type { ScanResult } from '@vibestart/shared-types';
import { parseMarkers } from './matcher';

/**
 * 환경 스캔 출력 해석. 두 마커(scan-wsl/scan-vscode)가 모두 있어야 판정한다.
 * 하나라도 없거나 오염됐으면 null — 호출부는 풀 트랙으로 폴백한다.
 */
export function parseScanOutput(output: string): ScanResult | null {
  const markers = parseMarkers(output);
  const wsl = markers.find((m) => m.step === 'scan-wsl' && m.result !== undefined);
  const vscode = markers.find((m) => m.step === 'scan-vscode' && m.result !== undefined);
  if (!wsl || !vscode) return null;
  return { wsl: wsl.result === 'ok', vscode: vscode.result === 'ok' };
}
