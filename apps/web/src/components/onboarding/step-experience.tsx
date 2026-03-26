"use client";

import { Experience, EXPERIENCE_OPTIONS } from "@/lib/onboarding";

interface StepExperienceProps {
  value: Experience[];
  onChange: (experiences: Experience[]) => void;
}

export function StepExperience({ value, onChange }: StepExperienceProps) {
  function toggle(exp: Experience) {
    if (exp === "none") {
      onChange(["none"]);
      return;
    }

    const without = value.filter((v) => v !== "none");
    if (without.includes(exp)) {
      onChange(without.filter((v) => v !== exp));
    } else {
      onChange([...without, exp]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {EXPERIENCE_OPTIONS.map((option) => {
        const checked = value.includes(option.value);
        return (
          <button
            key={option.value}
            onClick={() => toggle(option.value)}
            className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
              checked
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-card hover:border-primary/50"
            }`}
          >
            <div
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all ${
                checked
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30"
              }`}
            >
              {checked && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6L5 9L10 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="text-sm">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
