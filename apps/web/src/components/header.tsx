import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  const t = useTranslations("Blog");

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors">
          <Image src="/logo.svg" alt="VibeStart" width={32} height={32} />
          VibeStart
        </Link>
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {t("nav")}
        </Link>
      </div>
      <LanguageSwitcher />
    </header>
  );
}
