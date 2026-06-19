/**
 * 진단 에스컬레이션 리포트 저장 (Supabase, service-role).
 *
 * 진단이 '모름'일 때 사용자가 보낸 (마스킹된) 출력을 수집한다 — 미인식 실패의
 * 원본 재료. 개인정보는 maskSensitive로 한 번 더 가린 뒤 저장(클라이언트가 이미
 * 마스킹하지만 서버에서도 방어). service env 미설정이면 조용히 실패(우아한 degradation).
 */

import "server-only";

import { maskSensitive } from "@vibestart/diagnosis-catalog";

import { createServiceClient, hasServiceSupabaseEnv } from "@/lib/supabase/service";

const TABLE = "diagnosis_reports";
const MAX_OUTPUT_LEN = 20000;

export async function saveDiagnosisReport(input: {
  step?: string;
  output: string;
  locale?: string;
}): Promise<boolean> {
  if (!hasServiceSupabaseEnv()) return false;
  const masked = maskSensitive(input.output).slice(0, MAX_OUTPUT_LEN);
  if (masked.trim().length === 0) return false;

  const supabase = createServiceClient();
  const { error } = await supabase.from(TABLE).insert({
    step: input.step ?? null,
    masked_output: masked,
    locale: input.locale ?? null,
  });
  return !error;
}
