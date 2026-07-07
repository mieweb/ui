/**
 * VisitScribe — the ambient-visit surface: record a multi-person encounter → on-device speaker-labeled
 * transcript (doctor / patient / nurse). The product-facing counterpart to the diarization dev diagnostic.
 *
 * Records the room (no wake word), and on stop runs `useVisitScribe` → `useDiarization` to segment,
 * cluster speakers, and name anyone enrolled in Voice Manager (unknowns show as "Speaker N", or
 * AI-inferred roles when the toggle is on and a chat backend is configured). All on-device.
 *
 * With "Live transcript" on, a rough running transcript appears while recording (no speaker labels — those
 * need the full clip); the clean labeled transcript replaces it on stop.
 */
import * as React from 'react';
import { cn } from '../../../utils/cn';
import { Button } from '../../Button';
import { switchTrackVariants, switchThumbVariants } from '../../Switch';
import { useVisitScribe, type UseVisitScribeOptions } from './useVisitScribe';

export interface VisitScribeProps {
  /** Heading. */
  title?: string;
  /** Sub-heading under the title. */
  subtitle?: string;
  /** Initial state of the "label unknown speakers with AI" toggle. Default false. */
  inferRoles?: boolean;
  /** Initial state of the "live transcript" toggle. Default false. */
  liveTranscript?: boolean;
  /** Diarization tuning passthrough (threshold, maxSpeakers, identifyThreshold, merge). */
  diarizationOptions?: Omit<UseVisitScribeOptions, 'inferRoles' | 'liveTranscript'>;
  className?: string;
}

/** Distinct speakers → a stable colour, so turns are easy to tell apart at a glance. */
const SPEAKER_COLORS = [
  'text-ozwell',
  'text-emerald-600 dark:text-emerald-400',
  'text-violet-600 dark:text-violet-400',
  'text-amber-600 dark:text-amber-400',
  'text-rose-600 dark:text-rose-400',
  'text-cyan-600 dark:text-cyan-400',
];

function mmss(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** A small inline switch row (label + design-system switch visual), used for the two settings. */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="text-muted-foreground flex items-center gap-2 text-sm focus:outline-none"
    >
      <span
        aria-hidden="true"
        data-state={checked ? 'checked' : 'unchecked'}
        className={cn(switchTrackVariants({ size: 'sm' }), 'items-center')}
      >
        <span data-state={checked ? 'checked' : 'unchecked'} className={switchThumbVariants({ size: 'sm' })} />
      </span>
      {label}
    </button>
  );
}

/** Record a visit → speaker-labeled transcript, on-device. */
export function VisitScribe({
  title = 'Visit Scribe',
  subtitle = 'Record the visit — Ozwell writes a speaker-labeled transcript, on-device.',
  inferRoles: inferRolesProp = false,
  liveTranscript: liveTranscriptProp = false,
  diarizationOptions,
  className,
}: VisitScribeProps) {
  const [inferRoles, setInferRoles] = React.useState(inferRolesProp);
  const [live, setLive] = React.useState(liveTranscriptProp);
  // Diarization tuning — kept behind an "Advanced" disclosure so the default view is clean (Auto). The
  // defaults (0.65 merge, auto speaker count) handle the common case; the knobs are for when auto misfires.
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [threshold, setThreshold] = React.useState(diarizationOptions?.threshold ?? 0.65);
  const [maxSpeakers, setMaxSpeakers] = React.useState<number | undefined>(diarizationOptions?.maxSpeakers);
  const scribe = useVisitScribe({
    ...diarizationOptions,
    inferRoles,
    liveTranscript: live,
    threshold,
    maxSpeakers,
  });
  const { ready, recording, busy, error, result, liveText, elapsedMs, canReanalyze } = scribe;

  // Stable speaker → colour map, in order of first appearance.
  const speakerColor = React.useMemo(() => {
    const map = new Map<string, string>();
    result?.forEach((t) => {
      if (!map.has(t.speaker)) map.set(t.speaker, SPEAKER_COLORS[map.size % SPEAKER_COLORS.length]);
    });
    return map;
  }, [result]);
  const speakerCount = speakerColor.size;

  const status = !ready
    ? 'Loading the speaker model…'
    : recording
      ? 'Listening to the room…'
      : busy
        ? 'Writing the transcript…'
        : error
          ? error
          : result
            ? `${result.length} turn${result.length === 1 ? '' : 's'} · ${speakerCount} speaker${speakerCount === 1 ? '' : 's'}`
            : 'Ready';

  // While recording with live on, show the rough running transcript; once stopped, the diarized result.
  const showLive = recording && live;

  return (
    <div
      className={cn(
        'bg-background text-foreground mx-auto flex max-w-[680px] flex-col gap-5 p-6',
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
      </div>

      {/* Record control + toggles */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {recording ? (
          <Button variant="danger" onClick={scribe.stop}>
            <span className="mr-2 inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
            Stop · {mmss(elapsedMs)}
          </Button>
        ) : (
          <Button onClick={() => void scribe.start()} disabled={!ready || busy}>
            {busy ? 'Writing…' : result ? 'New visit' : 'Start visit'}
          </Button>
        )}
        <Toggle checked={live} onChange={setLive} label="Live transcript" />
        <Toggle checked={inferRoles} onChange={setInferRoles} label="Label unknown speakers with AI" />
      </div>

      {/* Advanced disclosure: diarization tuning. Hidden by default — Auto handles the common case; open
          this only when auto over/under-splits, then Re-analyze the same clip (no re-record). */}
      <button
        type="button"
        aria-expanded={showAdvanced}
        onClick={() => setShowAdvanced((v) => !v)}
        className="text-muted-foreground hover:text-foreground -mt-2 w-fit text-xs focus:outline-none"
      >
        <span aria-hidden="true" className="inline-block transition-transform" style={{ transform: showAdvanced ? 'rotate(90deg)' : 'none' }}>▸</span>{' '}
        Advanced
      </button>
      {showAdvanced && (
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <label className="flex items-center gap-2">
          Speakers
          <select
            value={maxSpeakers ?? ''}
            onChange={(e) => setMaxSpeakers(e.target.value ? Number(e.target.value) : undefined)}
            className="border-border bg-background text-foreground rounded-md border px-2 py-1"
          >
            <option value="">Auto</option>
            {[2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Merge
          <input
            type="range"
            min={0.45}
            max={0.85}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="accent-ozwell"
          />
          <span className="tabular-nums">{threshold.toFixed(2)}</span>
          <span className="text-xs">(higher = fewer speakers)</span>
        </label>
        {canReanalyze && (
          <Button variant="outline" size="sm" onClick={scribe.reanalyze} disabled={busy}>
            Re-analyze
          </Button>
        )}
      </div>
      )}

      {/* Status line */}
      <div className={cn('text-[13px]', error ? 'text-destructive' : 'text-muted-foreground')}>
        {recording && (
          <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500 align-middle" aria-hidden="true" />
        )}
        {status}
      </div>

      {/* Live rough transcript (while recording) */}
      {showLive && (
        <div className="border-border bg-muted/40 rounded-xl border p-3">
          <div className="text-muted-foreground mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" aria-hidden="true" />
            Live · rough
          </div>
          <div className="text-foreground text-sm">
            {liveText || <span className="text-muted-foreground">Listening…</span>}
          </div>
        </div>
      )}

      {/* Final speaker-labeled transcript */}
      {!showLive && result && result.length > 0 && (
        <div className="border-border divide-border divide-y rounded-xl border">
          {result.map((turn, i) => (
            <div key={i} className="p-3">
              <div className={cn('text-xs font-semibold', speakerColor.get(turn.speaker) ?? 'text-ozwell')}>
                {turn.speaker}{' '}
                <span className="text-muted-foreground font-normal">· {turn.start.toFixed(1)}s</span>
              </div>
              <div className="text-foreground mt-0.5 text-sm">{turn.text}</div>
            </div>
          ))}
        </div>
      )}
      {!showLive && result && result.length === 0 && !busy && (
        <div className="text-muted-foreground rounded-xl border border-dashed border-border p-4 text-center text-sm">
          No speech detected — try recording again.
        </div>
      )}
    </div>
  );
}
