"use client";

import { useTranslations } from "next-intl";
import { InstallExperience } from "@/lib/onboarding";

const EXPERIENCE_VALUES: readonly InstallExperience[] = ["first", "prior", "unsure"];

interface StepExperienceProps {
  value: InstallExperience | null;
  onChange: (experience: InstallExperience) => void;
}

export function StepExperience({ value, onChange }: StepExperienceProps) {
  const t = useTranslations("Onboarding");
  return (
    <div role="radiogroup" aria-label={t("experienceAriaLabel")} className="flex flex-col gap-3">
      {EXPERIENCE_VALUES.map((option) => (
        <button
          key={option}
          role="radio"
          aria-checked={value === option}
          onClick={() => onChange(option)}
          className={`rounded-xl border-2 p-5 text-left transition-all ${
            value === option
              ? "border-primary bg-primary/10"
              : "border-border/50 bg-card hover:border-primary/50"
          }`}
        >
          <span className="block font-medium text-foreground">
            {t(`experienceOptions.${option}.label`)}
          </span>
          <span className="mt-1 block text-sm text-muted-foreground">
            {t(`experienceOptions.${option}.description`)}
          </span>
        </button>
      ))}
    </div>
  );
}
