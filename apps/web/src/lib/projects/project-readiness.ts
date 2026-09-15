export const PROJECT_READINESS_KEYS = [
  "git",
  "node",
  "npm",
  "project",
  "next",
] as const;

export type ProjectReadinessKey = (typeof PROJECT_READINESS_KEYS)[number];
export type ProjectReadinessCheck = "ok" | "missing" | "outdated";
export type ProjectReadinessState =
  | "ready"
  | "missing-tools"
  | "missing-project"
  | "invalid";

export interface ProjectReadinessResult {
  state: ProjectReadinessState;
  checks: Partial<Record<ProjectReadinessKey, ProjectReadinessCheck>>;
}

/**
 * macOS Terminal과 Windows WSL/Ubuntu에서 실행하는 읽기 전용 점검 명령.
 * 사용자가 연 현재 폴더를 검사하므로 프로젝트의 절대 경로를 수집할 필요가 없다.
 */
export function buildProjectReadinessScript(): string {
  return `p="$PWD"
git_status=missing
node_status=missing
npm_status=missing
project_status=missing
next_status=missing
command -v git >/dev/null 2>&1 && git_status=ok
if command -v node >/dev/null 2>&1; then
  node_status=outdated
  node -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit((a===22&&b>=12)||a>=24?0:1)' >/dev/null 2>&1 && node_status=ok
fi
command -v npm >/dev/null 2>&1 && npm_status=ok
[ -f "$p/package.json" ] && project_status=ok
[ -f "$p/package.json" ] && grep -Eq '"next"[[:space:]]*:' "$p/package.json" && next_status=ok
printf 'VIBESTART_READY::git=%s::node=%s::npm=%s::project=%s::next=%s\\n' "$git_status" "$node_status" "$npm_status" "$project_status" "$next_status"`;
}

/** 명령 자체를 붙여넣은 경우가 성공으로 오인되지 않도록 완전한 결과 줄만 허용한다. */
export function parseProjectReadiness(output: string): ProjectReadinessResult {
  const markerLines = output
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("VIBESTART_READY::"));

  for (const line of markerLines.reverse()) {
    const fields = line.slice("VIBESTART_READY::".length).split("::");
    const checks: Partial<Record<ProjectReadinessKey, ProjectReadinessCheck>> = {};

    for (const field of fields) {
      const [rawKey, rawValue, ...extra] = field.split("=");
      if (extra.length > 0) continue;
      if (
        PROJECT_READINESS_KEYS.includes(rawKey as ProjectReadinessKey) &&
        (rawValue === "ok" || rawValue === "missing" || rawValue === "outdated")
      ) {
        checks[rawKey as ProjectReadinessKey] = rawValue;
      }
    }

    if (!PROJECT_READINESS_KEYS.every((key) => checks[key])) continue;

    if (["git", "node", "npm"].some((key) => checks[key as ProjectReadinessKey] !== "ok")) {
      return { state: "missing-tools", checks };
    }
    if (checks.project !== "ok" || checks.next !== "ok") {
      return { state: "missing-project", checks };
    }
    return { state: "ready", checks };
  }

  return { state: "invalid", checks: {} };
}
