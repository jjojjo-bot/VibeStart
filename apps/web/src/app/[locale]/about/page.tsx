import { Link } from "@/i18n/navigation";
import { HeroVideo } from "@/components/hero-video";

export default function AboutPage() {
  return (
    <main id="main-content" className="flex flex-col">
      <section
        className="relative w-full"
        style={{ height: "calc(100vh - 4rem)", minHeight: 480, background: "#000" }}
      >
        <HeroVideo />
      </section>

      <section
        className="flex flex-col items-center gap-4 px-6 py-14 text-center"
        style={{ background: "#0a0712", color: "#f3efe8" }}
      >
        <Link
          href="/onboarding"
          className="inline-flex items-center justify-center rounded-[14px] border border-[#7a5cff] bg-[#5a3ee0] px-10 py-4 text-base font-semibold tracking-tight text-white shadow-[0_20px_60px_rgba(122,92,255,0.18),0_0_40px_rgba(122,92,255,0.18)] transition hover:bg-[#6a4eee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7a5cff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0712]"
        >
          Get Started
        </Link>
        <p className="text-sm text-white/55">
          completely free · done in 10 min · no coding experience needed
        </p>
      </section>
    </main>
  );
}
