// @vitest-environment node
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import {
  buildProjectReadinessScript,
  parseProjectReadiness,
} from "@/lib/projects/project-readiness";

describe("project readiness", () => {
  it("builds a read-only check for the current project folder", () => {
    const script = buildProjectReadinessScript();

    expect(script).toContain('p="$PWD"');
    expect(script).toContain("command -v git");
    expect(script).toContain("a===22&&b>=12");
    expect(script).toContain('"$p/package.json"');
    expect(script).not.toMatch(/\b(?:rm|mv|mkdir|touch|install)\b/);
    expect(spawnSync("bash", ["-n", "-c", script]).status).toBe(0);
  });

  it("accepts only a complete ready marker", () => {
    expect(
      parseProjectReadiness(
        "VIBESTART_READY::git=ok::node=ok::npm=ok::project=ok::next=ok",
      ),
    ).toMatchObject({ state: "ready" });

    expect(
      parseProjectReadiness("VIBESTART_READY::git=ok::node=ok"),
    ).toEqual({ state: "invalid", checks: {} });
  });

  it("routes missing tools before checking the project", () => {
    expect(
      parseProjectReadiness(
        "VIBESTART_READY::git=missing::node=ok::npm=ok::project=missing::next=missing",
      ).state,
    ).toBe("missing-tools");
  });

  it("routes an unsupported Node.js version to full setup", () => {
    expect(
      parseProjectReadiness(
        "VIBESTART_READY::git=ok::node=outdated::npm=ok::project=ok::next=ok",
      ).state,
    ).toBe("missing-tools");
  });

  it("routes a missing or non-Next.js folder to project quick start", () => {
    expect(
      parseProjectReadiness(
        "VIBESTART_READY::git=ok::node=ok::npm=ok::project=ok::next=missing",
      ).state,
    ).toBe("missing-project");
  });

  it("uses the latest complete marker when terminal output contains retries", () => {
    expect(
      parseProjectReadiness(
        [
          "VIBESTART_READY::git=missing::node=ok::npm=ok::project=ok::next=ok",
          "some unrelated output",
          "VIBESTART_READY::git=ok::node=ok::npm=ok::project=ok::next=ok",
        ].join("\n"),
      ).state,
    ).toBe("ready");
  });
});
