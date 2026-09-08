// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { getSetupSteps, wslScanScript } from '@/lib/setup-steps';
import { parseSetupParams, detectOS } from '@/lib/onboarding';
import { verificationFor, parseVerification, canActivate, restoreCompleted } from '@/lib/setup-verification';
const t = (key: string) => key;
describe('Setup boundaries', () => {
  it.each(['../../home','foo;touch bad','$(whoami)','foo\nbar','-app','a'.repeat(64),''])('rejects unsafe project %s', project => {
    expect(parseSetupParams(new URLSearchParams({os:'macos',goal:'web-nextjs',project}))).toBeNull();
    expect(() => getSetupSteps('macos','web-nextjs',project,t)).toThrow();
  });
  it('rejects unknown OS or goal', () => {
    expect(parseSetupParams(new URLSearchParams('os=linux&goal=web-nextjs&project=app'))).toBeNull();
    expect(parseSetupParams(new URLSearchParams('os=windows&goal=nope&project=app'))).toBeNull();
  });
  it('defaults legacy links to Claude and accepts an explicit Codex choice', () => {
    expect(parseSetupParams(new URLSearchParams('os=macos&goal=web-nextjs&project=app'))?.aiTool).toBe('claude');
    expect(parseSetupParams(new URLSearchParams('os=macos&goal=web-nextjs&project=app&ai=codex'))?.aiTool).toBe('codex');
    expect(parseSetupParams(new URLSearchParams('os=macos&goal=web-nextjs&project=app&ai=unknown'))).toBeNull();
  });
  it('restores known IDs from arrays only', () => {
    expect([...restoreCompleted('["one","ghost",123,"one"]',['one','two'])]).toEqual(['one']);
    for(const raw of ['null','{}','false','oops']) expect(restoreCompleted(raw,['one']).size).toBe(0);
  });
  it('requires every predecessor', () => {
    expect(canActivate(2,['one','two','three'],new Set(['two']))).toBe(false);
    expect(canActivate(2,['one','two','three'],new Set(['one','two']))).toBe(true);
  });
  it.each([['Windows NT','windows'],['Macintosh','macos'],['Linux x86_64','linux'],['iPad like Mac OS X','mobile'],['Android Linux','mobile']])('detects %s', (ua,os) => expect(detectOS(ua)).toBe(os));
});
describe('Shell contracts', () => {
  it('accepts only exact lines for this step and the latest result', () => {
    expect(parseVerification('VIBESTART_CHECK::editor::ok','ai-setup')).toBe('unknown');
    expect(parseVerification("echo 'VIBESTART_CHECK::ai-setup::ok'",'ai-setup')).toBe('unknown');
    expect(parseVerification('VIBESTART_CHECK::ai-setup::ok\nVIBESTART_CHECK::ai-setup::fail','ai-setup')).toBe('error');
    expect(parseVerification(verificationFor('dev-tools-nodejs','windows','web-nextjs')!.command,'dev-tools-nodejs')).toBe('unknown');
  });
  it('distinguishes a missing macOS code command from a missing VS Code app', () => {
    const verification = verificationFor('editor','macos','web-nextjs')!;
    expect(verification.command).toContain('command -v code');
    expect(verification.command).toContain('Visual Studio Code.app');
    expect(parseVerification('VIBESTART_CHECK::editor::path-missing','editor')).toBe('editor-path');
    expect(parseVerification('VIBESTART_CHECK::editor::fail','editor')).toBe('error');
    expect(parseVerification('VIBESTART_CHECK::editor::path-missing\nVIBESTART_CHECK::editor::ok','editor')).toBe('ok');
  });
  it('checks running Node and npm', () => {
    const v=verificationFor('dev-tools-nodejs','windows','web-nextjs')!;
    const nodeOk = `node() { return 0; }; npm() { return 0; };`;
    expect(parseVerification(execFileSync('bash',['-c',`${nodeOk} ${v.command}`],{encoding:'utf8'}),'dev-tools-nodejs')).toBe('ok');
    expect(parseVerification(execFileSync('bash',['-c',`${nodeOk} npm() { return 1; }; ${v.command}`],{encoding:'utf8'}),'dev-tools-nodejs')).toBe('error');
  });
  it('native Claude installation has no npm dependency and has separate login', () => {
    for(const os of ['windows','macos'] as const) {
      const steps=getSetupSteps(os,'data-ai','demo',t);
      const installScript = steps.find(s=>s.id==='ai-setup')!.script;
      expect(installScript).not.toContain('npm');
      expect(installScript).toContain('https://claude.ai/install.sh | bash');
      expect(steps.map(s=>s.id)).toEqual(expect.arrayContaining(['ai-auth','editor-extensions','run-check']));
    }
  });
  it('branches Codex install, login, verification, extension, and instruction file', () => {
    for (const os of ['windows', 'macos'] as const) {
      const steps = getSetupSteps(os, 'web-nextjs', 'demo', t, 'codex');
      expect(steps.find(s => s.id === 'ai-setup')!.script).toContain('https://chatgpt.com/codex/install.sh | sh');
      expect(steps.find(s => s.id === 'ai-setup')!.script).toContain('codex --version');
      expect(steps.find(s => s.id === 'ai-auth')!.script).toBe('codex login');
      expect(steps.find(s => s.id === 'editor-extensions')!.script).toContain('openai.chatgpt');
      const architecture = steps.find(s => s.id === 'architecture')!;
      expect(architecture.script).toContain('AGENTS.md');
      expect(architecture.script).not.toContain('cat > CLAUDE.md');
      expect(verificationFor('ai-auth', os, 'web-nextjs', 'codex')!.command).toContain('codex login status');
    }
  });
  it('curl failure cannot report install success', () => {
    const s=getSetupSteps('macos','data-ai','demo',t).find(s=>s.id==='ai-setup')!;
    const output=execFileSync('bash',['-c',`command() { return 1; }; curl() { return 22; }; ${s.script}`],{encoding:'utf8'});
    expect(output).toContain('result=fail'); expect(output).not.toContain('result=ok');
  });
  it('Bash commands parse across all 24 OS, goal, and AI tool routes', () => {
    const scripts: string[] = [];
    for(const os of ['windows','macos'] as const) for(const goal of ['web-nextjs','web-python','web-java','mobile','data-ai','not-sure'] as const) for (const aiTool of ['claude', 'codex'] as const) {
      for(const step of getSetupSteps(os,goal,'demo-app',t,aiTool)) {
        if(!(os==='windows' && ['preflight','editor','wsl','wsl-open'].includes(step.id))) scripts.push(step.script);
        const v=verificationFor(step.id,os,goal,aiTool);
        if(v && !(os==='windows' && step.id==='editor')) scripts.push(v.command);
      }
      scripts.push(wslScanScript(goal,aiTool));
    }
    execFileSync('bash',['-n'],{input:scripts.join('\n\n')});
  });
  it('Java starter does not require an unconfigured database', () => {
    const s=getSetupSteps('macos','web-java','demo',t).find(s=>s.id==='project-backend')!.script;
    expect(s).not.toContain('data-jpa'); expect(s).not.toContain('sqlserver'); expect(s).not.toContain('application.yml');
  });
});


describe('Existing runtimes must support the generated project', () => {
  const cases = [
    ['web-python', 'python3() { return 0; };', 'ok'],
    ['web-python', 'python3() { case "$*" in *ensurepip*) return 1;; *) return 0;; esac; };', 'error'],
    ['web-python', 'python3() { case "$*" in *"-m pip"*) return 1;; *) return 0;; esac; };', 'error'],
    ['web-java', `java() { echo 'openjdk version "21.0.6"'; }; javac() { echo 'javac 21.0.6'; };`, 'ok'],
    ['web-java', `java() { echo 'openjdk version "17.0.9"'; }; javac() { echo 'javac 17.0.9'; };`, 'error'],
    ['web-java', `java() { echo 'openjdk version "21.0.6"'; }; javac() { return 127; };`, 'error'],
  ] as const;
  it.each(cases)('%s with %s yields %s', (goal, runtime, expected) => {
    const mocks = `git() { return 0; }; curl() { return 0; }; unzip() { return 0; }; node() { return 0; }; npm() { return 0; }; ${runtime}`;
    for (const [os, id] of [['windows', 'dev-tools-basic'], ['macos', 'dev-tools']] as const) {
      const check = verificationFor(id, os, goal)!;
      const output = execFileSync('bash', ['-c', `${mocks} ${check.command}`], {encoding:'utf8'});
      expect(parseVerification(output, id)).toBe(expected);
    }
    const scan = execFileSync('bash', ['-c', `${mocks} ${wslScanScript(goal)}`], {encoding:'utf8'});
    expect(scan).toContain(`VIBESTART::step=scan-devtools::result=${expected === 'ok' ? 'ok' : 'fail'}`);
  });
});
