import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/50 py-6 px-6">
      <div className="mx-auto max-w-2xl flex items-center justify-between text-sm text-muted-foreground">
        <span>&copy; {new Date().getFullYear()} VibeStart</span>
        <nav className="flex gap-4">
          <Link
            href="/privacy"
            className="hover:text-foreground transition-colors"
          >
            개인정보처리방침
          </Link>
        </nav>
      </div>
    </footer>
  );
}
