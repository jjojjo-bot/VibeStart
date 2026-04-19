"use client";

import type { ReactNode } from "react";
import { Stage } from "./core";
import {
  BackgroundDark,
  SceneBuilt,
  SceneCTA,
  SceneColdOpen,
  SceneDoubt,
  ScenePivot,
  SceneSteps,
} from "./scenes";

export function HeroVideo(): ReactNode {
  return (
    <Stage width={1920} height={1080} duration={32} background="#0a0712">
      <BackgroundDark />
      <SceneColdOpen start={0} end={3} />
      <SceneDoubt start={3} end={8} />
      <ScenePivot start={8} end={13} />
      <SceneSteps start={13} end={20} />
      <SceneBuilt start={20} end={26} />
      <SceneCTA start={26} end={32} />
    </Stage>
  );
}
