/**
 * useNemotronWakeVoices: Nemotron voiceprints of the people allowed to command Hey Ozwell (the doctor
 * check). `useVoiceSetup` enrolls them, `VoiceManager` removes them and `useHeyOzwell` checks wakes.
 */
import * as React from 'react';
import { resampleTo16kMono } from '../whisperTranscribe';
import { dominantLane } from './nemotron/attribution';
import { MODEL_REVISION } from './nemotron/modelConfig';
import { enrollNemotron, runNemotron } from './nemotron/runNemotron';
import {
  isUsableWith,
  loadNemotronVoiceprints,
  onNemotronVoiceprintsSaved,
  saveNemotronVoiceprints,
  type NemotronVoiceprint,
} from './nemotron/voiceprints';
import { useNemotronModel } from './useNemotronDiarization';

/** Nemotron has 8 lanes; one stays free for anyone else talking. */
const MAX_VOICES = 7;

export interface WakeClip {
  samples: Float32Array;
  sampleRate: number;
}

export interface UseNemotronWakeVoicesOptions {
  /** Set false to skip loading the stored voices. Default true. */
  enabled?: boolean;
  /** Isolates the voices per user; use the same value as `useHeyOzwell` and `useVoiceSetup`. */
  voiceprintNamespace?: string;
}

export interface NemotronWakeVoices {
  /** The stored voices are loaded and the model is picked. */
  ready: boolean;
  /** Stored voices, whichever model enrolled them. */
  count: number;
  /** Voices this device's model can check; fewer than `count` means some must be enrolled again. */
  usable: number;
  /** Whether an allowed voice is the main speaker in `clip`. False when no voice is usable. */
  verify: (clip: WakeClip) => Promise<boolean>;
  /** Stores (or replaces) `voiceId`'s voiceprint from its enrollment clips. */
  enroll: (voiceId: string, name: string, clips: WakeClip[]) => Promise<void>;
  remove: (voiceId: string) => Promise<void>;
  clear: () => Promise<void>;
}

const load = (namespace?: string) => loadNemotronVoiceprints(namespace, 'wake');
const save = (prints: NemotronVoiceprint[], namespace?: string) =>
  saveNemotronVoiceprints(prints, namespace, 'wake');

function concat(parts: Float32Array[]): Float32Array {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

export function useNemotronWakeVoices({
  enabled = true,
  voiceprintNamespace,
}: UseNemotronWakeVoicesOptions = {}): NemotronWakeVoices {
  const model = useNemotronModel();
  const [prints, setPrints] = React.useState<NemotronVoiceprint[] | null>(null);

  // Reload after any save, including one made by another surface (Voice Setup, Voice Manager).
  React.useEffect(() => {
    setPrints(null);
    if (!enabled) return;
    let cancelled = false;
    const reload = () =>
      void load(voiceprintNamespace).then((loaded) => {
        if (!cancelled) setPrints(loaded);
      });
    reload();
    const unsubscribe = onNemotronVoiceprintsSaved(reload);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [enabled, voiceprintNamespace]);

  const usablePrints = React.useMemo(
    () =>
      model && prints
        ? prints.filter((p) => isUsableWith(p, model.variant))
        : [],
    [model, prints]
  );

  const verify = React.useCallback(
    async ({ samples, sampleRate }: WakeClip) => {
      if (!model || usablePrints.length === 0) return false;
      const frames = await runNemotron(resampleTo16kMono(samples, sampleRate), {
        ...model,
        streamingMode: 'offline',
        voiceprints: usablePrints.map((p) => p.embeds),
      });
      const lane = dominantLane(frames);
      return lane !== null && lane < usablePrints.length;
    },
    [model, usablePrints]
  );

  const enroll = React.useCallback(
    async (voiceId: string, name: string, clips: WakeClip[]) => {
      if (!model)
        throw new Error('The speaker model is still being chosen; try again');
      const embeds = await enrollNemotron(
        concat(clips.map((c) => resampleTo16kMono(c.samples, c.sampleRate))),
        { ...model, streamingMode: 'offline' }
      );
      if (!embeds)
        throw new Error(
          'No clear voice in the recordings; set up the voice again'
        );
      const others = (await load(voiceprintNamespace)).filter(
        (p) => p.voiceId !== voiceId
      );
      if (
        others.filter((p) => isUsableWith(p, model.variant)).length >=
        MAX_VOICES
      )
        throw new Error(`At most ${MAX_VOICES} voices can be enrolled`);
      await save(
        [
          ...others,
          {
            name,
            voiceId,
            modelRevision: MODEL_REVISION,
            variant: model.variant,
            embeds,
            createdAt: Date.now(),
          },
        ],
        voiceprintNamespace
      );
    },
    [model, voiceprintNamespace]
  );

  const remove = React.useCallback(
    async (voiceId: string) =>
      save(
        (await load(voiceprintNamespace)).filter((p) => p.voiceId !== voiceId),
        voiceprintNamespace
      ),
    [voiceprintNamespace]
  );

  const clear = React.useCallback(
    () => save([], voiceprintNamespace),
    [voiceprintNamespace]
  );

  return {
    ready: prints !== null && model !== null,
    count: prints?.length ?? 0,
    usable: usablePrints.length,
    verify,
    enroll,
    remove,
    clear,
  };
}
