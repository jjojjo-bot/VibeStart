// @vitest-environment node
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

import { buildGitPushScript } from "@/lib/projects/git-push";

describe("git push script", () => {
  it("uses the current project folder instead of assuming a home-folder path", () => {
    const script = buildGitPushScript("launch-site", "octocat");

    expect(script).not.toContain("cd ~/");
    expect(script).toContain("[ -f package.json ]");
    expect(script).toContain("[ -f frontend/package.json ]");
    expect(script).toContain("https://github.com/octocat/launch-site.git");
    expect(spawnSync("bash", ["-n", "-c", script]).status).toBe(0);
  });

  it("guards every mutating command behind the Next.js project check", () => {
    const script = buildGitPushScript("launch-site", "octocat");

    expect(script.indexOf("if {")).toBeLessThan(script.indexOf("rm -rf frontend/.git"));
    expect(script.indexOf("rm -rf frontend/.git")).toBeLessThan(script.lastIndexOf("else"));
    expect(script).toContain("VibeStart: open a terminal in your Next.js project folder");
  });

  it("rejects values that could alter the shell command", () => {
    expect(() => buildGitPushScript("site;echo-bad", "octocat")).toThrow(
      "Invalid project name",
    );
    expect(() => buildGitPushScript("launch-site", "octo;cat")).toThrow(
      "Invalid GitHub username",
    );
  });
});
