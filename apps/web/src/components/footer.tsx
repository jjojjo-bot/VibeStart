"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("Common");

  return (
    <footer className="mt-auto border-t border-border/50 py-6 px-6">
      <div className="mx-auto max-w-2xl flex items-center justify-between text-sm text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} VibeStart</span>
        <nav className="flex gap-4">
          <Link
            href="/terms"
            className="hover:text-foreground transition-colors"
          >
            {t("termsOfService")}
          </Link>
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            {t("privacyPolicy")}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
