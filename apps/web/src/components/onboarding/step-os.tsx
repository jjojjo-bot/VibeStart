"use client";

import { OS, OS_OPTIONS } from "@/lib/onboarding";

interface StepOSProps {
  value: OS | null;
  onChange: (os: OS) => void;
}

export function StepOS({ value, onChange }: StepOSProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {OS_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-8 transition-all ${
            value === option.value
              ? "border-primary bg-primary/10"
              : "border-border/50 bg-card hover:border-primary/50"
          }`}
        >
          <span className="text-4xl">{option.icon}</span>
          <span className="text-lg font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
