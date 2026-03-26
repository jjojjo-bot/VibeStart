"use client";

import { Goal, GOAL_OPTIONS } from "@/lib/onboarding";
import { Badge } from "@/components/ui/badge";

interface StepGoalProps {
  value: Goal | null;
  onChange: (goal: Goal) => void;
}

export function StepGoal({ value, onChange }: StepGoalProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {GOAL_OPTIONS.map((option) => {
        const comingSoon = "comingSoon" in option && option.comingSoon;
        return (
          <button
            key={option.value}
            onClick={() => !comingSoon && onChange(option.value)}
            disabled={comingSoon}
            className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
              comingSoon
                ? "cursor-not-allowed border-border/30 bg-card/50 opacity-50"
                : value === option.value
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card hover:border-primary/50"
            }`}
          >
            <span className="text-3xl">{option.icon}</span>
            <span className="text-sm font-medium">{option.label}</span>
            {comingSoon && (
              <Badge variant="secondary" className="text-xs">
                준비 중
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
