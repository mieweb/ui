/**
 * VoiceManager — the central "your voice" page (mieweb/ui#287).
 *
 * One home for voice enrollment: set up your voice, add another authorized voice (an assistant, or you
 * under a new condition), view your enrolled voices, rename or remove them, or clear everything. A real
 * exported surface built on `useSpeakerVerify` + `<VoiceSetup>` — not story-only code. Styled with the
 * design-system tokens + shared <Button> so it tracks theme + dark mode; the Ozwell accent is the
 * `ozwell` brand token.
 *
 * Voices are keyed by id in the speaker runtime (WHO); removing one revokes that person. The WHAT
 * phrase-prints are shared/speaker-independent, so they're left in place on per-voice removal.
 */
import * as React from 'react';
import { cn } from '../../../utils/cn';
import { Button } from '../../Button';
import { inputVariants } from '../../Input';
import { AlertDialog } from '../../AlertDialog';
import { useSpeakerVerify } from './SpeakerVerify/useSpeakerVerify';
import { clearWhatPrints } from '../voiceprintStore';
import { VoiceSetup } from './VoiceSetup';

const OZ = 'var(--mieweb-ozwell, #0BA0E0)';
/** Ozwell-accent fill for <Button> (overrides the primary variant's bg/text via tailwind-merge). */
const ozBtn = 'bg-ozwell hover:bg-ozwell active:bg-ozwell text-ozwell-foreground hover:brightness-95 active:brightness-90';
/** Soft destructive for repeated row actions (Remove): red text + border, transparent fill. The solid
 *  danger variant stays for the one-off "Clear all". */
const dangerOutline = 'border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive';

export interface VoiceManagerProps {
  /** Octopus logo source, forwarded to the enrollment screen. */
  logoSrc?: string;
}

interface SetupTarget {
  mode: 'enroll' | 'add';
  voiceId: string;
  label: string;
}

/** The central voice-enrollment management page. */
export function VoiceManager({ logoSrc }: VoiceManagerProps) {
  const sv = useSpeakerVerify();
  const [inSetup, setInSetup] = React.useState<SetupTarget | null>(null);
  const [, setTick] = React.useState(0); // bump to force a re-read of the voice list after enroll/remove/clear
  const [addName, setAddName] = React.useState('');
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editLabel, setEditLabel] = React.useState('');
  // Pending destructive confirmation (deleting a voiceprint is hard to undo + changes who's authorized).
  const [confirm, setConfirm] = React.useState<{ type: 'remove'; id: string; label: string } | { type: 'clearAll' } | null>(null);

  // listVoices reads the store synchronously (cheap, in-memory) — read on every render so it reflects the
  // latest after enroll / remove / rename / clear (each of those bumps state, re-rendering this).
  const voices = sv.ready ? sv.listVoices() : [];

  if (inSetup) {
    return (
      <VoiceSetup
        mode={inSetup.mode}
        voiceId={inSetup.voiceId}
        label={inSetup.label}
        logoSrc={logoSrc}
        onDone={() => {
          setTick((t) => t + 1);
          setInSetup(null);
        }}
        onCancel={() => setInSetup(null)}
      />
    );
  }

  const startFresh = () => setInSetup({ mode: 'enroll', voiceId: 'you', label: 'You' });
  const startAdd = () => {
    const name = addName.trim() || 'New voice';
    const id = `voice-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
    setAddName('');
    setInSetup({ mode: 'add', voiceId: id, label: name });
  };
  const remove = (id: string) => {
    sv.removeVoice(id);
    setTick((t) => t + 1);
  };
  const saveRename = (id: string) => {
    const l = editLabel.trim();
    if (l) sv.renameVoice(id, l);
    setEditingId(null);
    setTick((t) => t + 1);
  };
  const clearAll = () => {
    sv.clear();
    void clearWhatPrints();
    setTick((t) => t + 1);
  };

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <img
        src={logoSrc ?? '/ozwell/icon.svg'}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="mb-[18px] h-[86px] w-[84px]"
        style={{ filter: `drop-shadow(0 8px 24px color-mix(in srgb, ${OZ} 33%, transparent))` }}
      />
      <h1 className="text-foreground text-3xl font-bold tracking-tight">Your voice</h1>

      {!sv.ready && !sv.error && <div className="text-muted-foreground mt-4 font-mono text-[13px]">Loading…</div>}
      {sv.error && (
        <div className="text-destructive mt-4 text-[13px]">Couldn’t load the voice models — check the console.</div>
      )}

      {sv.ready && voices.length === 0 && (
        <>
          <p className="text-muted-foreground mt-2.5 max-w-[440px] leading-relaxed">
            Set up your voice so Ozwell only responds to you. You can add an assistant or extra conditions
            afterward.
          </p>
          <Button className={cn(ozBtn, 'mt-7')} onClick={startFresh}>
            Set up your voice
          </Button>
        </>
      )}

      {sv.ready && voices.length > 0 && (
        <>
          <p className="text-muted-foreground mt-2 text-[14.5px]">
            Voices Ozwell will respond to. Add an assistant or another condition, rename, or remove.
          </p>

          <div className="mt-[22px] flex w-full max-w-[460px] flex-col gap-2.5">
            {voices.map((v) => (
              <div
                key={v.id}
                className="border-border bg-card flex items-center gap-3 rounded-2xl border px-4 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  {editingId === v.id ? (
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(v.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className={cn(inputVariants({ size: 'sm' }), 'font-semibold')}
                      aria-label="Voice name"
                    />
                  ) : (
                    <div className="text-foreground truncate font-semibold">{v.label}</div>
                  )}
                  <div className="text-muted-foreground mt-0.5 text-xs">
                    {v.conditions} condition{v.conditions === 1 ? '' : 's'}
                  </div>
                </div>
                {editingId === v.id ? (
                  <>
                    <Button size="sm" className={ozBtn} onClick={() => saveRename(v.id)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-ozwell"
                      onClick={() => { setEditingId(v.id); setEditLabel(v.label); }}
                    >
                      Rename
                    </Button>
                    <Button size="sm" variant="outline" className={dangerOutline} onClick={() => setConfirm({ type: 'remove', id: v.id, label: v.label })}>Remove</Button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add a voice — name it, then enroll (an assistant, or you under a new condition) */}
          <div className="mt-[18px] flex w-full max-w-[460px] gap-2">
            <input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') startAdd(); }}
              placeholder="Name a voice — an assistant, you in a mask…"
              aria-label="New voice name"
              className={cn(inputVariants({ size: 'sm' }), 'flex-1')}
            />
            <Button size="sm" className={ozBtn} onClick={startAdd}>Add a voice</Button>
          </div>

          <Button size="sm" variant="danger" className="mt-[18px]" onClick={() => setConfirm({ type: 'clearAll' })}>
            Clear all voices
          </Button>
        </>
      )}

      <p className="text-muted-foreground mt-[26px] text-[12.5px]">
        Voiceprints stay on your device — they’re never uploaded.
      </p>

      {/* Only render while there's a pending confirmation, so no empty-label title (Remove “”?) is ever
          computed into the dialog's DOM/ARIA props. */}
      {confirm && (
        <AlertDialog
          open
          onOpenChange={(o) => { if (!o) setConfirm(null); }}
          variant="destructive"
          title={confirm.type === 'clearAll' ? 'Clear all voices?' : `Remove “${confirm.label}”?`}
          description={
            confirm.type === 'clearAll'
              ? 'This deletes every enrolled voice. Ozwell will respond to anyone (no doctor-only gate) until you set up your voice again.'
              : 'This revokes that voice — Ozwell will no longer respond to them. You can re-enroll later.'
          }
          actionLabel={confirm.type === 'clearAll' ? 'Clear all' : 'Remove'}
          onAction={() => {
            if (confirm.type === 'clearAll') clearAll();
            else remove(confirm.id);
            setConfirm(null);
          }}
        />
      )}
    </div>
  );
}
