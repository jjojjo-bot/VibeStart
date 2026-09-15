// @vitest-environment node

import { describe, expect, it } from "vitest";

import { deriveProjectProgress } from "@/lib/projects/project-progress";

const milestones = [
  { id: "m1-deploy", substepIds: ["m1-a", "m1-b"] },
  { id: "m3-vibe-coding", substepIds: ["m3-a", "m3-b"] },
];

describe("deriveProjectProgress", () => {
  it("starts the first milestone and locks the next", () => {
    expect(deriveProjectProgress(milestones, [])).toEqual({
      "m1-deploy": "in_progress",
      "m3-vibe-coding": "locked",
    });
  });

  it("unlocks the AI edit milestone from actual M1 completion records", () => {
    expect(
      deriveProjectProgress(milestones, [
        { milestone_id: "m1-deploy", substep_id: "m1-a" },
        { milestone_id: "m1-deploy", substep_id: "m1-b" },
      ]),
    ).toEqual({
      "m1-deploy": "completed",
      "m3-vibe-coding": "in_progress",
    });
  });

  it("ignores removed milestones and unknown substeps", () => {
    expect(
      deriveProjectProgress(milestones, [
        { milestone_id: "m1-deploy", substep_id: "m1-a" },
        { milestone_id: "m1-deploy", substep_id: "unknown" },
        { milestone_id: "m2-google-auth", substep_id: "m2-a" },
        { milestone_id: "m2-google-auth", substep_id: "m2-b" },
      ]),
    ).toEqual({
      "m1-deploy": "in_progress",
      "m3-vibe-coding": "locked",
    });
  });

  it("does not let a later completion bypass an incomplete prerequisite", () => {
    expect(
      deriveProjectProgress(milestones, [
        { milestone_id: "m3-vibe-coding", substep_id: "m3-a" },
        { milestone_id: "m3-vibe-coding", substep_id: "m3-b" },
      ]),
    ).toEqual({
      "m1-deploy": "in_progress",
      "m3-vibe-coding": "locked",
    });
  });
});
