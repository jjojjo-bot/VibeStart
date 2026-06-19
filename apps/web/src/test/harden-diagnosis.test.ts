// @vitest-environment node
/**
 * D′ 셋업 하드닝 ↔ 진단 루프 라운드트립.
 *
 * hardenScript(@vibestart/script-generator)가 심는 마커가, 진단
 * 매처(@vibestart/diagnosis-catalog)가 소비하는 형식과 정확히 일치하는지
 * 기계적으로 보장한다. 이게 통과해야 "셋업 실패 → 마커 → 자동 진단"이
 * 실제로 연결된다.
 *
 * 균형 모드: bash는 종료코드 캡처 래퍼, PowerShell은 한 줄 result 마커.
 * HRESULT(0x…) 같은 구체 코드는 도구 출력 텍스트에 남아 signature가 잡고,
 * 마커는 step-scoped 실패 신호(result=fail)를 제공한다.
 */
import { describe, expect, it } from 'vitest';
import { hardenScript, MARKER_PREFIX } from '@vibestart/script-generator';
import { defaultDiagnosisMatcher, parseMarkers } from '@vibestart/diagnosis-catalog';
import { getSetupSteps, diagnosisStepFor } from '../lib/setup-steps';

// i18n t 스텁 — 키를 그대로 돌려준다(스크립트 리터럴은 t에 의존하지 않음).
const tStub = (key: string): string => key;

// 래퍼가 추가하는 부분이 셸 인젝션 위험을 새로 들이지 않는지 검사(대표 패턴).
const DANGEROUS = [
  /;\s*rm\s/,
  /&&\s*rm\s/,
  /\$\([^)]*\)/, // bash 명령 치환
  /`[^`]*`/, // 백틱
  /\bsudo\s/,
  /\|\s*bash\b/,
  /\bexit\s+\$?\d/, // 대화형 셸 강제 종료
];

describe('hardenScript — 마커 래핑', () => {
  it('bash: 원본 보존 + 종료코드 캡처 + ok/fail 마커, 비파괴적', () => {
    const raw = 'npm install -g @anthropic-ai/claude-code';
    const out = hardenScript(raw, { step: 'claude-install', shell: 'bash' });
    expect(out).toContain(raw);
    expect(out).toContain('__vs_code=$?');
    expect(out).toContain(`${MARKER_PREFIX}::step=claude-install::result=ok`);
    expect(out).toContain(`${MARKER_PREFIX}::step=claude-install::result=fail::code=$__vs_code`);
  });

  it('powershell: 원본을 그대로 두고 $LASTEXITCODE 한 줄 result 마커(가벼움)', () => {
    const out = hardenScript('wsl --install', { step: 'wsl-install', shell: 'powershell' });
    expect(out).toContain('wsl --install');
    expect(out).toContain('$LASTEXITCODE');
    expect(out).toContain(`${MARKER_PREFIX}::step=wsl-install::result=ok`);
    expect(out).toContain(`${MARKER_PREFIX}::step=wsl-install::result=fail::code=$LASTEXITCODE`);
    // 균형 모드: 무거운 캡처/추출은 쓰지 않는다.
    expect(out).not.toContain('Tee-Object');
    expect(out).not.toContain('regex');
  });

  it('빈 스크립트(안내 전용 단계)는 그대로 둔다', () => {
    expect(hardenScript('', { step: 'preflight', shell: 'bash' })).toBe('');
    expect(hardenScript('   ', { step: 'preflight', shell: 'powershell' })).toBe('   ');
  });

  it('래퍼가 추가하는 부분은 위험 패턴을 새로 들이지 않는다', () => {
    for (const shell of ['bash', 'powershell'] as const) {
      const raw = 'node -v';
      const added = hardenScript(raw, { step: 'tools-install', shell }).split(raw).join('');
      for (const re of DANGEROUS) {
        expect(re.test(added), `${shell} 래퍼가 ${re}에 걸리면 안 됨`).toBe(false);
      }
    }
  });
});

describe('라운드트립: 하드닝 마커 → DiagnosisMatcher', () => {
  it('parseMarkers가 래퍼 형식을 그대로 파싱한다', () => {
    expect(parseMarkers(`${MARKER_PREFIX}::step=wsl-install::result=fail::code=1`)[0]).toEqual({
      step: 'wsl-install',
      result: 'fail',
      code: '1',
    });
  });

  // 실제 WSL 0x80370102 에러("WslRegisterDistribution failed ... 0x80370102").
  // #10에서 wsl-features-missing의 과넓은 'wslregisterdistribution' 시그니처를 제거해
  // 이제 signature만으로도 virtualization-off로 확정된다(겹침 해소).
  const REAL_WSL_VIRT_ERROR =
    'WslRegisterDistribution failed with error: 0x80370102\n' +
    'Please enable the Virtual Machine Platform and BIOS virtualization.';

  it('시그니처 정교화로 실제 가상화 에러가 virtualization-off로 확정된다(겹침 해소)', () => {
    const outcome = defaultDiagnosisMatcher.diagnose({
      output: `${REAL_WSL_VIRT_ERROR}\n${MARKER_PREFIX}::step=wsl-install::result=fail::code=1`,
      step: 'wsl-install',
    });
    expect(outcome.kind).toBe('recognized');
    if (outcome.kind === 'recognized') {
      expect(outcome.hit.rule.id).toBe('virtualization-off');
    }
  });

  it('hex 코드 마커도 같은 결론으로 인식한다(marker 경로)', () => {
    const outcome = defaultDiagnosisMatcher.diagnose({
      output: `${REAL_WSL_VIRT_ERROR}\n${MARKER_PREFIX}::step=wsl-install::result=fail::code=0x80370102`,
      step: 'wsl-install',
    });
    expect(outcome.kind).toBe('recognized');
    if (outcome.kind === 'recognized') {
      expect(outcome.hit.rule.id).toBe('virtualization-off');
      expect(outcome.hit.matchedOn).toBe('marker');
    }
  });

  it('ok 마커는 실패 코드가 없어 어떤 실패 규칙에도 걸리지 않는다', () => {
    const outcome = defaultDiagnosisMatcher.diagnose({
      output: `${MARKER_PREFIX}::step=wsl-install::result=ok`,
      step: 'wsl-install',
    });
    expect(outcome.kind).toBe('unknown');
  });
});

describe('getSetupSteps — 하드닝 배선', () => {
  it('windows: wsl 단계에 powershell 마커(한 줄)가 박힌다', () => {
    const wsl = getSetupSteps('windows', 'web-nextjs', 'myapp', tStub).find((s) => s.id === 'wsl');
    expect(wsl?.script).toContain('wsl --install');
    expect(wsl?.script).toContain('$LASTEXITCODE');
    expect(wsl?.script).toContain(`${MARKER_PREFIX}::step=wsl-install::result=fail::code=$LASTEXITCODE`);
  });

  it('mac: ai-setup 단계에 bash claude-install 마커가 박힌다', () => {
    const ai = getSetupSteps('macos', 'web-nextjs', 'myapp', tStub).find((s) => s.id === 'ai-setup');
    expect(ai?.script).toContain('__vs_code=$?');
    expect(ai?.script).toContain(`${MARKER_PREFIX}::step=claude-install::result=ok`);
  });

  it('terminal 안내(스크립트 없음)는 하드닝하지 않는다', () => {
    const terminal = getSetupSteps('macos', 'web-nextjs', 'myapp', tStub).find(
      (s) => s.id === 'terminal',
    );
    expect(terminal?.script).toBe('');
  });

  it('Windows editor(내부 exit 분기)는 하드닝하지 않는다 — 마커 미부착', () => {
    const editor = getSetupSteps('windows', 'web-nextjs', 'myapp', tStub).find(
      (s) => s.id === 'editor',
    );
    expect(editor?.script).not.toContain(MARKER_PREFIX);
    // 본래 자체 idempotency 가드는 유지
    expect(editor?.script).toContain('Get-Command code');
  });

  it('mac editor(깔끔한 체인)는 bash 마커가 박힌다', () => {
    const editor = getSetupSteps('macos', 'web-nextjs', 'myapp', tStub).find(
      (s) => s.id === 'editor',
    );
    expect(editor?.script).toContain(`${MARKER_PREFIX}::step=tools-install::result=ok`);
  });

  it('brew(envPrep)는 per-step 오버라이드로 tools-install 진단·마커를 쓴다', () => {
    const brew = getSetupSteps('macos', 'web-nextjs', 'myapp', tStub).find((s) => s.id === 'brew');
    expect(brew && diagnosisStepFor(brew)).toBe('tools-install');
    expect(brew?.script).toContain(`${MARKER_PREFIX}::step=tools-install::result=ok`);
    expect(brew?.script).not.toContain('step=wsl-install');
  });
});
