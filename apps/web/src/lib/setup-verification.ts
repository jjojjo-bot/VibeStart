import type { OS, Goal } from './onboarding';

// A Python executable alone is insufficient: venv needs ensurepip to bootstrap pip.
export const PYTHON_READY_CHECK = `python3 -c 'import venv, ensurepip; print("Python venv ready")' && python3 -m pip --version`;
// The generated Spring project targets Java 21; a JRE or another active JDK is insufficient.
export const JAVA_READY_CHECK = `java -version 2>&1 | grep -E '^(openjdk|java) version "21([.]|")' && javac -version 2>&1 | grep -E '^javac 21([.]|$)' && unzip -v`;

export interface Verification {
  command: string;
  expected: string;
  canReuse: boolean;
}

export type VerificationState = 'ok' | 'error' | 'unknown' | 'editor-path';

const MAC_EDITOR_CHECK = `if command -v code >/dev/null 2>&1 && code --version; then printf '%s\\n' 'VIBESTART_CHECK::editor::ok'; elif [ -d '/Applications/Visual Studio Code.app' ] || [ -d "$HOME/Applications/Visual Studio Code.app" ]; then printf '%s\\n' 'VIBESTART_CHECK::editor::path-missing'; else printf '%s\\n' 'VIBESTART_CHECK::editor::fail'; fi`;

/** A successful command is evidence supplied by the user, never a browser scan. */
export function verificationFor(id: string, os: OS, goal: Goal): Verification | null {
  const basic = ['git --version', 'curl --version'];
  if (goal === 'data-ai' || goal === 'web-python') basic.push(PYTHON_READY_CHECK);
  if (goal === 'web-java') basic.push(JAVA_READY_CHECK);
  const node = `node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit((a===22&&b>=12)||a>=24?0:1)' && node --version && npm --version`;
  const commands: Record<string, string> = {
    brew: 'brew --version',
    'dev-tools-basic': basic.join(' && '),
    'dev-tools-nodejs': node,
    'dev-tools': [...basic.filter(c => !c.startsWith('curl')), ...(goal === 'data-ai' ? [] : [node])].join(' && '),
    'ai-setup': 'claude --version',
    'ai-auth': 'claude auth status --text',
    'editor-extensions': 'code --list-extensions | grep -Fx anthropic.claude-code' +
      (os === 'windows' ? ' && code --list-extensions | grep -Fx ms-vscode-remote.remote-wsl' : ''),
    editor: os === 'macos' ? MAC_EDITOR_CHECK :
      `$c = Get-Command code -ErrorAction SilentlyContinue; if ($c) { & $c --version; if ($LASTEXITCODE -eq 0) { Write-Output 'VIBESTART_CHECK::editor::ok' } else { Write-Output 'VIBESTART_CHECK::editor::fail' } } else { Write-Output 'VIBESTART_CHECK::editor::fail' }`,
  };
  const command = commands[id];
  if (!command) return null;
  const expected = `VIBESTART_CHECK::${id}::ok`;
  return {
    command: id === 'editor' ? command :
      `if ${command}; then printf '%s\\n' '${expected}'; else printf '%s\\n' 'VIBESTART_CHECK::${id}::fail'; fi`,
    expected,
    canReuse: ['brew', 'dev-tools', 'dev-tools-basic', 'dev-tools-nodejs', 'editor', 'ai-setup'].includes(id),
  };
}

export function parseVerification(output: string, id: string): VerificationState {
  const lines = output.replace(/\r/g, '').split('\n').map(l => l.trim());
  // A pasted command or another step's result must never count as success.
  const matches = lines.filter(l => l === `VIBESTART_CHECK::${id}::ok` ||
    l === `VIBESTART_CHECK::${id}::fail` ||
    (id === 'editor' && l === 'VIBESTART_CHECK::editor::path-missing'));
  if (!matches.length) return 'unknown';
  const latest = matches.at(-1)!;
  if (latest.endsWith('::ok')) return 'ok';
  return latest.endsWith('::path-missing') ? 'editor-path' : 'error';
}

export function restoreCompleted(raw: string | null, validIds: readonly string[]): Set<string> {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string' && validIds.includes(id)) : []);
  } catch { return new Set(); }
}

export function canActivate(index: number, ids: readonly string[], completed: Set<string>): boolean {
  return ids.slice(0, index).every(id => completed.has(id));
}
