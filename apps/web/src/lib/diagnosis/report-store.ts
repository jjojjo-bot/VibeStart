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

export interface DiagnosisReportRow {
  id: string;
  step: string | null;
  maskedOutput: string;
  locale: string | null;
  createdAt: string;
}

/** 관리자 검토용 — 최신순 리포트 목록. service env 없으면 빈 배열. */
export async function listDiagnosisReports(limit = 100): Promise<DiagnosisReportRow[]> {
  if (!hasServiceSupabaseEnv()) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id,step,masked_output,locale,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((r: Record<string, unknown>) => ({
    id: r.id as string,
    step: (r.step as string | null) ?? null,
    maskedOutput: (r.masked_output as string) ?? "",
    locale: (r.locale as string | null) ?? null,
    createdAt: r.created_at as string,
  }));
}

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
