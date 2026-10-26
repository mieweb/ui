import * as React from 'react';
import type { SpeakerSpan } from './nemotron/attribution';

const laneColor = (index: number) => `hsl(${(index * 67) % 360} 65% 50%)`;

export interface SpeakerTimelineProps {
  label: string;
  spans: readonly SpeakerSpan[];
  /** Seconds the timeline covers. */
  duration: number;
}

/** One row per speaker with their active stretches; overlap shows as bars stacked in time. */
export function SpeakerTimeline({
  label,
  spans,
  duration,
}: SpeakerTimelineProps) {
  const speakers = [...new Set(spans.map((s) => s.speaker))];
  if (duration <= 0) return null;
  return (
    <figure className="space-y-1">
      <figcaption className="text-sm font-medium">{label}</figcaption>
      {speakers.map((speaker, i) => (
        <div key={speaker} className="flex items-center gap-2">
          <span className="text-muted-foreground w-24 shrink-0 truncate text-xs">
            {speaker}
          </span>
          <div
            className="bg-muted relative h-4 flex-1 rounded"
            role="img"
            aria-label={`${speaker} activity`}
          >
            {spans
              .filter((s) => s.speaker === speaker)
              .map((s, k) => (
                <span
                  key={k}
                  className="absolute inset-y-0 rounded"
                  style={{
                    insetInlineStart: `${(s.start / duration) * 100}%`,
                    width: `${((s.end - s.start) / duration) * 100}%`,
                    backgroundColor: laneColor(i),
                  }}
                />
              ))}
          </div>
        </div>
      ))}
    </figure>
  );
}
