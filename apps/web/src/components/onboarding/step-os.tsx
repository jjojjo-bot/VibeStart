"use client";

import { OS, OS_OPTIONS } from "@/lib/onboarding";

function WindowsLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" />
    </svg>
  );
}

const OS_ICONS: Record<OS, React.ReactNode> = {
  windows: <WindowsLogo className="h-10 w-10" />,
  macos: <AppleLogo className="h-10 w-10" />,
};

interface StepOSProps {
  value: OS | null;
  onChange: (os: OS) => void;
}

export function StepOS({ value, onChange }: StepOSProps) {
  return (
    <div role="radiogroup" aria-label="운영체제 선택" className="grid grid-cols-2 gap-4">
      {OS_OPTIONS.map((option) => (
        <button
          key={option.value}
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-8 transition-all ${
            value === option.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/50 bg-card text-muted-foreground hover:border-primary/50"
          }`}
        >
          {OS_ICONS[option.value]}
          <span className="text-lg font-medium text-foreground">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
