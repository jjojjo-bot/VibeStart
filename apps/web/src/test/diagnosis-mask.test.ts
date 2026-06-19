// @vitest-environment node
/**
 * 에스컬레이션 마스킹 — 도움 요청 번들에서 개인정보를 가리는지 검증.
 * 전역 데이터 보호 원칙: 외부 전송 가능한 텍스트엔 사용자명/경로/이메일/IP 금지.
 */
import { describe, expect, it } from 'vitest';
import { maskSensitive } from '@vibestart/diagnosis-catalog';

describe('maskSensitive', () => {
  it('Windows 사용자 경로의 이름을 가린다', () => {
    const out = maskSensitive('C:\\Users\\brandon\\project> wsl --install');
    expect(out).toContain('C:\\Users\\<user>');
    expect(out).not.toContain('brandon');
  });

  it('WSL/Unix 홈 경로의 이름을 가린다', () => {
    expect(maskSensitive('cd /home/brandon/myapp')).toBe('cd /home/<user>/myapp');
  });

  it('macOS 홈과 /mnt/c/Users 경로의 이름을 가린다', () => {
    expect(maskSensitive('/Users/brandon/Desktop')).toBe('/Users/<user>/Desktop');
    expect(maskSensitive('/mnt/c/Users/brandon/dev')).toBe('/mnt/c/Users/<user>/dev');
  });

  it('이메일과 IPv4를 가린다', () => {
    const out = maskSensitive('login as jiyeong@example.com from 192.168.0.42');
    expect(out).toBe('login as <email> from <ip>');
  });

  it('버전 표기(x.y.z)는 IP로 오인해 가리지 않는다', () => {
    expect(maskSensitive('node v20.11.0 installed')).toBe('node v20.11.0 installed');
  });

  it('진단에 필요한 에러 코드/시그니처는 보존한다', () => {
    const err = 'WslRegisterDistribution failed with error: 0x80370102';
    expect(maskSensitive(err)).toBe(err);
  });

  it('결정론적 — 같은 입력이면 같은 출력', () => {
    const input = '/home/brandon ip 10.0.0.1 mail a@b.co';
    expect(maskSensitive(input)).toBe(maskSensitive(input));
  });
});
