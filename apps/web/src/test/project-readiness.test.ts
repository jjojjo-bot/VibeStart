// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  buildProjectReadinessScript,
  parseProjectReadiness,
} from "@/lib/projects/project-readiness";

describe("project readiness", () => {
  it("builds a read-only check for the validated home-folder project", () => {
    const script = buildProjectReadinessScript("my-portfolio");

    expect(script).toContain('p="$HOME/my-portfolio"');
    expect(script).toContain("command -v git");
    expect(script).toContain('"$p/package.json"');
    expect(script).not.toMatch(/\b(?:rm|mv|mkdir|touch|install)\b/);
  });

  it("rejects a project name that could alter the shell command", () => {
    expect(() => buildProjectReadinessScript("site;echo-bad")).toThrow(
      "Invalid project name",
    );
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
