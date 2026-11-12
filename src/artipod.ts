/**
 * Opt-in collaborative MIME/MDY editors. The application owns authorization,
 * protected Artipod storage and the canonical Y.Doc; views borrow their bindings.
 */
export { ArtifactDocumentEditor } from './components/ArtifactDocumentEditor';
export type {
  ArtifactEditorController,
  ArtifactEditorSnapshot,
  ArtifactReference,
  SerializedArtifactDocument,
} from './components/ArtifactDocumentEditor/types';
export {
  createProtectedArtifactEditorController as createArtifactEditorController,
  type CreateProtectedArtifactEditorOptions as CreateArtifactEditorControllerOptions,
  type ProtectedArtifactEditorController as ArtifactDocumentController,
} from './artipod/protectedController';
