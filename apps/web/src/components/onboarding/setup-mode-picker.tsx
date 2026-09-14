'use client';

import { useTranslations } from 'next-intl';
import type { SetupMode } from '@/lib/onboarding';
import { SetupModeIcon } from '@/components/onboarding/setup-mode-icon';

const MODES: readonly SetupMode[] = ['full', 'project-only'];

type SetupModePickerProps = {
  value: SetupMode | null;
  onChange: (mode: SetupMode) => void;
};

export function SetupModePicker({ value, onChange }: SetupModePickerProps) {
  const t = useTranslations('Onboarding.quickStart');

  return (
    <div role="radiogroup" aria-label={t('ariaLabel')} className="grid gap-4 md:grid-cols-2">
      {MODES.map((mode) => {
        const selected = value === mode;
        const key = mode === 'full' ? 'full' : 'projectOnly';

        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={t(`${key}.title`)}
            onClick={() => onChange(mode)}
            className={`group relative flex min-h-72 flex-col overflow-hidden rounded-2xl border-2 p-6 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
              selected
                ? '-translate-y-0.5 border-primary bg-primary/10 shadow-lg shadow-primary/10'
                : 'border-border/60 bg-card hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md'
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute -right-10 -top-10 h-32 w-32 rounded-full blur-3xl transition-opacity ${
                selected
                  ? 'bg-primary/30 opacity-100'
                  : 'bg-primary/10 opacity-0 group-hover:opacity-100'
              }`}
            />

            <span className="relative flex items-start justify-between gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <SetupModeIcon mode={mode} className="h-6 w-6" />
              </span>
              <span className="flex min-h-7 items-center">
                {mode === 'full' && !selected && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    {t('recommended')}
                  </span>
                )}
                {selected && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    ✓ {t('selected')}
                  </span>
                )}
              </span>
            </span>

            <span className="relative mt-5 block text-xl font-bold text-foreground">
              {t(`${key}.title`)}
            </span>
            <span className="relative mt-2 block text-sm leading-6 text-muted-foreground">
              {t(`${key}.description`)}
            </span>

            <span className="relative mt-5 block rounded-xl bg-background/70 p-3 text-sm text-foreground">
              <span className="mr-2" aria-hidden="true">
                👤
              </span>
              {t(`${key}.bestFor`)}
            </span>

            <span className="relative mt-auto flex flex-wrap gap-2 pt-5">
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                {t(`${key}.time`)}
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary">
                {t(`${key}.steps`)}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
