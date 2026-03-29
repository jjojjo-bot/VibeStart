import Link from "next/link";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center px-6 py-4">
      <Link href="/" className="text-lg font-bold tracking-tight text-foreground hover:text-primary transition-colors">
        VibeStart
      </Link>
    </header>
  );
}
