import type { SetupMode } from "@/lib/onboarding";

type SetupModeIconProps = {
  mode: SetupMode;
  className?: string;
};

export function SetupModeIcon({ mode, className }: SetupModeIconProps) {
  if (mode === "project-only") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="m13 2-9 12h8l-1 8 9-12h-8l1-8Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M3 12h18M9 12v2h6v-2" />
    </svg>
  );
}
