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
  modelRevision: string;
  variant: ModelVariant;
  embeds: Float32Array;
  createdAt: number;
}

const KEY = 'ozwellNemotronVoiceprints';

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
  namespace?: string
): Promise<NemotronVoiceprint[]> {
  const stored = await getVoiceprints<unknown>(
    voiceprintStorageKey(KEY, namespace)
  );
  return Array.isArray(stored) ? stored.filter(isVoiceprint) : [];
}

export function saveNemotronVoiceprints(
  voiceprints: NemotronVoiceprint[],
  namespace?: string
): Promise<void> {
  return setVoiceprints(voiceprintStorageKey(KEY, namespace), voiceprints);
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
