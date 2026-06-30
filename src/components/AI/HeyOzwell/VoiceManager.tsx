/**
 * VoiceManager — the central "your voice" page (mieweb/ui#287).
 *
 * One home for voice enrollment: set up your voice, add another authorized voice (an assistant, or you
 * under a new condition), view your enrolled voices, rename or remove them, or clear everything. A real
 * exported surface built on `useSpeakerVerify` + `<VoiceSetup>` — not story-only code.
 *
 * Voices are keyed by id in the speaker runtime (WHO); removing one revokes that person. The WHAT
 * phrase-prints are shared/speaker-independent, so they're left in place on per-voice removal.
 */
import * as React from 'react';
import { useSpeakerVerify } from './SpeakerVerify/useSpeakerVerify';
import { clearWhatPrints } from '../voiceprintStore';
import { VoiceSetup } from './VoiceSetup';

const OZ = '#0BA0E0';

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

  const btn = (variant: 'primary' | 'ghost' | 'danger', small = false): React.CSSProperties => ({
    font: `600 ${small ? 13 : 15}px system-ui`,
    padding: small ? '7px 14px' : '12px 26px',
    borderRadius: 999,
    cursor: 'pointer',
    ...(variant === 'primary'
      ? { border: 'none', color: '#fff', background: OZ, boxShadow: `0 8px 24px ${OZ}55` }
      : variant === 'danger'
        ? { border: '1.5px solid #fca5a5', background: 'transparent', color: '#dc2626' }
        : { border: `1.5px solid ${OZ}`, background: 'transparent', color: OZ }),
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1f2733',
        textAlign: 'center',
        padding: 24,
        background: 'radial-gradient(900px 520px at 50% -5%, #e8f6fd 0%, #ffffff 58%)',
      }}
    >
      <img
        src={logoSrc ?? '/ozwell/icon.svg'}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{ width: 84, height: 86, filter: `drop-shadow(0 8px 24px ${OZ}55)`, marginBottom: 18 }}
      />
      <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5, color: '#0f2233' }}>Your voice</div>

      {!sv.ready && !sv.error && (
        <div style={{ font: '13px monospace', color: '#94a3b8', marginTop: 16 }}>Loading…</div>
      )}
      {sv.error && (
        <div style={{ fontSize: 13, color: '#dc2626', marginTop: 16 }}>
          Couldn’t load the voice models — check the console.
        </div>
      )}

      {sv.ready && voices.length === 0 && (
        <>
          <div style={{ fontSize: 15, color: '#5b6b7e', maxWidth: 440, marginTop: 10, lineHeight: 1.55 }}>
            Set up your voice so Ozwell only responds to you. You can add an assistant or extra conditions
            afterward.
          </div>
          <button type="button" style={{ ...btn('primary'), marginTop: 26 }} onClick={startFresh}>
            Set up your voice
          </button>
        </>
      )}

      {sv.ready && voices.length > 0 && (
        <>
          <div style={{ fontSize: 14.5, color: '#5b6b7e', marginTop: 8 }}>
            Voices Ozwell will respond to. Add an assistant or another condition, rename, or remove.
          </div>

          <div style={{ width: '100%', maxWidth: 460, marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {voices.map((v) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: 14,
                  background: '#fff',
                  textAlign: 'left',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  {editingId === v.id ? (
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveRename(v.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      style={{ font: '600 15px system-ui', padding: '4px 8px', borderRadius: 8, border: `1.5px solid ${OZ}`, width: '100%' }}
                      aria-label="Voice name"
                    />
                  ) : (
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#0f2233', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {v.label}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    {v.conditions} condition{v.conditions === 1 ? '' : 's'}
                  </div>
                </div>
                {editingId === v.id ? (
                  <>
                    <button type="button" style={btn('primary', true)} onClick={() => saveRename(v.id)}>Save</button>
                    <button type="button" style={btn('ghost', true)} onClick={() => setEditingId(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      style={btn('ghost', true)}
                      onClick={() => { setEditingId(v.id); setEditLabel(v.label); }}
                    >
                      Rename
                    </button>
                    <button type="button" style={btn('danger', true)} onClick={() => remove(v.id)}>Remove</button>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add a voice — name it, then enroll (an assistant, or you under a new condition) */}
          <div style={{ width: '100%', maxWidth: 460, marginTop: 18, display: 'flex', gap: 8 }}>
            <input
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') startAdd(); }}
              placeholder="Name a voice — an assistant, you in a mask…"
              aria-label="New voice name"
              style={{ flex: 1, font: '14px system-ui', padding: '10px 14px', borderRadius: 999, border: '1.5px solid #cbd5e1' }}
            />
            <button type="button" style={btn('primary', true)} onClick={startAdd}>Add a voice</button>
          </div>

          <button type="button" style={{ ...btn('danger', true), marginTop: 18 }} onClick={clearAll}>
            Clear all voices
          </button>
        </>
      )}

      <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 26 }}>
        Voiceprints stay on your device — they’re never uploaded.
      </div>
    </div>
  );
}
