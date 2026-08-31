import 'fake-indexeddb/auto';

import { beforeEach, describe, expect, it } from 'vitest';

import {
  clearWhatPrints,
  clearVoiceprints,
  getVoiceprints,
  loadWhatPrints,
  saveWhatPrints,
  setVoiceprints,
  voiceprintStorageKey,
} from './voiceprintStore';

const prints = (value: number) => ({
  'hey-ozwell': [Float32Array.from([value])],
});

describe('voiceprintStore namespaces', () => {
  beforeEach(async () => {
    localStorage.clear();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('ozwell-voice');
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Database deletion blocked'));
    });
  });

  it('preserves the existing key when no namespace is provided', () => {
    expect(voiceprintStorageKey('voiceprints')).toBe('voiceprints');
  });

  it('rejects an empty namespace', () => {
    expect(() => voiceprintStorageKey('voiceprints', '  ')).toThrow(
      'Voiceprint namespace must not be empty'
    );
  });

  it('isolates WHAT prints by namespace', async () => {
    await saveWhatPrints(prints(1), 'user-a');
    await saveWhatPrints(prints(2), 'user-b');

    expect((await loadWhatPrints('user-a'))['hey-ozwell'][0][0]).toBe(1);
    expect((await loadWhatPrints('user-b'))['hey-ozwell'][0][0]).toBe(2);
    expect(await loadWhatPrints()).toEqual({});
  });

  it('clears only the selected namespace', async () => {
    await saveWhatPrints(prints(1), 'user-a');
    await saveWhatPrints(prints(2), 'user-b');

    await clearWhatPrints('user-a');

    expect(await loadWhatPrints('user-a')).toEqual({});
    expect((await loadWhatPrints('user-b'))['hey-ozwell'][0][0]).toBe(2);
  });

  it('isolates WHO records through the shared storage key', async () => {
    const userAKey = voiceprintStorageKey('ozwellDoctorVoiceprint', 'user-a');
    const userBKey = voiceprintStorageKey('ozwellDoctorVoiceprint', 'user-b');
    await setVoiceprints(userAKey, { owner: 'a' });
    await setVoiceprints(userBKey, { owner: 'b' });

    await clearVoiceprints(userAKey);

    expect(await getVoiceprints(userAKey)).toBeUndefined();
    expect(await getVoiceprints(userBKey)).toEqual({ owner: 'b' });
  });

  it('does not assign unscoped legacy prints to a namespace', async () => {
    localStorage.setItem(
      'ozwellWhatPrints',
      JSON.stringify({ 'hey-ozwell': [[3]] })
    );

    expect(await loadWhatPrints('user-a')).toEqual({});
    expect(localStorage.getItem('ozwellWhatPrints')).not.toBeNull();
    expect((await loadWhatPrints())['hey-ozwell'][0][0]).toBe(3);
  });
});
