'use client';

import * as React from 'react';
import ReactGlobe, { type GlobeMethods } from 'react-globe.gl';
import { MeshPhongMaterial } from 'three';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

// =============================================================================
// Types
// =============================================================================

export interface GlobePoint {
  id?: string;
  lat: number;
  lng: number;
  name: string;
  /** Secondary line in tooltip/callout, e.g. "Distribution". */
  sub?: string;
  /** Hubs are drawn larger, raised, and become arc anchors. */
  hub?: boolean;
  /** Per-point dot colour. */
  color?: string;
  /** IANA zone, e.g. `America/Sao_Paulo` — shows a live local clock in the callout. */
  timeZone?: string;
  /** Emoji flag or short code shown before the name in the callout. */
  flag?: string;
  /** Destination when the callout is clicked. */
  href?: string;
}

export interface GlobeArc {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  /** `backbone` arcs are brighter and thicker than `spoke` arcs. */
  kind?: 'backbone' | 'spoke';
  /** Dash cycle time in ms. */
  speed?: number;
  /** Dash start offset 0–1. */
  gap?: number;
}

export interface GlobeTheme {
  /** Globe body. */
  surface?: string;
  emissive?: string;
  atmosphere?: string;
  /** Dotted-continent colour. */
  land?: string;
  /** Hub dot / city dot. */
  hub?: string;
  city?: string;
  /** Arc gradients, start → end. */
  backbone?: [string, string];
  spoke?: [string, string];
}

export interface GlobeProps {
  points?: GlobePoint[];
  /** Explicit arcs. Omit to auto-connect every non-hub point to its nearest hub. */
  arcs?: GlobeArc[];
  /** Also connect hubs to each other in a ring. Default true when ≥2 hubs. */
  connectHubs?: boolean;
  /**
   * GeoJSON FeatureCollection URL for the dotted continents. Defaults to the
   * Natural Earth 110m countries file shipped with react-globe.gl's examples.
   */
  geoUrl?: string | null;
  /** Hex resolution (2 coarse … 4 fine). Default 3. */
  hexResolution?: number;
  theme?: GlobeTheme;
  /** Initial camera. Default lat 18 / lng −22 / altitude 2.35. */
  pointOfView?: { lat?: number; lng?: number; altitude?: number };
  /** Auto-rotate speed; 0 disables. Default 0.5. Off under reduced motion. */
  autoRotateSpeed?: number;
  enableZoom?: boolean;
  /** Show the pill callout for the selected point. Default true. */
  callout?: boolean;
  /** Controlled selection. */
  selectedId?: string | null;
  onSelect?: (point: GlobePoint | null) => void;
  onPointHover?: (point: GlobePoint | null) => void;
  /** Custom hover tooltip HTML. */
  pointLabel?: (point: GlobePoint) => string;
  /** Fixed height. Default `clamp(360px, 54vw, 560px)`. */
  height?: string;
  className?: string;
}

// =============================================================================
// Defaults
// =============================================================================

export const DEFAULT_GEO_URL =
  'https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson';

const DEFAULT_THEME: Required<GlobeTheme> = {
  surface: '#0a1322',
  emissive: '#0a1b2e',
  atmosphere: '#5b8fb0',
  land: 'rgba(123,156,201,0.5)',
  hub: '#ffe7b0',
  city: 'rgba(201,168,116,0.72)',
  backbone: ['rgba(63,169,155,0.12)', 'rgba(160,235,224,0.95)'],
  spoke: ['rgba(63,169,155,0)', 'rgba(150,225,214,0.5)'],
};

type Arc = Required<
  Pick<
    GlobeArc,
    'startLat' | 'startLng' | 'endLat' | 'endLng' | 'kind' | 'speed' | 'gap'
  >
>;

function haversine(a: GlobePoint, b: GlobePoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * Math.asin(Math.sqrt(h));
}

/** Spokes from each city to its nearest hub, plus an optional hub ring. */
export function buildArcs(points: GlobePoint[], connectHubs = true): Arc[] {
  const hubs = points.filter((p) => p.hub);
  if (hubs.length === 0) return [];
  const spokes: Arc[] = points
    .filter((p) => !p.hub)
    .map((c, i) => {
      const hub = hubs.reduce(
        (best, h) => (haversine(c, h) < haversine(c, best) ? h : best),
        hubs[0]
      );
      return {
        startLat: c.lat,
        startLng: c.lng,
        endLat: hub.lat,
        endLng: hub.lng,
        kind: 'spoke',
        speed: 4200 + ((i * 137) % 2800),
        gap: ((i * 13) % 100) / 100,
      };
    });
  const ring: Arc[] =
    connectHubs && hubs.length > 1
      ? hubs.map((h, i) => {
          const next = hubs[(i + 1) % hubs.length];
          return {
            startLat: h.lat,
            startLng: h.lng,
            endLat: next.lat,
            endLng: next.lng,
            kind: 'backbone',
            speed: 4600,
            gap: (i * 33) / 100,
          };
        })
      : [];
  return [...spokes, ...ring];
}

function pointId(p: GlobePoint): string {
  return p.id ?? `${p.lat},${p.lng}`;
}

// =============================================================================
// Globe
// =============================================================================

/**
 * A branded WebGL globe on react-globe.gl: dotted-hex continents, hub and
 * city dots with hover tooltips, animated hub-and-spoke arcs, slow
 * auto-rotation (paused while dragging, off under reduced motion), and a
 * pill callout for the selected point with an optional live local clock.
 * Transparent background so it sits on any surface. Ported from the
 * Enterprise Health global-reach section.
 *
 * Client-only — import from `@mieweb/ui/globe` behind `ssr: false`.
 * Requires the optional peers `react-globe.gl` and `three`.
 */
export function Globe({
  points = [],
  arcs,
  connectHubs = true,
  geoUrl = DEFAULT_GEO_URL,
  hexResolution = 3,
  theme,
  pointOfView = { lat: 18, lng: -22, altitude: 2.35 },
  autoRotateSpeed = 0.5,
  enableZoom = false,
  callout = true,
  selectedId,
  onSelect,
  onPointHover,
  pointLabel,
  height = 'clamp(360px, 54vw, 560px)',
  className,
}: GlobeProps) {
  const t = { ...DEFAULT_THEME, ...theme };
  const reduced = usePrefersReducedMotion();
  const globeRef = React.useRef<GlobeMethods | undefined>(undefined);
  const frameRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const [countries, setCountries] = React.useState<object[]>([]);
  const [innerSel, setInnerSel] = React.useState<string | null>(null);
  const sel = selectedId !== undefined ? selectedId : innerSel;
  const selected = sel
    ? (points.find((p) => pointId(p) === sel) ?? null)
    : null;

  const material = React.useMemo(
    () =>
      new MeshPhongMaterial({
        color: t.surface,
        emissive: t.emissive,
        emissiveIntensity: 0.32,
        shininess: 4,
      }),
    [t.surface, t.emissive]
  );

  const arcData = React.useMemo<Arc[]>(
    () =>
      arcs
        ? arcs.map((a) => ({ kind: 'spoke', speed: 4600, gap: 0, ...a }))
        : buildArcs(points, connectHubs),
    [arcs, points, connectHubs]
  );

  // Size to the frame.
  React.useEffect(() => {
    const el = frameRef.current;
    if (!el || typeof globalThis.ResizeObserver === 'undefined') return;
    const ro = new globalThis.ResizeObserver(([e]) => {
      const { width, height: h } = e.contentRect;
      setSize({ w: Math.round(width), h: Math.round(h) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    if (!geoUrl) return;
    let live = true;
    fetch(geoUrl)
      .then((r) => r.json())
      .then(
        (geo: { features?: object[] }) =>
          live && setCountries(geo.features ?? [])
      )
      .catch(() => live && setCountries([]));
    return () => {
      live = false;
    };
  }, [geoUrl]);

  const onReady = React.useCallback(() => {
    const g = globeRef.current;
    if (!g) return;
    const c = g.controls();
    c.enableZoom = enableZoom;
    c.enablePan = false;
    c.autoRotate = !reduced && autoRotateSpeed > 0;
    c.autoRotateSpeed = autoRotateSpeed;
    c.minPolarAngle = Math.PI * 0.16;
    c.maxPolarAngle = Math.PI * 0.84;
    g.pointOfView(pointOfView);
    // let the page still scroll vertically over the canvas on touch
    g.renderer().domElement.style.touchAction = 'pan-y';
  }, [enableZoom, reduced, autoRotateSpeed, pointOfView]);

  const select = (p: GlobePoint | null) => {
    if (selectedId === undefined) setInnerSel(p ? pointId(p) : null);
    onSelect?.(p);
  };

  return (
    <div
      ref={frameRef}
      data-slot="globe"
      style={{ height }}
      className={cn('relative w-full overflow-hidden', className)}
    >
      {size.w > 0 && (
        <ReactGlobe
          ref={globeRef}
          width={size.w}
          height={size.h}
          onGlobeReady={onReady}
          backgroundColor="rgba(0,0,0,0)"
          globeMaterial={material}
          showAtmosphere
          atmosphereColor={t.atmosphere}
          atmosphereAltitude={0.16}
          hexPolygonsData={countries}
          hexPolygonResolution={hexResolution}
          hexPolygonMargin={0.4}
          hexPolygonUseDots
          hexPolygonColor={() => t.land}
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointAltitude={(d: object) => ((d as GlobePoint).hub ? 0.013 : 0.006)}
          pointRadius={(d: object) => ((d as GlobePoint).hub ? 0.48 : 0.3)}
          pointResolution={18}
          pointColor={(d: object) => {
            const p = d as GlobePoint;
            return p.color ?? (p.hub ? t.hub : t.city);
          }}
          pointLabel={(d: object) => {
            const p = d as GlobePoint;
            if (pointLabel) return pointLabel(p);
            return `<b>${p.name}</b>${p.sub ? ` &middot; ${p.sub}` : ''}`;
          }}
          onPointHover={(d: object | null) =>
            onPointHover?.((d as GlobePoint) ?? null)
          }
          onPointClick={(d: object) => select(d as GlobePoint)}
          onGlobeClick={() => select(null)}
          arcsData={arcData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={(d: object) =>
            (d as Arc).kind === 'backbone' ? t.backbone : t.spoke
          }
          arcStroke={(d: object) =>
            (d as Arc).kind === 'backbone' ? 0.5 : 0.3
          }
          arcAltitudeAutoScale={0.45}
          arcDashLength={(d: object) =>
            reduced ? 1 : (d as Arc).kind === 'backbone' ? 0.5 : 0.35
          }
          arcDashGap={(d: object) =>
            reduced ? 0 : (d as Arc).kind === 'backbone' ? 0.2 : 0.7
          }
          arcDashInitialGap={(d: object) => (reduced ? 0 : (d as Arc).gap)}
          arcDashAnimateTime={(d: object) => (reduced ? 0 : (d as Arc).speed)}
        />
      )}

      {callout && selected && (
        <Callout point={selected} onClose={() => select(null)} />
      )}
    </div>
  );
}

// =============================================================================
// Callout
// =============================================================================

function useLocalTime(timeZone?: string) {
  const fmt = React.useMemo(
    () =>
      timeZone
        ? new Intl.DateTimeFormat(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            timeZone,
            timeZoneName: 'short',
          })
        : null,
    [timeZone]
  );
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    if (!fmt) return;
    const t = window.setInterval(() => setNow(new Date()), 15_000);
    return () => window.clearInterval(t);
  }, [fmt]);
  return fmt ? fmt.format(now) : null;
}

function Callout({
  point,
  onClose,
}: {
  point: GlobePoint;
  onClose: () => void;
}) {
  const time = useLocalTime(point.timeZone);
  const Body = point.href ? 'a' : 'span';
  return (
    <div
      role="status"
      aria-live="polite"
      data-slot="globe-callout"
      className="absolute bottom-4 left-1/2 z-10 inline-flex max-w-[min(90%,360px)] -translate-x-1/2 items-center gap-2.5 rounded-full border border-white/15 bg-neutral-950/70 py-1.5 ps-3.5 pe-1.5 text-white shadow-xl backdrop-blur-md motion-safe:animate-[mie-fade-in_0.28s_ease]"
    >
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full bg-[var(--mieweb-accent,#ffe7b0)] shadow-[0_0_8px_var(--mieweb-accent,#ffe7b0)]"
      />
      <Body
        href={point.href}
        className="flex min-w-0 flex-col leading-tight no-underline"
      >
        <b className="truncate text-sm">
          {point.flag && <span className="me-1.5">{point.flag}</span>}
          {point.name}
        </b>
        {(point.sub || time) && (
          <span className="truncate text-[11px] tracking-wider text-white/70 uppercase">
            {point.sub}
            {point.sub && time && ' · '}
            {time && (
              <span className="tracking-normal normal-case tabular-nums">
                {time}
              </span>
            )}
          </span>
        )}
      </Body>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="ms-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
      >
        <X size={14} aria-hidden />
      </button>
    </div>
  );
}
