/**
 * Diarization Bench — DEV DIAGNOSTIC for mieweb/ui#492 (not a product screen).
 * Runs the legacy pipeline (`useDiarization`), Nemotron named by TitaNet, and Nemotron named by stored
 * Nemotron voiceprints on the same clip and shows comparable metrics. Shown as a story under
 * Voice › Speaker Scribe; nothing here is exported from the package.
 */
import * as React from 'react';
import { RecordButton } from '../../../RecordButton';
import { decodeTo16kMono } from '../../whisperTranscribe';
import { laneNames, type LaneFrames } from '../nemotron/attribution';
import {
  VARIANT_INFO,
  type ExecutionProvider,
  type ModelVariant,
} from '../nemotron/modelConfig';
import { runNemotron } from '../nemotron/runNemotron';
import { isUsableWith, loadNemotronVoiceprints } from '../nemotron/voiceprints';
import {
  useSpeakerVerify,
  type VoiceMatch,
} from '../SpeakerVerify/useSpeakerVerify';
import { SpeakerTimeline } from '../SpeakerTimeline';
import { DEFAULT_IDENTIFY_THRESHOLD, useDiarization } from '../useDiarization';
import {
  diarizationErrorRate,
  identification,
  longestSoloWindow,
  spansFromFrames,
  summarize,
  type DiarizationError,
  type DiarizationSummary,
  type IdentificationResult,
  type SpeakerSpan,
} from './compare';

const SAMPLE_RATE = 16000;
/** TitaNet needs about a second of one voice, as in `useDiarization`'s `minSegmentSeconds`. */
const MIN_IDENTIFY_SECONDS = 1;

interface PipelineResult {
  name: string;
  spans: SpeakerSpan[];
  summary: DiarizationSummary;
  error: DiarizationError | null;
  /** Needs reference labels that use the enrolled names. */
  identity: IdentificationResult | null;
  /** Model load (Nemotron only; the current pipeline's first run includes its own load). */
  loadMs: number | null;
  processingMs: number;
  /** TitaNet naming of Nemotron lanes (Nemotron + TitaNet only). */
  identifyMs: number | null;
  realTimeFactor: number;
}

interface Clip {
  blob: Blob;
  name: string;
}

function parseReference(text: string): SpeakerSpan[] | null {
  if (!text.trim()) return null;
  const parsed: unknown = JSON.parse(text);
  const valid =
    Array.isArray(parsed) &&
    parsed.every(
      (s) =>
        typeof s?.speaker === 'string' &&
        typeof s?.start === 'number' &&
        typeof s?.end === 'number' &&
        s.end > s.start
    );
  if (!valid)
    throw new Error(
      'Reference must be a JSON array of { "speaker": string, "start": seconds, "end": seconds }.'
    );
  return parsed as SpeakerSpan[];
}

function toResult({
  name,
  spans,
  reference,
  enrolled,
  durationSeconds,
  processingMs,
  loadMs = null,
  identifyMs = null,
}: {
  name: string;
  spans: SpeakerSpan[];
  reference: SpeakerSpan[] | null;
  enrolled: readonly string[];
  durationSeconds: number;
  processingMs: number;
  loadMs?: number | null;
  identifyMs?: number | null;
}): PipelineResult {
  return {
    name,
    spans,
    summary: summarize(spans),
    error: reference ? diarizationErrorRate(reference, spans) : null,
    identity:
      reference && enrolled.length
        ? identification(reference, spans, enrolled)
        : null,
    loadMs,
    processingMs,
    identifyMs,
    realTimeFactor: processingMs / 1000 / durationSeconds,
  };
}

/** Names Nemotron's anonymous lanes with TitaNet: each lane's longest solo stretch vs enrolled voices. */
function titaNetNames(
  frames: LaneFrames,
  samples: Float32Array,
  identify: (samples: Float32Array, sampleRate: number) => VoiceMatch | null
): string[] {
  const names = laneNames(frames, []);
  for (let lane = 0; lane < frames.numSpeakers; lane++) {
    const solo = longestSoloWindow(frames, lane);
    if (!solo || solo.end - solo.start < MIN_IDENTIFY_SECONDS) continue;
    const match = identify(
      samples.subarray(
        Math.floor(solo.start * SAMPLE_RATE),
        Math.ceil(solo.end * SAMPLE_RATE)
      ),
      SAMPLE_RATE
    );
    if (match && match.score >= DEFAULT_IDENTIFY_THRESHOLD)
      names[lane] = match.label;
  }
  return names;
}

const fmt = (n: number | null | undefined, digits = 2) =>
  n == null ? '—' : n.toFixed(digits);

function MetricsTable({
  results,
  expectedSpeakers,
}: {
  results: PipelineResult[];
  expectedSpeakers: number | null;
}) {
  const rows: [string, (r: PipelineResult) => string][] = [
    ['Speakers detected', (r) => String(r.summary.speakers)],
    [
      'Speaker-count error',
      (r) =>
        expectedSpeakers == null
          ? '—'
          : String(Math.abs(r.summary.speakers - expectedSpeakers)),
    ],
    ['Speech (s)', (r) => fmt(r.summary.speechSeconds)],
    ['Overlap detected (s)', (r) => fmt(r.summary.overlapSeconds)],
    ['Turns under 1 s', (r) => String(r.summary.shortTurns)],
    ['DER', (r) => fmt(r.error?.der, 3)],
    ['Missed (s)', (r) => fmt(r.error?.missed)],
    ['False alarm (s)', (r) => fmt(r.error?.falseAlarm)],
    ['Confusion (s)', (r) => fmt(r.error?.confusion)],
    ['Named correctly', (r) => String(r.identity?.correct ?? '—')],
    ['False accepts', (r) => String(r.identity?.falseAccept ?? '—')],
    ['Missed enrolled', (r) => String(r.identity?.missed ?? '—')],
    ['Model load (ms)', (r) => fmt(r.loadMs, 0)],
    ['Processing (ms)', (r) => fmt(r.processingMs, 0)],
    ['TitaNet naming (ms)', (r) => fmt(r.identifyMs, 0)],
    ['Real-time factor', (r) => fmt(r.realTimeFactor, 3)],
  ];
  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th scope="col" className="text-start">
            Metric
          </th>
          {results.map((r) => (
            <th key={r.name} scope="col" className="text-start">
              {r.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-border border-t">
            <th scope="row" className="py-1 text-start font-normal">
              {label}
            </th>
            {results.map((r) => (
              <td key={r.name} className="py-1 tabular-nums">
                {value(r)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function DiarizationBench() {
  const [clip, setClip] = React.useState<Clip | null>(null);
  const [expected, setExpected] = React.useState('');
  const [referenceText, setReferenceText] = React.useState('');
  const [variant, setVariant] = React.useState<ModelVariant>('model_quantized');
  const [backend, setBackend] = React.useState<ExecutionProvider>('wasm');
  const [stage, setStage] = React.useState('');
  const [duration, setDuration] = React.useState(0);
  const [results, setResults] = React.useState<PipelineResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  // Loads TitaNet and warms Whisper only once a clip is chosen, so opening the docs page downloads nothing.
  const current = useDiarization({ enabled: clip !== null });
  const sv = useSpeakerVerify({ enabled: clip !== null });
  const ready = current.ready && sv.ready;

  const variants = (Object.keys(VARIANT_INFO) as ModelVariant[]).filter((v) =>
    VARIANT_INFO[v].backends.includes(backend)
  );
  const busy = stage !== '';
  const expectedSpeakers = expected ? Number(expected) : null;

  const run = async () => {
    if (!clip) return;
    setError(null);
    setResults([]);
    try {
      const reference = parseReference(referenceText);
      setStage('Decoding audio');
      const samples = await decodeTo16kMono(clip.blob);
      const seconds = samples.length / SAMPLE_RATE;
      setDuration(seconds);
      const titaNetVoices = sv.listVoices().map((v) => v.label);
      const nemotronVoices = (await loadNemotronVoiceprints()).filter((p) =>
        isUsableWith(p, variant)
      );
      const model = `${VARIANT_INFO[variant].label}, ${backend}`;
      const options = {
        variant,
        executionProvider: backend,
        streamingMode: 'offline',
      } as const;

      // Sequential, so the pipelines don't compete for the CPU and skew each other's timings.
      setStage('Current pipeline');
      const started = performance.now();
      const segments = await current.diarize(clip.blob);
      const next = [
        toResult({
          name: 'Current (Whisper + TitaNet)',
          spans: segments.map(({ speaker, start, end }) => ({
            speaker,
            start,
            end,
          })),
          reference,
          enrolled: titaNetVoices,
          durationSeconds: seconds,
          processingMs: performance.now() - started,
        }),
      ];

      const anonymous = await runNemotron(samples, options, setStage);
      setStage('Naming lanes with TitaNet');
      const identifyStarted = performance.now();
      const titaNetLaneNames = titaNetNames(anonymous, samples, sv.identify);
      next.push(
        toResult({
          name: `Nemotron + TitaNet (${model})`,
          spans: spansFromFrames(
            anonymous.probabilities,
            anonymous.numSpeakers,
            anonymous.frameDurationSeconds,
            { names: titaNetLaneNames }
          ),
          reference,
          enrolled: titaNetVoices,
          durationSeconds: seconds,
          processingMs: anonymous.inferenceMs,
          loadMs: anonymous.loadMs,
          identifyMs: performance.now() - identifyStarted,
        })
      );

      if (nemotronVoices.length > 0) {
        const enrolled = nemotronVoices.map((p) => p.name);
        const seeded = await runNemotron(
          samples,
          { ...options, voiceprints: nemotronVoices.map((p) => p.embeds) },
          setStage
        );
        next.push(
          toResult({
            name: `Nemotron + voiceprints (${model})`,
            spans: spansFromFrames(
              seeded.probabilities,
              seeded.numSpeakers,
              seeded.frameDurationSeconds,
              { names: laneNames(seeded, enrolled) }
            ),
            reference,
            enrolled,
            durationSeconds: seconds,
            processingMs: seeded.inferenceMs,
            loadMs: seeded.loadMs,
          })
        );
      }
      setResults(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStage('');
    }
  };

  const copyResults = () => {
    const report = {
      clip: clip?.name,
      durationSeconds: duration,
      expectedSpeakers,
      userAgent: navigator.userAgent,
      results: results.map((r) => ({ ...r, spans: undefined })),
    };
    void navigator.clipboard.writeText(JSON.stringify(report, null, 2));
  };

  return (
    <div className="w-[720px] max-w-full space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Audio clip
          <input
            type="file"
            accept="audio/*"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setClip({ blob: file, name: file.name });
            }}
          />
        </label>
        <div className="flex items-center gap-2 text-sm">
          or record
          <RecordButton
            size="sm"
            disabled={busy}
            aria-label="Record a clip"
            onRecordingComplete={(blob) =>
              setClip({ blob, name: `recording-${new Date().toISOString()}` })
            }
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          Expected speakers
          <input
            type="number"
            min={1}
            max={8}
            value={expected}
            onChange={(e) => setExpected(e.target.value)}
            className="border-input w-24 rounded border px-2 py-1"
          />
        </label>
        <label className="flex flex-col gap-1">
          Backend
          <select
            value={backend}
            disabled={busy}
            onChange={(e) => {
              const next = e.target.value as ExecutionProvider;
              setBackend(next);
              if (!VARIANT_INFO[variant].backends.includes(next))
                setVariant('model');
            }}
            className="border-input rounded border px-2 py-1"
          >
            <option value="wasm">WASM (CPU)</option>
            <option value="webgpu">WebGPU</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Nemotron model
          <select
            value={variant}
            disabled={busy}
            onChange={(e) => setVariant(e.target.value as ModelVariant)}
            className="border-input rounded border px-2 py-1"
          >
            {variants.map((v) => (
              <option key={v} value={v}>
                {VARIANT_INFO[v].label} (~{VARIANT_INFO[v].sizeMb} MB)
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        Reference labels (optional JSON, for DER)
        <textarea
          rows={3}
          value={referenceText}
          onChange={(e) => setReferenceText(e.target.value)}
          placeholder='[{ "speaker": "A", "start": 0, "end": 4.2 }, { "speaker": "B", "start": 3.8, "end": 7 }]'
          className="border-input rounded border px-2 py-1 font-mono text-xs"
        />
      </label>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void run()}
          disabled={!clip || busy || !ready}
          className="bg-primary text-primary-foreground rounded px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Run all
        </button>
        {results.length > 0 && (
          <button
            type="button"
            onClick={copyResults}
            className="border-input rounded border px-3 py-1.5 text-sm"
          >
            Copy results (JSON)
          </button>
        )}
        <span role="status" className="text-muted-foreground text-sm">
          {clip && !ready
            ? 'Loading the current pipeline…'
            : stage
              ? `${stage}…`
              : clip
                ? clip.name
                : 'Choose or record a clip'}
        </span>
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <>
          <MetricsTable results={results} expectedSpeakers={expectedSpeakers} />
          {results.map((r) => (
            <SpeakerTimeline
              key={r.name}
              label={r.name}
              spans={r.spans}
              duration={duration}
            />
          ))}
        </>
      )}
    </div>
  );
}
