import type { MilestoneId, MilestoneState } from "@vibestart/shared-types";

export interface ProgressMilestone {
  id: MilestoneId;
  substepIds: ReadonlyArray<string>;
}

export interface CompletedSubstepRow {
  milestone_id: string;
  substep_id: string;
}

/**
 * 저장된 current_milestone 숫자 대신 실제 서브스텝 완료 기록으로 진행 상태를
 * 계산한다. 카탈로그에서 단계를 제거하거나 재배치해도 기존 사용자의 기록이
 * 새 순서에 맞게 안전하게 이어진다.
 */
export function deriveProjectProgress(
  milestones: ReadonlyArray<ProgressMilestone>,
  completedRows: ReadonlyArray<CompletedSubstepRow>,
): Record<MilestoneId, MilestoneState> {
  const completedByMilestone = new Map<string, Set<string>>();
  for (const row of completedRows) {
    const ids = completedByMilestone.get(row.milestone_id) ?? new Set<string>();
    ids.add(row.substep_id);
    completedByMilestone.set(row.milestone_id, ids);
  }

  const result: Record<MilestoneId, MilestoneState> = {};
  let previousIncomplete = false;

  for (const milestone of milestones) {
    const completedIds = completedByMilestone.get(milestone.id) ?? new Set<string>();
    const isCompleted =
      milestone.substepIds.length > 0 &&
      milestone.substepIds.every((id) => completedIds.has(id));

    if (previousIncomplete) {
      result[milestone.id] = "locked";
    } else if (isCompleted) {
      result[milestone.id] = "completed";
    } else {
      result[milestone.id] = "in_progress";
      previousIncomplete = true;
    }
  }

  return result;
}
