/**
 * SpeakerScribe: experimental Nemotron successor to VisitScribe (mieweb/ui#492).
 *
 * Enroll voices with Nemotron, record or drop a clip, and review the overlap-aware, speaker-labelled
 * result in `TranscriptPlayer`. Speakers can be renamed, merged and reassigned per line. All
 * on-device; audio never leaves the page. Not exported from the package yet.
 */
import * as React from 'react';
import { cn } from '../../../utils/cn';
import { Badge } from '../../Badge';
import { Button } from '../../Button';
import { Input } from '../../Input';
import { RecordButton } from '../../RecordButton';
import { applySpeakerEdits } from './speakerEdits';
import { formatClock } from './TranscriptPlayer/model';
import { TranscriptPlayer } from './TranscriptPlayer/TranscriptPlayer';
import {
  MIN_ENROLL_SECONDS,
  useNemotronDiarization,
} from './useNemotronDiarization';

export interface SpeakerScribeProps {
  title?: string;
  subtitle?: string;
  /** Isolates enrolled voices per user; pass the signed-in user's id. */
  voiceprintNamespace?: string;
  className?: string;
}

/** Record with the mic or pick an audio file; both hand back a Blob. */
function ClipPicker({
  label,
  disabled,
  recording,
  onRecordingChange,
  onPick,
}: {
  label: string;
  disabled: boolean;
  /** This picker is recording, so its Stop must stay usable. */
  recording: boolean;
  onRecordingChange: (recording: boolean) => void;
  onPick: (blob: Blob) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <RecordButton
        size="sm"
        disabled={disabled && !recording}
        aria-label={recording ? `Stop recording ${label}` : `Record ${label}`}
        onRecordingStart={() => onRecordingChange(true)}
        onRecordingError={() => onRecordingChange(false)}
        onRecordingComplete={(blob) => {
          onRecordingChange(false);
          onPick(blob);
        }}
      />
      <label className="text-muted-foreground flex items-center gap-2">
        or upload
        <input
          type="file"
          accept="audio/*"
          disabled={disabled || recording}
          aria-label={`Upload ${label}`}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            // A plain Blob, like a recording: only the audio is used, never the file name.
            if (file) onPick(new Blob([file], { type: file.type }));
          }}
        />
      </label>
    </div>
  );
}

/** Enroll voices, analyze a clip, and correct the labelled transcript. */
export function SpeakerScribe(props: SpeakerScribeProps) {
  // A different user starts from a clean slate: no clips or results carry over.
  return <ScribeSession key={props.voiceprintNamespace ?? ''} {...props} />;
}

function ScribeSession({
  title = 'Speaker Scribe',
  subtitle = 'Overlap-aware, on-device speaker labels with Nemotron 3 Diarization.',
  voiceprintNamespace,
  className,
}: SpeakerScribeProps) {
  const nemo = useNemotronDiarization({ voiceprintNamespace });

  const [voiceName, setVoiceName] = React.useState('');
  const [clip, setClip] = React.useState<Blob | null>(null);
  /** The clip behind `nemo.result`, which `clip` runs ahead of while analysing. */
  const [resultClip, setResultClip] = React.useState<Blob | null>(null);
  /** Which picker is recording; everything else waits until it stops. */
  const [recording, setRecording] = React.useState<'voice' | 'clip' | null>(
    null
  );
  const busy = nemo.busy || recording !== null;
  const recordingProps = (picker: 'voice' | 'clip') => ({
    recording: recording === picker,
    onRecordingChange: (on: boolean) => setRecording(on ? picker : null),
  });

  const analyze = async (blob: Blob) => {
    setClip(blob);
    try {
      await nemo.diarize(blob);
      setResultClip(blob);
    } catch {
      /* surfaced through `nemo.error` */
    }
  };

  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!resultClip) return;
    const url = URL.createObjectURL(resultClip);
    setAudioUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [resultClip]);

  const enroll = async (blob: Blob) => {
    try {
      await nemo.enroll(voiceName, blob);
      setVoiceName('');
    } catch {
      /* surfaced through `nemo.error` */
    }
  };

  // Corrections: rename by speaker id (two speakers with one name = merge) and per-line reassignment.
  const result = nemo.result;
  const [names, setNames] = React.useState<Record<string, string>>({});
  const [lineSpeaker, setLineSpeaker] = React.useState<Record<number, string>>(
    {}
  );
  const [editing, setEditing] = React.useState(false);
  React.useEffect(() => {
    setNames({});
    setLineSpeaker({});
    setEditing(false);
  }, [result]);

  const transcript = React.useMemo(
    () => result && applySpeakerEdits(result.transcript, names, lineSpeaker),
    [result, names, lineSpeaker]
  );
  const lines = transcript?.segments ?? [];
  const speakers = transcript?.speakers ?? [];

  const error = nemo.error;
  const status = nemo.busy
    ? `${nemo.stage || 'Working'}…`
    : recording
      ? 'Recording…'
      : error
        ? error
        : transcript
          ? `${lines.length} line${lines.length === 1 ? '' : 's'} · ${speakers.length} speaker${speakers.length === 1 ? '' : 's'}`
          : 'Enroll voices (optional), then record or upload a clip.';

  return (
    <div
      className={cn(
        'bg-background text-foreground mx-auto flex max-w-5xl flex-col gap-5 p-6',
        className
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{subtitle}</p>
      </div>

      <section aria-labelledby="speaker-scribe-voices" className="space-y-2">
        <h2 id="speaker-scribe-voices" className="text-sm font-semibold">
          Enrolled voices
        </h2>
        {nemo.voices.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            None yet. Unenrolled people show as “Speaker N”.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {nemo.voices.map((voice) => (
              <li key={voice.name}>
                <Badge
                  variant={voice.usable ? 'default' : 'secondary'}
                  onRemove={() =>
                    void nemo.removeVoice(voice.name).catch(() => {})
                  }
                  removeLabel={`Remove ${voice.name}`}
                  removeDisabled={busy}
                >
                  {voice.name}
                  {!voice.usable && ' (other model: re-enroll)'}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <Input
            label="Name"
            value={voiceName}
            onChange={(e) => setVoiceName(e.target.value)}
            placeholder="Dr. Smith"
            className="w-48"
          />
          <ClipPicker
            label={`a ${MIN_ENROLL_SECONDS}+ second voice sample`}
            disabled={busy || !voiceName.trim()}
            {...recordingProps('voice')}
            onPick={(blob) => void enroll(blob)}
          />
        </div>
        <p className="text-muted-foreground text-xs">
          Record at least {MIN_ENROLL_SECONDS} seconds of one person talking.
          Enrolling an existing name replaces it.
        </p>
      </section>

      <section aria-labelledby="speaker-scribe-clip" className="space-y-3">
        <h2 id="speaker-scribe-clip" className="text-sm font-semibold">
          Clip
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <ClipPicker
            label="a clip to analyze"
            disabled={busy}
            {...recordingProps('clip')}
            onPick={(blob) => void analyze(blob)}
          />
          {clip && (
            <Button
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void analyze(clip)}
            >
              Re-analyze
            </Button>
          )}
        </div>
      </section>

      <p
        role="status"
        className={cn(
          'text-[13px]',
          error && !busy ? 'text-destructive' : 'text-muted-foreground'
        )}
      >
        {status}
      </p>

      {result && transcript && (
        <section aria-labelledby="speaker-scribe-result" className="space-y-3">
          <div className="flex items-center gap-3">
            <h2 id="speaker-scribe-result" className="text-sm font-semibold">
              Result
            </h2>
            {lines.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                aria-expanded={editing}
                onClick={() => setEditing((v) => !v)}
              >
                {editing ? 'Done' : 'Edit speakers'}
              </Button>
            )}
          </div>
          {editing && (
            <div className="border-border space-y-3 rounded-xl border p-3">
              <p className="text-muted-foreground text-xs">
                Rename a speaker, or give two speakers the same name to merge
                them. Change a line&apos;s speaker to move it.
              </p>
              <div className="flex flex-wrap gap-2">
                {result.transcript.speakers?.map((speaker) => (
                  <Input
                    key={speaker.id}
                    label={`Rename ${speaker.name ?? speaker.id}`}
                    hideLabel
                    value={names[speaker.id] ?? speaker.name ?? ''}
                    onChange={(e) =>
                      setNames((n) => ({ ...n, [speaker.id]: e.target.value }))
                    }
                    className="w-36"
                  />
                ))}
              </div>
              <ol className="divide-border max-h-64 divide-y overflow-y-auto">
                {lines.map((line, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-2 py-1.5 text-xs"
                  >
                    <select
                      aria-label={`Speaker for the line at ${formatClock(line.startMs / 1000)}`}
                      value={line.speakerId}
                      onChange={(e) =>
                        setLineSpeaker((l) => ({ ...l, [i]: e.target.value }))
                      }
                      className="border-border bg-background text-foreground w-32 shrink-0 rounded-md border px-1 py-0.5 font-semibold"
                    >
                      {speakers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <span className="text-muted-foreground w-10 shrink-0 tabular-nums">
                      {formatClock(line.startMs / 1000)}
                    </span>
                    <span className="truncate">{line.text}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          <TranscriptPlayer
            src={audioUrl}
            transcript={transcript}
            peaks={result.peaks}
          />
        </section>
      )}
    </div>
  );
}
