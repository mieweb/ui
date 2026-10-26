import * as React from 'react';
import { Checkbox } from '../../../Checkbox/Checkbox';
import type { TranscriptPlayerLabels } from './labels';
import { type PlayerSpeaker } from './model';

export interface SpeakerPanelProps {
  speakers: readonly PlayerSpeaker[];
  talkTime: ReadonlyMap<string, number>;
  /** Recording length in seconds, the base for each speaker's share. */
  duration: number;
  hidden: ReadonlySet<string>;
  onToggle: (speakerId: string) => void;
  /** Shown when speakers overlap, since shares then add up to more than 100%. */
  overlapping: boolean;
  labels: TranscriptPlayerLabels;
}

/** Each speaker's colour, talk time and share of the recording, with a show/hide toggle. */
export function SpeakerPanel({
  speakers,
  talkTime,
  duration,
  hidden,
  onToggle,
  overlapping,
  labels,
}: SpeakerPanelProps) {
  const headingId = React.useId();
  return (
    <section
      aria-labelledby={headingId}
      className="border-border bg-card text-card-foreground rounded-xl border p-4"
    >
      <h3 id={headingId} className="mb-3 text-sm font-semibold">
        {labels.speakers}
      </h3>
      {speakers.length === 0 ? (
        <p className="text-muted-foreground text-sm">{labels.noSpeakers}</p>
      ) : (
        <ul className="space-y-2.5">
          {speakers.map((speaker) => {
            const seconds = talkTime.get(speaker.id) ?? 0;
            const share =
              duration > 0 ? Math.round((seconds / duration) * 100) : 0;
            return (
              <li key={speaker.id} className="flex items-center gap-2 text-sm">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: speaker.color }}
                />
                <Checkbox
                  size="sm"
                  label={speaker.name}
                  checked={!hidden.has(speaker.id)}
                  onChange={() => onToggle(speaker.id)}
                  className="shrink-0"
                />
                <span className="text-muted-foreground ms-auto tabular-nums">
                  {labels.formatDuration(seconds)}
                </span>
                <span className="text-muted-foreground w-10 text-end tabular-nums">
                  {share}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {overlapping && (
        <p className="text-muted-foreground mt-3 text-xs">
          {labels.overlapNote}
        </p>
      )}
    </section>
  );
}
