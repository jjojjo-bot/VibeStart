"use client";

import dynamic from "next/dynamic";

const HeroVideoInner = dynamic(
  () => import("@/components/hero-video").then((m) => m.HeroVideo),
  { ssr: false, loading: () => <div className="h-full w-full" /> },
);

export function HeroVideoLazy(): React.ReactElement {
  return <HeroVideoInner />;
}
