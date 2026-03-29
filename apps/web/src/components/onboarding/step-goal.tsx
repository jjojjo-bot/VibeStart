"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Goal, GOAL_OPTIONS } from "@/lib/onboarding";

interface StepGoalProps {
  value: Goal | null;
  onChange: (goal: Goal) => void;
}

const WEB_SUB_VALUES = new Set<string>(["web-nextjs", "web-python", "web-java"]);

export function StepGoal({ value, onChange }: StepGoalProps) {
  const [showWebSub, setShowWebSub] = useState(
    value !== null && WEB_SUB_VALUES.has(value),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        {GOAL_OPTIONS.map((option) => {
          const hasSubOptions = "subOptions" in option;
          const isSelected = hasSubOptions
            ? showWebSub
            : value === option.value;

          return (
            <button
              key={hasSubOptions ? "website" : option.value}
              onClick={() => {
                if (hasSubOptions) {
                  setShowWebSub(true);
                } else {
                  setShowWebSub(false);
                  onChange(option.value as Goal);
                }
              }}
              className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition-all ${
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-border/50 bg-card hover:border-primary/50"
              }`}
            >
              <span className="text-3xl">{option.icon}</span>
              <span className="text-sm font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>

      {showWebSub && (
        <div className="flex flex-col gap-3">
          <p className="text-center text-sm text-muted-foreground">
            어떤 기술로 만들까요?
          </p>
          {GOAL_OPTIONS.filter((o): o is (typeof GOAL_OPTIONS)[0] => "subOptions" in o)
            .flatMap((o) => o.subOptions)
            .map((sub) => (
              <button
                key={sub.value}
                onClick={() => onChange(sub.value)}
                className={`flex items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  value === sub.value
                    ? "border-primary bg-primary/10"
                    : "border-border/50 bg-card hover:border-primary/50"
                }`}
              >
                <span className="mt-0.5 text-2xl">{sub.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{sub.label}</span>
                    {"recommended" in sub && sub.recommended && (
                      <Badge variant="secondary" className="text-xs">
                        추천
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                    {sub.description}
                  </p>
                </div>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
