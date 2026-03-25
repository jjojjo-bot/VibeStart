import { TaskDefinition } from '@vibestart/shared-types';
import { VariableResolver } from '../services/variable-resolver';

/** macOS용 winget 명령을 brew 명령으로 매핑 */
const BREW_MAP: Record<string, string> = {
  'Git.Git': 'git',
  'OpenJS.NodeJS.LTS': 'node',
  'Microsoft.VisualStudioCode': '--cask visual-studio-code',
};

/**
 * 단일 TaskDefinition을 Bash 스크립트 문자열로 변환한다.
 * macOS에서 사용자가 복사 → 터미널에 붙여넣기 → 실행하는 용도.
 */
export function toBash(task: TaskDefinition, resolver: VariableResolver): string {
  const lines: string[] = [];

  lines.push(`# ${task.displayName}`);
  lines.push(`# ${task.description}`);
  lines.push(`echo "⏳ ${task.displayName} 시작..."`);
  lines.push('');

  for (const action of task.actions) {
    let command = resolver.resolve(action.command);
    command = convertToBash(command);
    lines.push(command);
  }

  lines.push('');
  lines.push(`echo "✅ ${task.displayName} 완료!"`);

  return lines.join('\n');
}

function convertToBash(command: string): string {
  // winget install → brew install 변환
  const wingetMatch = command.match(/winget install --id (\S+)/);
  if (wingetMatch && wingetMatch[1]) {
    const brewPkg = BREW_MAP[wingetMatch[1]];
    if (brewPkg) {
      return `brew install ${brewPkg}`;
    }
  }

  // Windows 경로 구분자 → Unix
  let result = command.replace(/\\\\/g, '/').replace(/\\/g, '/');

  // PowerShell 전용 명령 변환
  result = result.replace(/Write-Host\s+"([^"]+)".*/, 'echo "$1"');
  result = result.replace(/Test-Path\s+"([^"]+)"/, 'test -e "$1"');
  result = result.replace(/\s*\|\s*Out-Null/g, ' > /dev/null 2>&1');

  // --use-npm 유지 (create-next-app은 크로스 플랫폼)
  return result;
}
