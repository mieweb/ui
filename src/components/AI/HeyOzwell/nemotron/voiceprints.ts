/** Nemotron voiceprints in IndexedDB, isolated per `voiceprintNamespace` like the TitaNet ones. */
import {
  getVoiceprints,
  setVoiceprints,
  voiceprintStorageKey,
} from '../../voiceprintStore';
import { MODEL_REVISION, type ModelVariant } from './modelConfig';

/** Speaker-cache frames of one enrolled person, row-major `frames x hiddenSize`. */
export interface NemotronVoiceprint {
  name: string;
  /** The Voice Manager voice this print belongs to (wake list only). */
  voiceId?: string;
  modelRevision: string;
  variant: ModelVariant;
  embeds: Float32Array;
  createdAt: number;
}

/** `scribe`: voices named in transcripts. `wake`: voices allowed to command Hey Ozwell. */
export type VoiceprintList = 'scribe' | 'wake';

const KEYS: Record<VoiceprintList, string> = {
  scribe: 'ozwellNemotronVoiceprints',
  wake: 'ozwellNemotronWakeVoiceprints',
};
const saved = new Set<() => void>();

const isVoiceprint = (value: unknown): value is NemotronVoiceprint => {
  const v = value as Partial<NemotronVoiceprint> | null;
  return (
    typeof v?.name === 'string' &&
    typeof v.modelRevision === 'string' &&
    typeof v.variant === 'string' &&
    v.embeds instanceof Float32Array
  );
};

export async function loadNemotronVoiceprints(
  namespace?: string,
  list: VoiceprintList = 'scribe'
): Promise<NemotronVoiceprint[]> {
  const stored = await getVoiceprints<unknown>(
    voiceprintStorageKey(KEYS[list], namespace)
  );
  return Array.isArray(stored) ? stored.filter(isVoiceprint) : [];
}

export function saveNemotronVoiceprints(
  voiceprints: NemotronVoiceprint[],
  namespace?: string,
  list: VoiceprintList = 'scribe'
): Promise<void> {
  return setVoiceprints(
    voiceprintStorageKey(KEYS[list], namespace),
    voiceprints
  ).then(() => saved.forEach((listener) => listener()));
}

/** Calls `listener` after every save, so each view of the stored voices can reload. */
export function onNemotronVoiceprintsSaved(listener: () => void): () => void {
  saved.add(listener);
  return () => saved.delete(listener);
}

/** Frames only mean something to the exact checkpoint and quantisation that produced them. */
export function isUsableWith(
  voiceprint: NemotronVoiceprint,
  variant: ModelVariant
): boolean {
  return (
    voiceprint.modelRevision === MODEL_REVISION &&
    voiceprint.variant === variant
  );
}
