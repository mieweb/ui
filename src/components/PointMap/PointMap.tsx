import * as React from 'react';
import type * as L from 'leaflet';
import { cn } from '../../utils/cn';

export interface MapPoint {
  lat: number;
  lng: number;
  label: string;
  /** Sizes the marker when `sizeBy="value"`, and is shown on it. */
  value?: number;
  /** Extra line in the marker's tooltip and the list, e.g. `Austin, TX \u00b7 Mar 2026`. */
  detail?: string;
}

export interface PointMapProps extends React.HTMLAttributes<HTMLDivElement> {
  points: MapPoint[];
  /** Accessible name of the map; the points are also listed as text beneath it. */
  label: string;
  center?: [number, number];
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  /** Map height in px. */
  height?: number;
  /** Raster tile template. Defaults to OpenStreetMap; use a tile service you are licensed for. */
  tileUrl?: string;
  /** Tile attribution, as the tile provider requires. */
  attribution?: string;
  /** GeoJSON URL for region outlines drawn over the tiles, e.g. US states. */
  outlineUrl?: string;
  /** `value` scales markers by `value`; `none` draws equal dots. */
  sizeBy?: 'value' | 'none';
  /** Show each point's value on its marker. */
  showValues?: boolean;
  /** Hide the text list of points under the map. */
  hideList?: boolean;
}

const OSM = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; OpenStreetMap contributors';

/**
 * Points on a Leaflet map, sized by value, with a text list of the same points
 * for screen readers and print. Needs the optional `leaflet` peer and its CSS
 * (`import 'leaflet/dist/leaflet.css'`). Client-only.
 */
export const PointMap = React.forwardRef<HTMLDivElement, PointMapProps>(
  (
    {
      points,
      label,
      center = [39.8, -98.6],
      zoom = 3,
      minZoom = 2,
      maxZoom = 10,
      height = 320,
      tileUrl = OSM,
      attribution = OSM_ATTRIBUTION,
      outlineUrl,
      sizeBy = 'value',
      showValues,
      hideList,
      className,
      ...rest
    },
    ref
  ) => {
    const mapEl = React.useRef<HTMLDivElement>(null);
    const [failed, setFailed] = React.useState(false);
    const max = Math.max(1, ...points.map((p) => p.value ?? 0));

    React.useEffect(() => {
      const el = mapEl.current;
      if (!el) return;
      let map: L.Map | undefined;
      let cancelled = false;
      import('leaflet')
        .then(async (mod) => {
          const leaflet =
            (mod as unknown as { default?: typeof L }).default ??
            (mod as typeof L);
          if (cancelled) return;
          const styles = getComputedStyle(el);
          const colour =
            styles.getPropertyValue('--mieweb-primary-500').trim() || '#27aae1';
          const line =
            styles.getPropertyValue('--mieweb-border').trim() || '#94a3b8';
          map = leaflet.map(el, {
            center,
            zoom,
            minZoom,
            maxZoom,
            scrollWheelZoom: false,
          });
          leaflet.tileLayer(tileUrl, { attribution }).addTo(map);
          if (outlineUrl) {
            const data = await fetch(outlineUrl)
              .then((r) => (r.ok ? r.json() : null))
              .catch(() => null);
            if (data && !cancelled && map)
              leaflet
                .geoJSON(data, {
                  style: { color: line, weight: 0.6, fillOpacity: 0 },
                })
                .addTo(map);
          }
          if (cancelled || !map) return;
          for (const p of points) {
            const radius =
              sizeBy === 'value' && p.value != null
                ? 6 + (p.value / max) * 22
                : 6;
            const marker = leaflet
              .circleMarker([p.lat, p.lng], {
                radius,
                color: colour,
                weight: 2,
                fillColor: colour,
                fillOpacity: 0.35,
              })
              .addTo(map);
            const text = [
              p.label,
              p.value != null ? String(p.value) : '',
              p.detail ?? '',
            ]
              .filter(Boolean)
              .join(' \u00b7 ');
            if (showValues && p.value != null)
              marker.bindTooltip(String(p.value), {
                permanent: true,
                direction: 'center',
                className: 'mie-map-value',
              });
            else marker.bindTooltip(text);
          }
        })
        .catch(() => setFailed(true));
      return () => {
        cancelled = true;
        map?.remove();
      };
      // Rebuild when the data changes; the view props only seed the map.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [points, tileUrl, attribution, outlineUrl, sizeBy, showValues]);

    return (
      <div
        ref={ref}
        data-slot="point-map"
        className={cn('w-full', className)}
        {...rest}
      >
        <div
          ref={mapEl}
          role="group"
          aria-roledescription="map"
          aria-label={label}
          className="bg-muted isolate w-full overflow-hidden rounded-xl"
          style={{ height }}
        >
          {failed && (
            <p className="text-muted-foreground flex h-full items-center justify-center p-4 text-center text-sm">
              {label}
            </p>
          )}
        </div>
        {!hideList && (
          <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs">
            {points.map((p) => (
              <li
                key={`${p.label}-${p.lat}-${p.lng}`}
                className="flex items-center gap-1.5"
              >
                <span
                  aria-hidden="true"
                  className="bg-primary-500 size-2 rounded-full"
                  style={{
                    opacity:
                      sizeBy === 'value' && p.value != null
                        ? 0.4 + (p.value / max) * 0.6
                        : 1,
                  }}
                />
                {p.label}
                {p.value != null && `: ${p.value}`}
                {p.detail && <span className="opacity-70"> · {p.detail}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
);
PointMap.displayName = 'PointMap';
