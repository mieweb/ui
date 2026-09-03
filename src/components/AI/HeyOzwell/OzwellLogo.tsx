/**
 * The octopus logo <img> with a graceful fallback.
 *
 * The default `/ozwell/icon.svg` is served from Storybook's static dir; a consuming app that neither
 * serves that path nor passes `logoSrc` would otherwise render the browser's broken-image icon. The
 * brand SVG is ~900 KB (it embeds a raster), far too heavy to bundle into a component library — so
 * instead, when the asset fails to load this swaps to an inline emoji octopus sized to fit. Hosts
 * should pass `logoSrc` (or serve the asset at the default path) to get the real brand mark.
 */
import * as React from 'react';

/** Default logo path — Storybook's static asset; consumers override via `logoSrc` or serve this path. */
export const DEFAULT_LOGO_SRC = '/ozwell/icon.svg';

export interface OzwellLogoProps {
  /** Image source; falls back to the inline emoji if it fails to load. */
  src: string;
  /** Rendered width in px. */
  width: number;
  /** Rendered height in px. */
  height: number;
  /** Extra styles (transforms/filters from the caller). Width/height come from the props. */
  style?: React.CSSProperties;
  className?: string;
}

export function OzwellLogo({
  src,
  width,
  height,
  style,
  className,
}: OzwellLogoProps) {
  const [failed, setFailed] = React.useState(false);
  // A new src (host-supplied asset) gets a fresh chance after a previous failure.
  React.useEffect(() => setFailed(false), [src]);

  if (failed) {
    return (
      <span
        aria-hidden="true"
        className={className}
        style={{
          ...style,
          width,
          height,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.min(width, height) * 0.78,
          lineHeight: 1,
          userSelect: 'none',
        }}
      >
        🐙
      </span>
    );
  }
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
      style={{ ...style, width, height }}
      onError={() => setFailed(true)}
    />
  );
}
