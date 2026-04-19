"use client";

import { useEffect, useRef, useState } from "react";
import { geoOrthographic, geoPath, geoGraticule10 } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";

type CountriesTopology = Topology<{
  countries: GeometryCollection;
}>;

const W = 200;
const H = 200;
const R = 66;

let cachedCountries: FeatureCollection<Geometry> | null = null;
let countriesPromise: Promise<FeatureCollection<Geometry>> | null = null;

async function loadCountries(): Promise<FeatureCollection<Geometry>> {
  if (cachedCountries) return cachedCountries;
  if (!countriesPromise) {
    countriesPromise = fetch("/world-atlas/countries-110m.json")
      .then((r) => r.json() as Promise<CountriesTopology>)
      .then((topo) => {
        const fc = feature(topo, topo.objects.countries) as
          | FeatureCollection<Geometry>
          | Feature<Geometry>;
        const collection: FeatureCollection<Geometry> =
          fc.type === "FeatureCollection"
            ? fc
            : { type: "FeatureCollection", features: [fc] };
        cachedCountries = collection;
        return collection;
      });
  }
  return countriesPromise;
}

export function GlobeLoader({
  size = 200,
  label = "Loading",
}: {
  size?: number;
  label?: string;
}): React.ReactNode {
  const graticulePathRef = useRef<SVGPathElement | null>(null);
  const landPathRef = useRef<SVGPathElement | null>(null);
  const [countries, setCountries] = useState<FeatureCollection<Geometry> | null>(
    cachedCountries,
  );

  useEffect(() => {
    let cancelled = false;
    if (!countries) {
      loadCountries().then((c) => {
        if (!cancelled) setCountries(c);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [countries]);

  useEffect(() => {
    const projection = geoOrthographic()
      .scale(R)
      .translate([W / 2, H / 2])
      .clipAngle(90)
      .rotate([0, -15, 0]);
    const path = geoPath(projection);
    const graticule = geoGraticule10();

    const paint = (lambda: number): void => {
      projection.rotate([lambda, -15, 0]);
      if (graticulePathRef.current) {
        graticulePathRef.current.setAttribute("d", path(graticule) ?? "");
      }
      if (landPathRef.current && countries) {
        landPathRef.current.setAttribute("d", path(countries) ?? "");
      }
    };

    let lambda = 0;
    let frame = 0;
    const tick = (): void => {
      lambda += 0.35;
      paint(lambda);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [countries]);

  const scale = size / 200;
  const globeDiameter = 132 * scale;

  return (
    <div
      role="status"
      aria-label={label}
      className="relative flex items-center justify-center text-foreground"
      style={{ width: size, height: size, color: "currentColor" }}
    >
      {/* Whirl rings */}
      <div className="pointer-events-none absolute inset-0">
        <svg
          viewBox="-100 -100 200 200"
          className="absolute inset-0 h-full w-full overflow-visible [animation:globe-spin_2.4s_linear_infinite]"
        >
          <circle
            r="94"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="40 540"
            strokeOpacity="0.9"
            strokeLinecap="round"
          />
          <circle
            r="94"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="12 140"
            strokeOpacity="0.35"
            strokeDashoffset="-220"
            strokeLinecap="round"
          />
          <circle cx="94" cy="0" r="2.2" fill="currentColor" />
        </svg>

        <svg
          viewBox="-100 -100 200 200"
          className="absolute inset-0 h-full w-full overflow-visible [animation:globe-spin_3.6s_linear_infinite_reverse]"
        >
          <circle
            r="82"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            strokeDasharray="2 10"
            strokeOpacity="0.55"
            strokeLinecap="round"
          />
          <circle
            r="82"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeDasharray="28 488"
            strokeLinecap="round"
          />
          <circle cx="-82" cy="0" r="1.6" fill="currentColor" />
        </svg>

        <svg
          viewBox="-100 -100 200 200"
          className="absolute inset-0 h-full w-full overflow-visible [animation:globe-spin_5s_linear_infinite]"
        >
          <circle
            r="73"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.6"
            strokeOpacity="0.18"
          />
          <circle
            r="73"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeDasharray="60 400"
            strokeOpacity="0.7"
            strokeDashoffset="-120"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Globe */}
      <div
        className="relative overflow-hidden rounded-full"
        style={{
          width: globeDiameter,
          height: globeDiameter,
        }}
      >
        <svg viewBox="0 0 200 200" className="block h-full w-full" aria-hidden="true">
          <path
            d={geoPath(
              geoOrthographic().scale(R).translate([W / 2, H / 2]).clipAngle(90),
            )({ type: "Sphere" }) ?? ""}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
          />
          <path
            ref={graticulePathRef}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeOpacity="0.22"
          />
          <path
            ref={landPathRef}
            fill="currentColor"
            fillOpacity="0.88"
            stroke="none"
          />
        </svg>
      </div>

      {/* Shadow — soft glow under globe */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 blur-[1px]"
        style={{
          bottom: 6 * scale,
          width: 90 * scale,
          height: 8 * scale,
          background:
            "radial-gradient(ellipse at center, currentColor, transparent 70%)",
          opacity: 0.18,
        }}
      />

      <style>{`
        @keyframes globe-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
