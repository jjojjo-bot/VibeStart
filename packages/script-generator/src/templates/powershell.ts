import { TaskDefinition } from '@vibestart/shared-types';
import { VariableResolver } from '../services/variable-resolver';

/**
 * 단일 TaskDefinition을 PowerShell 스크립트 문자열로 변환한다.
 * 사용자가 복사 → PowerShell에 붙여넣기 → 실행하는 용도.
 */
export function toPowerShell(task: TaskDefinition, resolver: VariableResolver): string {
  const lines: string[] = [];

  lines.push(`# ${task.displayName}`);
  lines.push(`# ${task.description}`);
  lines.push(`Write-Host "⏳ ${task.displayName} 시작..." -ForegroundColor Cyan`);
  lines.push('');

  for (const action of task.actions) {
    const command = resolver.resolve(action.command);
    lines.push(command);
  }

  lines.push('');
  lines.push(`Write-Host "✅ ${task.displayName} 완료!" -ForegroundColor Green`);

  return lines.join('\n');
}
