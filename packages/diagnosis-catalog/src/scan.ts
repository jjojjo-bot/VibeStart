import type { ScanResult, WslScanResult } from '@vibestart/shared-types';
import { parseMarkers } from './matcher';

/**
 * 1차(Windows측) 환경 스캔 출력 해석. 두 마커(scan-wsl/scan-vscode)가 모두 있어야 판정한다.
 * 하나라도 없거나 오염됐으면 null — 호출부는 풀 트랙으로 폴백한다.
 */
export function parseScanOutput(output: string): ScanResult | null {
  const markers = parseMarkers(output);
  const wsl = markers.find((m) => m.step === 'scan-wsl' && m.result !== undefined);
  const vscode = markers.find((m) => m.step === 'scan-vscode' && m.result !== undefined);
  if (!wsl || !vscode) return null;
  return { wsl: wsl.result === 'ok', vscode: vscode.result === 'ok' };
}

/**
 * 2차(WSL측) 스캔 출력 해석. scan-devtools/scan-claude는 모든 goal에서 방출되므로 필수,
 * scan-node는 node 필요 goal에서만 방출돼 선택적(없으면 false). 필수 마커가 없거나
 * 오염됐으면 null — 호출부는 풀 트랙으로 폴백한다.
 */
export function parseWslScanOutput(output: string): WslScanResult | null {
  const markers = parseMarkers(output);
  const dev = markers.find((m) => m.step === 'scan-devtools' && m.result !== undefined);
  const claude = markers.find((m) => m.step === 'scan-claude' && m.result !== undefined);
  if (!dev || !claude) return null;
  const node = markers.find((m) => m.step === 'scan-node' && m.result !== undefined);
  return {
    devTools: dev.result === 'ok',
    nodejs: node ? node.result === 'ok' : false,
    claude: claude.result === 'ok',
  };
}
