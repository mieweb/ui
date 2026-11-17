import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StorageSession } from '@artipod/core/storage';
import type { ArtifactReference } from '../components/ArtifactDocumentEditor/types';
import { createProtectedArtifactEditorController } from './protectedController';

const mocks = vi.hoisted(() => ({
  stores: [] as Array<{ close: ReturnType<typeof vi.fn> }>,
  bindOptions: undefined as unknown,
  closeDocument: vi.fn(),
  bindFailure: undefined as Error | undefined,
}));

vi.mock('@artipod/core/storage', () => ({
  createArtifactStorage: vi.fn(() => {
    const storage = { close: vi.fn(async () => {}) };
    mocks.stores.push(storage);
    return storage;
  }),
}));

vi.mock('./controller', () => ({
  createArtifactEditorController: vi.fn(async (options: unknown) => {
    mocks.bindOptions = options;
    if (mocks.bindFailure) throw mocks.bindFailure;
    return { close: mocks.closeDocument, ydoc: {} };
  }),
}));

const initial = { artipodId: 'group', artifactId: 'original' };
const draft = { artipodId: 'group', artifactId: 'new-draft' };
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function draftTarget() {
  return (
    mocks.bindOptions as {
      createDraftTarget: (
        action: 'reply',
        reference: ArtifactReference
      ) => Promise<unknown>;
    }
  ).createDraftTarget;
}

afterEach(() => {
  mocks.stores.length = 0;
  mocks.bindOptions = undefined;
  mocks.bindFailure = undefined;
  vi.clearAllMocks();
});

describe('protected controller borrowed-storage lifetime', () => {
  it('does not acquire a late store when closed during draft provisioning', async () => {
    const provisioning = deferred<ArtifactReference>();
    const rootClose = vi.fn();
    const authorize = vi.fn();
    const controller = await createProtectedArtifactEditorController({
      reference: initial,
      session: { close: rootClose } as unknown as StorageSession,
      authorize,
      createDraftReference: () => provisioning.promise,
    });
    const acquiring = draftTarget()('reply', initial);
    await controller.close();
    provisioning.resolve(draft);
    await expect(acquiring).rejects.toThrow('closing');
    expect(mocks.stores).toHaveLength(1);
    expect(mocks.stores[0].close).toHaveBeenCalledOnce();
    expect(authorize).not.toHaveBeenCalled();
    expect(rootClose).not.toHaveBeenCalled();
  });

  it('does not acquire a late store when closed during authorization', async () => {
    const checking = deferred<void>();
    const entered = deferred<void>();
    const rootClose = vi.fn();
    const controller = await createProtectedArtifactEditorController({
      reference: initial,
      session: { close: rootClose } as unknown as StorageSession,
      authorize: async () => {
        entered.resolve();
        await checking.promise;
      },
      createDraftReference: async () => draft,
    });
    const acquiring = draftTarget()('reply', initial);
    await entered.promise;
    await controller.close();
    checking.resolve();
    await expect(acquiring).rejects.toThrow('closing');
    expect(mocks.stores).toHaveLength(1);
    expect(mocks.stores[0].close).toHaveBeenCalledOnce();
    expect(rootClose).not.toHaveBeenCalled();
  });

  it('revokes acquisitions synchronously and closes all acquired handles only once', async () => {
    const provision = vi.fn(async () => draft);
    const controller = await createProtectedArtifactEditorController({
      reference: initial,
      session: {} as StorageSession,
      authorize: () => {},
      createDraftReference: provision,
    });
    await draftTarget()('reply', initial);
    expect(mocks.stores).toHaveLength(2);
    const closing = controller.close();
    expect(mocks.closeDocument).toHaveBeenCalledOnce();
    await expect(draftTarget()('reply', initial)).rejects.toThrow('closing');
    expect(provision).toHaveBeenCalledOnce();
    expect(controller.close()).toBe(closing);
    await closing;
    mocks.stores.forEach((store) => expect(store.close).toHaveBeenCalledOnce());
  });

  it('releases the initial handle when document binding fails', async () => {
    mocks.bindFailure = new Error('Document binding failed');
    const rootClose = vi.fn();
    await expect(
      createProtectedArtifactEditorController({
        reference: initial,
        session: { close: rootClose } as unknown as StorageSession,
        authorize: () => {},
      })
    ).rejects.toThrow('Document binding failed');
    expect(mocks.stores[0].close).toHaveBeenCalledOnce();
    expect(rootClose).not.toHaveBeenCalled();
  });
});
