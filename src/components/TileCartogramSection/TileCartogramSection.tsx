import * as React from 'react';
import { cn } from '../../utils/cn';
import {
  SectionShell,
  cardClass,
  headingTextClass,
  mutedTextClass,
} from '../../templates/Section';
import type { SectionBaseProps } from '../../templates/types';
import type {
  MetricStatus,
  MetricStatusLabels,
} from '../MetricStatusBadge/MetricStatusBadge';
import { usStateTiles, type TileBucket, type TilePosition } from './tiles';

export interface TileValue {
  bucket: TileBucket;
  /** Read out with the tile's name, e.g. `12.4 providers per 100k`. */
  detail?: string;
}

export interface TileLegendEntry {
  bucket: TileBucket;
  label: string;
}

export interface TileCartogramSectionProps extends Omit<
  SectionBaseProps,
  'align'
> {
  /** Values keyed by tile code. Tiles with no entry render as bucket 0. */
  values: Record<string, TileValue>;
  legend: TileLegendEntry[];
  /** Tile positions; defaults to `usStateTiles`. */
  layout?: TilePosition[];
  /** Heading of the map card. */
  mapTitle?: string;
  mapDescription?: string;
  status?: MetricStatus;
  /** Translated text for the `status` badge. */
  statusLabels?: MetricStatusLabels;
}

// 0 is "no data"; 1–4 step up the primary scale.
const bucketClass: Record<TileBucket, string> = {
  0: 'bg-muted text-muted-foreground',
  1: 'bg-primary-600/20 text-foreground',
  2: 'bg-primary-600/40 text-foreground',
  3: 'bg-primary-800 text-white',
  4: 'bg-primary-950 text-white',
};

/**
 * A tile-grid map: every region the same size, shaded by bucket, so small
 * states are as visible as large ones. Each tile is a list item that reads its
 * full name and detail to screen readers.
 */
export const TileCartogramSection = React.forwardRef<
  HTMLElement,
  TileCartogramSectionProps
>(
  (
    {
      values,
      legend,
      layout = usStateTiles,
      mapTitle,
      mapDescription,
      tone = 'default',
      components,
      ...rest
    },
    ref
  ) => {
    const columns = Math.max(...layout.map((t) => t.col)) + 1;
    return (
      <SectionShell
        ref={ref}
        data-slot="tile-cartogram-section"
        tone={tone}
        components={components}
        {...rest}
      >
        <div className={cn('mt-10 rounded-2xl p-6', cardClass(tone))}>
          {mapTitle && (
            <h3 className={cn('text-lg font-semibold', headingTextClass(tone))}>
              {mapTitle}
            </h3>
          )}
          {mapDescription && (
            <p className={cn('mt-1 text-sm', mutedTextClass(tone))}>
              {mapDescription}
            </p>
          )}
          <ul
            className="mx-auto mt-6 grid w-full max-w-xl gap-1"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            }}
          >
            {layout.map((tile) => {
              const value = values[tile.code];
              const bucket = value?.bucket ?? 0;
              return (
                <li
                  key={tile.code}
                  title={
                    value?.detail ? `${tile.name}: ${value.detail}` : tile.name
                  }
                  style={{
                    gridColumnStart: tile.col + 1,
                    gridRowStart: tile.row + 1,
                  }}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-md text-[9px] font-semibold sm:text-[11px]',
                    bucketClass[bucket]
                  )}
                >
                  <span aria-hidden="true">{tile.code}</span>
                  <span className="sr-only">
                    {tile.name}
                    {value?.detail ? `: ${value.detail}` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            {legend.map((entry) => (
              <li
                key={entry.bucket}
                className="inline-flex items-center gap-1.5"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'ring-border size-3 rounded ring-1',
                    bucketClass[entry.bucket]
                  )}
                />
                {entry.label}
              </li>
            ))}
          </ul>
        </div>
      </SectionShell>
    );
  }
);
TileCartogramSection.displayName = 'TileCartogramSection';
