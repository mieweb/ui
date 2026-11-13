import type { CoreEditor, EditorKit } from '@kerebron/editor';
import type {
  DocumentAttachment,
  EditableDocument,
  SerializedMessage,
} from '@kerebron/documents';

/** Logical identity; the host resolves and authorizes it before creating a controller. */
export interface ArtifactReference {
  artipodId: string;
  artifactId: string;
}

export type ArtifactMessageHeader = 'from' | 'to' | 'cc' | 'bcc' | 'subject';
export type ArtifactCompositionAction = 'reply' | 'replyAll' | 'forward';
export type ArtifactSerializationPurpose = 'source' | 'draft' | 'delivery';

/** An immutable, cached projection of the controller's canonical shared state. */
export interface ArtifactEditorSnapshot {
  reference: ArtifactReference;
  document: EditableDocument;
  attachments: readonly DocumentAttachment[];
  revision: number;
  /** Changes only when switching the bound document/body, never on ordinary edits. */
  bodyVersion: number;
  dirty: boolean;
  locked: boolean;
  mode: 'display' | 'compose';
  pending?: string;
}

export interface SerializedArtifactDocument extends SerializedMessage {
  format: 'mime' | 'mdy';
}

/** A short-lived decrypted preview. Each consumer releases only its own lease. */
export interface ArtifactPreviewLease {
  url: string;
  release: () => void;
}

export interface ArtifactBodyViewBinding {
  /** One set of extension instances per view. Never share them between editors. */
  editorKits: EditorKit[];
  connect: (editor: CoreEditor) => void | Promise<void>;
  dispose: () => void;
}

/**
 * Host-owned document/session integration. The component never creates a storage
 * root, joins a room, duplicates authoritative answers, or closes the controller.
 */
export interface ArtifactEditorController {
  getSnapshot: () => ArtifactEditorSnapshot;
  subscribe: (listener: () => void) => () => void;
  setHeader: (name: ArtifactMessageHeader, value: string) => void;
  attachFiles: (files: File[]) => Promise<void>;
  removeAttachment: (id: string) => void;
  openAttachment: (id: string) => Promise<ArtifactPreviewLease>;
  compose: (action: ArtifactCompositionAction) => Promise<void>;
  serialize: (
    purpose: ArtifactSerializationPurpose
  ) => Promise<SerializedArtifactDocument>;
  body: {
    /** Every consumer borrows its own view binding from the same canonical body. */
    createBinding: () => ArtifactBodyViewBinding;
  };
}
