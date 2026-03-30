import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./language-switcher";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <Link href="/" className="text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors">
        VibeStart
      </Link>
      <LanguageSwitcher />
    </header>
  );
}
