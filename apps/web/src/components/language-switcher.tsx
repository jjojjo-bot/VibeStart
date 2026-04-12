"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

type LocaleConfig = {
  label: string;
  flag: string; // ISO 3166-1 alpha-2 country code for flagcdn.com
};

const LOCALE_CONFIG: Record<string, LocaleConfig> = {
  ko: { label: "한국어", flag: "kr" },
  en: { label: "English", flag: "us" },
  ja: { label: "日本語", flag: "jp" },
  zh: { label: "中文", flag: "cn" },
  es: { label: "Español", flag: "es" },
  hi: { label: "हिन्दी", flag: "in" },
};

function FlagImage({ code, label }: { code: string; label: string }) {
  return (
    <img
      src={`https://flagcdn.com/20x15/${code}.png`}
      srcSet={`https://flagcdn.com/40x30/${code}.png 2x`}
      width={20}
      height={15}
      alt={label}
      className="rounded-sm"
    />
  );
}

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALE_CONFIG[locale];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(loc: string) {
    router.replace(pathname, { locale: loc });
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-2 py-1.5 text-sm text-foreground outline-none hover:bg-accent transition-colors"
        aria-label={`${current.label} — Select language`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <FlagImage code={current.flag} label={current.label} />
        <span>{current.label}</span>
        <svg
          className={`h-3 w-3 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          className="absolute right-0 z-50 mt-1 w-36 rounded-lg border border-border/50 bg-card py-1 shadow-lg"
        >
          {routing.locales.map((loc) => {
            const config = LOCALE_CONFIG[loc];
            return (
              <li key={loc} role="option" aria-selected={loc === locale}>
                <button
                  onClick={() => handleSelect(loc)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors ${
                    loc === locale ? "text-primary font-medium" : "text-foreground"
                  }`}
                >
                  <FlagImage code={config.flag} label={config.label} />
                  <span>{config.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
