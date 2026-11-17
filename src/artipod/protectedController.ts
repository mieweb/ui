import {
  createArtifactStorage,
  type ArtifactStorage,
  type StorageSession,
} from '@artipod/core/storage';
import {
  createArtifactEditorController as bindDocument,
  type ArtifactDocumentController,
  type CreateArtifactEditorControllerOptions,
} from './controller';
import type {
  ArtifactCompositionAction,
  ArtifactReference,
} from '../components/ArtifactDocumentEditor/types';

export interface CreateProtectedArtifactEditorOptions extends Omit<
  CreateArtifactEditorControllerOptions,
  'storage' | 'session' | 'createDraftTarget'
> {
  /** One application-owned protected root, shared by all editor consumers. */
  session: StorageSession;
  authorize(
    reference: ArtifactReference,
    action: 'read' | 'write'
  ): void | Promise<void>;
  /** The host provisions an authorized new draft identity before composition. */
  createDraftReference?: (
    action: ArtifactCompositionAction,
    source: ArtifactReference
  ) => Promise<ArtifactReference>;
}

export type ProtectedArtifactEditorController = Omit<
  ArtifactDocumentController,
  'close'
> & {
  close(): Promise<void>;
};

/**
 * Supported persistence path for the optional UI integration. Artipod checks its
 * protected capability before I/O; the generic binding never opens another root.
 */
export async function createProtectedArtifactEditorController(
  options: CreateProtectedArtifactEditorOptions
): Promise<ProtectedArtifactEditorController> {
  const stores = new Set<ArtifactStorage>();
  let isClosing = false;
  const assertOpen = () => {
    if (isClosing) throw new Error('Protected Artifact controller is closing.');
  };
  const acquire = (reference: ArtifactReference) => {
    assertOpen();
    const storage = createArtifactStorage({
      session: options.session,
      reference,
      authorize: options.authorize,
      maxBytes: options.maxBytes,
    });
    stores.add(storage);
    return { reference, storage };
  };
  const release = async () => {
    const results = await Promise.allSettled(
      [...stores].map((store) => store.close())
    );
    stores.clear();
    const failure = results.find((result) => result.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
  };
  let controller: ArtifactDocumentController;
  try {
    controller = await bindDocument({
      ...options,
      ...acquire(options.reference),
      createDraftTarget: options.createDraftReference
        ? async (action, source) => {
            assertOpen();
            const reference = await options.createDraftReference!(
              action,
              source
            );
            assertOpen();
            await options.authorize(reference, 'write');
            assertOpen();
            return acquire(reference);
          }
        : undefined,
    });
  } catch (error) {
    await release().catch(() => {});
    throw error;
  }
  let closing: Promise<void> | undefined;
  return Object.defineProperty(
    {
      ...controller,
      close: () => {
        if (closing) return closing;
        // Revoke acquisitions synchronously, before draining existing handles.
        isClosing = true;
        closing = (async () => {
          try {
            controller.close();
          } finally {
            await release();
          }
        })();
        return closing;
      },
    },
    'ydoc',
    { get: () => controller.ydoc }
  );
}
