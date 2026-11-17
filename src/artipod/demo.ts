/**
 * SYNTHETIC DATA ONLY. This makes local demos reopenable without an auth server.
 * The nonextractable key is structured-cloned into IndexedDB. Any same-origin
 * code can retrieve it: use the authenticated KeysService/broker in production.
 * Serve on a dedicated localhost origin; never reset another vault on failure.
 */
import {
  createStorageSession,
  type StorageKeyProvider,
} from '@artipod/core/storage';
import { createProtectedArtifactEditorController } from './protectedController';
import type { SerializedArtifactDocument } from '../components/ArtifactDocumentEditor/types';

async function demoKey(): Promise<globalThis.CryptoKey> {
  const candidate = await globalThis.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const opening = indexedDB.open('artipod-artifact-synthetic-demo', 1);
    opening.onupgradeneeded = () => opening.result.createObjectStore('keys');
    opening.onerror = () => reject(opening.error);
    opening.onblocked = () =>
      reject(new Error('Close other demo tabs before opening its key store'));
    opening.onsuccess = () => resolve(opening.result);
  });
  try {
    return await new Promise<globalThis.CryptoKey>((resolve, reject) => {
      const transaction = database.transaction('keys', 'readwrite');
      const store = transaction.objectStore('keys');
      let key: globalThis.CryptoKey;
      const reading = store.get('root');
      reading.onsuccess = () => {
        key = reading.result ?? candidate;
        if (
          key?.type !== 'secret' ||
          key.extractable !== false ||
          key.algorithm?.name !== 'AES-GCM'
        ) {
          transaction.abort();
          return;
        }
        if (!reading.result) store.put(key, 'root');
      };
      transaction.oncomplete = () => resolve(key);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () =>
        reject(transaction.error ?? new Error('Invalid synthetic demo key'));
    });
  } finally {
    database.close();
  }
}

async function createSyntheticArtifactDemoSession() {
  let key: globalThis.CryptoKey | null = await demoKey();
  const listeners = new Set<() => void>();
  const publish = () => listeners.forEach((listener) => listener());
  const lock = () => {
    key = null;
    publish();
  };
  const keys: StorageKeyProvider = {
    storagePolicy: 'encrypted',
    getKey: () => key,
    requireKey: () => {
      if (!key) throw new Error('Synthetic demo is locked');
      return key;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    suspendForReset: async () => lock,
  };
  const session = createStorageSession({
    policy: 'protected',
    keys,
    backend: 'opfs',
  });
  await session.open();
  return {
    session,
    lock,
    async unlock() {
      key = await demoKey();
      publish();
      await session.open();
    },
    async close() {
      try {
        await session.close();
      } finally {
        lock();
      }
    },
  };
}

// Keep the application-owned vault across Storybook hot module replacement.
const sessionKey = Symbol.for('mieweb.ui.synthetic-artipod-session');
const sessionOwner = globalThis as unknown as Record<
  symbol,
  ReturnType<typeof createSyntheticArtifactDemoSession> | undefined
>;

/** Storybook fixtures only; this helper is deliberately absent from public exports. */
export async function createArtifactEditorDemo(options: {
  source: string;
  format: 'mime' | 'mdy';
  artifactId?: string;
  artipodId?: string;
}) {
  sessionOwner[sessionKey] ??= createSyntheticArtifactDemoSession().catch(
    (error) => {
      sessionOwner[sessionKey] = undefined;
      throw error;
    }
  );
  const runtime = await sessionOwner[sessionKey]!;
  const identity = (reference: { artipodId: string; artifactId: string }) =>
    JSON.stringify([reference.artipodId, reference.artifactId]);
  const reference = {
    artipodId: options.artipodId ?? 'storybook-synthetic-artipod',
    artifactId: options.artifactId ?? `storybook-${options.format}`,
  };
  const allowed = new Set([identity(reference)]);
  const controller = await createProtectedArtifactEditorController({
    reference,
    session: runtime.session,
    source: options.source,
    format: options.format,
    sender: { address: 'reviewer@example.test', name: 'Storybook reviewer' },
    authorize(requested) {
      if (!allowed.has(identity(requested)))
        throw new Error('Unknown synthetic fixture scope');
    },
    createDraftReference: async () => {
      const draft = {
        artipodId: reference.artipodId,
        artifactId: `draft-${globalThis.crypto.randomUUID()}`,
      };
      allowed.add(identity(draft));
      return draft;
    },
  });
  return {
    controller,
    async save(output?: SerializedArtifactDocument) {
      await controller.save(output);
    },
    lock() {
      runtime.lock();
    },
    async unlock() {
      await runtime.unlock();
    },
    async reopen() {
      await controller.reload();
    },
    async dispose() {
      await controller.close();
    },
  };
}
