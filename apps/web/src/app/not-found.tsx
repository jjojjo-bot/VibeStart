import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center px-6 py-24">
      <div className="mx-auto max-w-md text-center">
        <div className="text-8xl font-bold text-primary/30">404</div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          The page you are looking for does not exist or has been removed.
        </p>
        <div className="mt-8">
          <Link href="/">
            <Button size="lg">Go Home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
