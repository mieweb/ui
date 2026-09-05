'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';

// =============================================================================
// Types
// =============================================================================

export interface OrbitSatellite {
  id: string;
  /** Accessible name; shown as a hover label. */
  name: string;
  /** Logo/icon content — an `<img>`, a Lucide icon, or a lettermark. */
  children?: React.ReactNode;
  /** Makes the chip a link. */
  href?: string;
  onClick?: () => void;
}

export interface OrbitRingDef {
  satellites: OrbitSatellite[];
  /** Orbit radius as a fraction of the stage (0–0.5). */
  radius: number;
  /** One rotation, in seconds. Default 88 (inner) / 124 (outer). */
  durationSec?: number;
  /** Spin direction. Default alternates per ring. */
  direction?: 'normal' | 'reverse';
  /** Starting angle offset in degrees. */
  offsetDeg?: number;
  /** Draw the orbit path as a dashed rather than solid circle. */
  dashed?: boolean;
}

export interface OrbitRingProps {
  /** Concentric rings, inner first. */
  rings: OrbitRingDef[];
  /** What sits at the centre — a brand mark, a product tile. */
  center?: React.ReactNode;
  /** Diameter of the centre disc as a fraction of the stage. Default 0.21. */
  centerSize?: number;
  /** Diameter of each satellite chip as a fraction of the stage. Default 0.13. */
  chipSize?: number;
  /** Show the warm radial glow behind the centre. Default true. */
  glow?: boolean;
  /** Stage width. Default `min(440px, 86vw)`. */
  size?: string;
  /** Pause everything while hovered/focused. Default true. */
  pauseOnHover?: boolean;
  className?: string;
}

// =============================================================================
// OrbitRing
// =============================================================================

/**
 * A "solar system" of logos: concentric rings of satellite chips orbiting a
 * centre mark at different speeds and directions, chips counter-rotating so
 * they stay upright, the whole system pausing while a visitor explores it.
 * Sizes are container-relative, so it scales with its box. Ported from the
 * Enterprise Health integrations section.
 *
 * @example
 * ```tsx
 * <OrbitRing
 *   center={<img src="/logo.svg" alt="" />}
 *   rings={[
 *     { radius: 0.26, satellites: partners.slice(0, 5).map(p => ({ id: p.slug, name: p.name, href: p.href, children: <img src={p.logo} alt="" /> })) },
 *     { radius: 0.4, satellites: partners.slice(5).map(...) , dashed: true },
 *   ]}
 * />
 * ```
 */
export function OrbitRing({
  rings,
  center,
  centerSize = 0.21,
  chipSize = 0.13,
  glow = true,
  size = 'min(440px, 86vw)',
  pauseOnHover = true,
  className,
}: OrbitRingProps) {
  return (
    <div
      data-slot="orbit-ring"
      style={{ width: size }}
      className={cn(
        'group/orbit [container-type:size] relative mx-auto aspect-square',
        className
      )}
    >
      {glow && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full [background:radial-gradient(closest-side,color-mix(in_srgb,var(--mieweb-accent,var(--mieweb-primary-300))_30%,transparent)_0%,color-mix(in_srgb,var(--mieweb-accent,var(--mieweb-primary-300))_12%,transparent)_42%,transparent_78%)]"
        />
      )}

      {/* orbit paths */}
      {rings.map((r, i) => (
        <span
          key={`path-${i}`}
          aria-hidden
          style={{
            width: `${r.radius * 200}cqmin`,
            height: `${r.radius * 200}cqmin`,
          }}
          className={cn(
            'border-primary-200 dark:border-primary-800 pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border',
            (r.dashed ?? i % 2 === 1)
              ? 'border-dashed opacity-40'
              : 'opacity-50'
          )}
        />
      ))}

      {/* centre */}
      <span
        aria-hidden
        data-slot="orbit-ring-center"
        style={{
          width: `${centerSize * 100}cqmin`,
          height: `${centerSize * 100}cqmin`,
        }}
        className={cn(
          'pointer-events-none absolute top-1/2 left-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full',
          '[background:radial-gradient(circle_at_50%_38%,#fff_0%,color-mix(in_srgb,var(--mieweb-accent,var(--mieweb-primary-200))_14%,#fff)_52%,color-mix(in_srgb,var(--mieweb-accent,var(--mieweb-primary-200))_30%,#fff)_100%)]',
          'shadow-[0_0_0_1px_color-mix(in_srgb,var(--mieweb-accent,var(--mieweb-primary-400))_35%,transparent),0_10px_30px_rgba(0,0,0,0.18),0_0_46px_color-mix(in_srgb,var(--mieweb-accent,var(--mieweb-primary-400))_42%,transparent)]',
          '[&>svg]:text-primary-800 [&>*]:h-[64%] [&>*]:w-[64%] [&>img]:object-contain'
        )}
      >
        {center}
      </span>

      {/* rings */}
      {rings.map((r, i) => {
        const direction = r.direction ?? (i % 2 === 0 ? 'normal' : 'reverse');
        const dur = `${r.durationSec ?? (i === 0 ? 88 : 88 + 36 * i)}s`;
        const n = r.satellites.length;
        return (
          <div
            key={`ring-${i}`}
            data-slot="orbit-ring-track"
            style={
              {
                '--dur': dur,
                animationDirection: direction,
              } as React.CSSProperties
            }
            className={cn(
              'pointer-events-none absolute inset-0',
              'motion-safe:animate-[mie-spin_var(--dur)_linear_infinite]',
              pauseOnHover &&
                'group-focus-within/orbit:[animation-play-state:paused] group-hover/orbit:[animation-play-state:paused]'
            )}
          >
            {r.satellites.map((s, j) => {
              const a = ((360 / n) * j + (r.offsetDeg ?? 0)) * (Math.PI / 180);
              const x = (r.radius * 100 * Math.cos(a)).toFixed(2);
              const y = (r.radius * 100 * Math.sin(a)).toFixed(2);
              const shell = {
                'aria-label': s.name,
                'data-slot': 'orbit-ring-satellite',
                style: {
                  width: `${chipSize * 100}cqmin`,
                  height: `${chipSize * 100}cqmin`,
                  transform: `translate(-50%, -50%) translate(${x}cqmin, ${y}cqmin)`,
                },
                className:
                  'group/sat pointer-events-auto absolute left-1/2 top-1/2 grid place-items-center focus-visible:outline-none',
              };
              const chip = (
                <span
                  // counter-spin keeps the logo upright; direction is the inverse of the ring's
                  style={{
                    animationDirection:
                      direction === 'normal' ? 'reverse' : 'normal',
                  }}
                  className={cn(
                    'border-border bg-card/90 relative grid h-full w-full place-items-center rounded-full border shadow-md transition-[transform,box-shadow,background] duration-200',
                    'motion-safe:animate-[mie-spin_var(--dur)_linear_infinite]',
                    pauseOnHover &&
                      'group-focus-within/orbit:[animation-play-state:paused] group-hover/orbit:[animation-play-state:paused]',
                    'group-hover/sat:bg-card group-hover/sat:scale-[1.12] group-hover/sat:shadow-xl',
                    'group-focus-visible/sat:outline-primary-500 group-focus-visible/sat:scale-[1.12] group-focus-visible/sat:outline group-focus-visible/sat:outline-2 group-focus-visible/sat:outline-offset-[3px]',
                    '[&>img]:h-[64%] [&>img]:w-[64%] [&>img]:object-contain [&>img]:opacity-90 [&>img]:saturate-[0.9] group-hover/sat:[&>img]:opacity-100 group-hover/sat:[&>img]:saturate-100',
                    '[&>svg]:text-primary-800 [&>svg]:h-[46%] [&>svg]:w-[46%]'
                  )}
                >
                  {s.children ?? (
                    <span className="text-primary-800 text-sm font-bold">
                      {s.name.slice(0, 2)}
                    </span>
                  )}
                  <span
                    className={cn(
                      'border-border bg-card text-foreground pointer-events-none absolute top-[calc(100%+5px)] left-1/2 -translate-x-1/2 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold whitespace-nowrap shadow-md',
                      'opacity-0 transition-opacity duration-150 group-hover/sat:opacity-100 group-focus-visible/sat:opacity-100'
                    )}
                  >
                    {s.name}
                  </span>
                </span>
              );
              if (s.href) {
                return (
                  <a key={s.id} href={s.href} onClick={s.onClick} {...shell}>
                    {chip}
                  </a>
                );
              }
              if (s.onClick) {
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={s.onClick}
                    {...shell}
                  >
                    {chip}
                  </button>
                );
              }
              return (
                <span key={s.id} role="img" {...shell}>
                  {chip}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
