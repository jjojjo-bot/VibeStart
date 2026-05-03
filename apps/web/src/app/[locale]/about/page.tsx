import { Link } from "@/i18n/navigation";
import { HeroVideo } from "@/components/hero-video";

const SITE_URL = "https://vibe-start.com";

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Brandon",
  url: SITE_URL,
  jobTitle: "Founder, VibeStart",
  description:
    "Building tools that lower the entry barrier for non-developers stepping into AI-assisted coding. Hexagonal architecture · pnpm monorepo · Next.js obsessed.",
  sameAs: [
    "https://github.com/jjojjo-bot",
    "https://x.com/vibestartdev",
    "https://www.linkedin.com/in/brandon-vibestart",
    "https://1daymillion.com",
    "https://vibe-start.com",
  ],
  worksFor: {
    "@type": "Organization",
    name: "VibeStart",
    url: SITE_URL,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "VibeStart",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.svg`,
  description:
    "비전공자가 AI 코딩을 시작하는 가장 빠른 길 — Git/Node/VS Code 환경 세팅부터 첫 Vercel 배포까지 30분",
  founder: {
    "@type": "Person",
    name: "Brandon",
    url: SITE_URL,
  },
  sameAs: [
    "https://github.com/jjojjo-bot/VibeStart",
    "https://x.com/vibestartdev",
    "https://1daymillion.com/category/vibe-coding/",
  ],
};

export default function AboutPage() {
  return (
    <main id="main-content" className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      <section
        className="relative w-full"
        style={{ height: "calc(100vh - 4rem)", minHeight: 480, background: "#000" }}
      >
        <HeroVideo />
      </section>

      <section
        className="flex flex-col items-center px-6 py-20"
        style={{ background: "#0a0712", color: "#f3efe8" }}
      >
        <div className="mx-auto w-full max-w-2xl text-left">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">
            About the maker
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Made by Brandon
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/70">
            VibeStart began with a single observation: <em>most non-developers
            who want to try AI-assisted coding give up before they ever write
            their first line — they get stuck installing the tools.</em>
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            I&apos;m Brandon. I run{" "}
            <a
              href="https://1daymillion.com/category/vibe-coding/"
              target="_blank"
              rel="noopener"
              className="text-[#9d85ff] underline underline-offset-4 hover:text-[#b8a5ff]"
            >
              1daymillion.com
            </a>{" "}
            (a non-developer focused vibe coding blog) and built VibeStart to
            close that 30-minute gap between &ldquo;I want to try this&rdquo;
            and &ldquo;my first Next.js app is live on the internet.&rdquo;
            The codebase lives on{" "}
            <a
              href="https://github.com/jjojjo-bot/VibeStart"
              target="_blank"
              rel="noopener"
              className="text-[#9d85ff] underline underline-offset-4 hover:text-[#b8a5ff]"
            >
              GitHub
            </a>{" "}
            — Next.js 16, hexagonal architecture, pnpm monorepo, six languages.
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/70">
            If VibeStart helped you cross that gap, the best thanks is to{" "}
            <a
              href="https://1daymillion.com/category/vibe-coding/"
              target="_blank"
              rel="noopener"
              className="text-[#9d85ff] underline underline-offset-4 hover:text-[#b8a5ff]"
            >
              read the blog
            </a>
            , star the repo, or build something and share it. Every story makes
            the next non-developer&apos;s onboarding a little easier to design.
          </p>
          <p className="mt-6 text-sm text-white/50">
            Find me on{" "}
            <a
              href="https://x.com/vibestartdev"
              target="_blank"
              rel="noopener"
              className="text-[#9d85ff] underline underline-offset-4 hover:text-[#b8a5ff]"
            >
              X
            </a>
            {" · "}
            <a
              href="https://www.linkedin.com/in/brandon-vibestart"
              target="_blank"
              rel="noopener"
              className="text-[#9d85ff] underline underline-offset-4 hover:text-[#b8a5ff]"
            >
              LinkedIn
            </a>
            {" · "}
            <a
              href="https://github.com/jjojjo-bot"
              target="_blank"
              rel="noopener"
              className="text-[#9d85ff] underline underline-offset-4 hover:text-[#b8a5ff]"
            >
              GitHub
            </a>
          </p>
        </div>
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
