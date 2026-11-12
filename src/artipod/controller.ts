import DOMPurify from 'dompurify';
import * as Y from 'yjs';
import type { CoreEditor } from '@kerebron/editor';
import type { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import type { NodeViewConstructor } from 'prosemirror-view';
import {
  createMdy,
  importMdy,
  readBytes,
  selectDocumentFormat,
  serializeMdy,
  type ByteSource,
  type DocumentAttachment,
  type DocumentByteStore,
  type EditableDocument,
  type Mailbox,
  type MimeDocument,
} from '@kerebron/documents';
import {
  createForward,
  createMimeDocument,
  createReply,
  importMime,
  parseMailboxList,
  serializeMime,
} from '@kerebron/document-mime';
import {
  createBorrowedBodyKit,
  fragmentToProseMirror,
  initializeFragment,
  type BorrowedBodyKit,
} from '@kerebron/document-yjs';
import type {
  ArtifactBodyViewBinding,
  ArtifactCompositionAction,
  ArtifactEditorController,
  ArtifactEditorSnapshot,
  ArtifactMessageHeader,
  ArtifactPreviewLease,
  ArtifactReference,
  ArtifactSerializationPurpose,
  SerializedArtifactDocument,
} from '../components/ArtifactDocumentEditor/types';

/** Structural seams also allow deterministic storage/controller tests. */
export interface ArtifactDocumentStorage extends DocumentByteStore {
  saveSnapshot(
    source: Uint8Array,
    metadata: { mediaType: string }
  ): Promise<string>;
  loadSnapshot(): Promise<{
    revision: string;
    source: globalThis.ReadableStream<Uint8Array>;
  } | null>;
}

export interface ArtifactDocumentStorageSession {
  getSnapshot(): { status: string };
  subscribe(listener: () => void): () => void;
}

export interface ArtifactDraftTarget {
  reference: ArtifactReference;
  storage: ArtifactDocumentStorage;
  /** When provided, this canonical document remains owned by the host. */
  ydoc?: Y.Doc;
}

export interface CreateArtifactEditorControllerOptions extends ArtifactDraftTarget {
  session: ArtifactDocumentStorageSession;
  source?: ByteSource;
  /** Explicit MIME stays MIME even without multipart or MIME-Version headers. */
  format?: 'mime' | 'mdy';
  sender?: Mailbox;
  mode?: 'display' | 'compose';
  maxBytes?: number;
  /** Reply/forward must acquire a new authorized draft, preserving the incoming Artifact. */
  createDraftTarget?: (
    action: ArtifactCompositionAction,
    source: ArtifactReference
  ) => Promise<ArtifactDraftTarget>;
}

export interface ArtifactDocumentController extends ArtifactEditorController {
  readonly ydoc: Y.Doc;
  /** An output token saves exactly that export's captured canonical revision. */
  save(output?: SerializedArtifactDocument): Promise<string>;
  /** Reopen an owned session from its protected snapshot; borrowed hosts reopen themselves. */
  reload(): Promise<void>;
  /** Detaches this controller only, retaining the host's storage session. */
  close(): void;
}

interface SavedArtifactDocument {
  version: 1;
  reference: ArtifactReference;
  state: string;
  /** Derived immutable display of exactly the captured CRDT state. */
  preview: EditableDocument;
  mode: 'display' | 'compose';
}

interface ConnectedView {
  kit: BorrowedBodyKit;
  editor?: CoreEditor;
  dispose(): void;
}

interface CapturedDocument {
  document: EditableDocument;
  update: Uint8Array;
  revision: number;
}

const contentType = 'application/vnd.mieweb.artifact-document+json;version=1';
const encode = new TextEncoder();
const decode = new TextDecoder();
const addressFields = new Set(['from', 'to', 'cc', 'bcc']);

function toBase64(bytes: Uint8Array): string {
  let value = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    value += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(value);
}

function fromBase64(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function metadataOf(document: EditableDocument): Record<string, unknown> {
  const result = { ...document } as Record<string, unknown>;
  delete result.body;
  delete result.attachments;
  return result;
}

function assertReference(
  actual: ArtifactReference,
  expected: ArtifactReference
) {
  if (
    !actual ||
    actual.artifactId !== expected.artifactId ||
    actual.artipodId !== expected.artipodId
  ) {
    throw new Error('Saved document belongs to a different Artifact.');
  }
}

function validateSaved(
  saved: SavedArtifactDocument,
  reference: ArtifactReference
): Y.Doc {
  if (
    saved.version !== 1 ||
    typeof saved.state !== 'string' ||
    !saved.preview ||
    !['mime', 'mdy'].includes(saved.preview.format) ||
    !['display', 'compose'].includes(saved.mode)
  )
    throw new Error('Unsupported or invalid saved Artifact document.');
  assertReference(saved.reference, reference);
  const candidate = new Y.Doc();
  try {
    Y.applyUpdate(candidate, fromBase64(saved.state));
    if (candidate.getMap('resource').get('format') !== saved.preview.format)
      throw new Error('Saved Artifact preview and canonical format disagree.');
    return candidate;
  } catch (error) {
    candidate.destroy();
    throw error;
  }
}

/**
 * The only mutable document is the host Y.Doc. Codec models are import seeds or
 * immutable materializations. Body edits never round-trip through MIME/MDY.
 */
export async function createArtifactEditorController(
  options: CreateArtifactEditorControllerOptions
): Promise<ArtifactDocumentController> {
  let reference = { ...options.reference };
  let storage = options.storage;
  let ydoc = options.ydoc ?? new Y.Doc();
  let ownsDocument = !options.ydoc;
  let resource = ydoc.getMap<unknown>('resource');
  let attachments = ydoc.getArray<DocumentAttachment>('attachments');
  let fragment = ydoc.getXmlFragment('body');
  let preview: EditableDocument;
  let mode: 'display' | 'compose' = options.mode ?? 'compose';
  let revision = 0;
  let savedRevision = -1;
  let bodyVersion = 0;
  let previewRevision = -1;
  let schema: Schema | undefined;
  let converters:
    | {
        html: (node: ProseMirrorNode) => Promise<Uint8Array>;
        markdown: (node: ProseMirrorNode) => Promise<Uint8Array>;
      }
    | undefined;
  let pending: string | undefined;
  let closed = false;
  let initializing: Promise<void> | undefined;
  let bindingEpoch = 0;
  let snapshot: ArtifactEditorSnapshot;
  const listeners = new Set<() => void>();
  const views = new Set<ConnectedView>();
  const leases = new Set<ArtifactPreviewLease>();
  let serializedCaptures = new WeakMap<
    SerializedArtifactDocument,
    {
      captured: CapturedDocument;
      target: ArtifactDocumentStorage;
      epoch: number;
      mode: 'display' | 'compose';
    }
  >();
  const maxBytes = options.maxBytes ?? 10 * 1024 * 1024;
  if (
    !Number.isSafeInteger(maxBytes) ||
    maxBytes < 1 ||
    maxBytes > 10 * 1024 * 1024
  )
    throw new Error('The MVP maxBytes must be between 1 and 10485760.');
  let locked = options.session.getSnapshot().status !== 'open';

  const codecOptions = () => ({ storage, maxBytes });
  const assertActive = () => {
    if (closed) throw new Error('Document controller is closed.');
    if (options.session.getSnapshot().status !== 'open')
      throw new Error('Protected storage is locked or unavailable.');
  };
  const project = (): EditableDocument => {
    const metadata = resource.toJSON();
    delete metadata.bodyInitialized;
    const selectedFormat = metadata.format;
    if (selectedFormat === 'mime') {
      return {
        ...metadata,
        format: 'mime',
        body: preview.format === 'mime' ? preview.body : { text: '' },
        attachments: attachments.toArray(),
      } as MimeDocument;
    }
    return {
      ...metadata,
      format: 'mdy',
      body: preview.format === 'mdy' ? preview.body : '',
    } as EditableDocument;
  };
  const publish = () => {
    snapshot = {
      reference: { ...reference },
      document: locked
        ? resource.get('format') === 'mime'
          ? createMimeDocument()
          : createMdy()
        : project(),
      attachments: locked ? [] : attachments.toArray(),
      revision,
      bodyVersion,
      dirty: revision !== savedRevision,
      locked,
      mode,
      pending,
    };
    listeners.forEach((listener) => listener());
  };
  const revokePreviews = () => {
    serializedCaptures = new WeakMap();
    leases.forEach((lease) => lease.release());
    leases.clear();
  };
  const detachViews = () => {
    bindingEpoch += 1;
    for (const view of [...views]) view.dispose();
    schema = undefined;
    converters = undefined;
    initializing = undefined;
  };
  const onUpdate = () => {
    revision += 1;
    publish();
  };
  const observe = () => ydoc.on('update', onUpdate);
  const unobserve = () => ydoc.off('update', onUpdate);

  const initializeMetadata = (document: EditableDocument) => {
    preview = globalThis.structuredClone(document);
    ydoc.transact(() => {
      for (const [name, value] of Object.entries(metadataOf(document)))
        resource.set(name, value);
      resource.set('bodyInitialized', false);
      if (document.format === 'mime' && document.attachments.length)
        attachments.push(globalThis.structuredClone(document.attachments));
    });
    previewRevision = revision;
  };
  const restore = (saved: SavedArtifactDocument) => {
    const candidate = validateSaved(saved, reference);
    try {
      Y.applyUpdate(ydoc, Y.encodeStateAsUpdate(candidate));
    } finally {
      candidate.destroy();
    }
    preview = saved.preview;
    mode = saved.mode;
    previewRevision = revision;
    savedRevision = revision;
  };

  // A borrowed canonical session that already has a resource is never reseeded.
  if (!resource.has('format')) {
    const saved = await storage.loadSnapshot();
    if (saved) {
      restore(
        JSON.parse(
          decode.decode(await readBytes(saved.source, { maxBytes }))
        ) as SavedArtifactDocument
      );
    } else {
      const source =
        options.source !== undefined &&
        !options.format &&
        typeof options.source !== 'string' &&
        !(options.source instanceof Uint8Array)
          ? await readBytes(options.source, { maxBytes })
          : options.source;
      const format = selectDocumentFormat({
        format: options.format,
        prefix:
          typeof source === 'string'
            ? source.slice(0, 8192)
            : source instanceof Uint8Array
              ? decode.decode(source.subarray(0, 8192))
              : undefined,
      });
      const document =
        source === undefined
          ? format === 'mime'
            ? createMimeDocument(options.sender)
            : createMdy()
          : format === 'mime'
            ? await importMime(source, codecOptions())
            : await importMdy(source, codecOptions());
      if (!resource.has('format')) {
        mode =
          options.mode ??
          (document.format === 'mime' && document.source
            ? 'display'
            : 'compose');
        initializeMetadata(document);
      } else {
        // Another authorized initializer won while storage/import was pending.
        preview = document;
      }
    }
  } else {
    // A view joining a live host session must obtain a coherent saved preview;
    // it may not parse the caller's source over a live fragment.
    const saved = await storage.loadSnapshot();
    if (!saved)
      throw new Error(
        'Joining a live canonical session requires its protected source/snapshot preview.'
      );
    const parsed = JSON.parse(
      decode.decode(await readBytes(saved.source, { maxBytes }))
    ) as SavedArtifactDocument;
    assertReference(parsed.reference, reference);
    preview = parsed.preview;
    mode = options.mode ?? parsed.mode;
  }
  // TypeScript cannot follow assignment through initializeMetadata/restore.
  preview = preview!;
  assertActive();
  observe();
  publish();

  /** Capture a complete Yjs update before awaiting converters or attachment I/O. */
  const capture = async (): Promise<CapturedDocument> => {
    assertActive();
    await initializing;
    assertActive();
    const capturedRevision = revision;
    const update = Y.encodeStateAsUpdate(ydoc);
    const captured = new Y.Doc();
    Y.applyUpdate(captured, update);
    try {
      const meta = captured.getMap<unknown>('resource').toJSON();
      const initialized = meta.bodyInitialized === true;
      delete meta.bodyInitialized;
      const parts = captured
        .getArray<DocumentAttachment>('attachments')
        .toArray();
      let body: string | { html?: string; text?: string };
      if (initialized) {
        if (!schema || !converters) {
          if (previewRevision !== capturedRevision)
            throw new Error(
              'Connect an editor before exporting a changed canonical body.'
            );
          body = globalThis.structuredClone(preview.body);
        } else {
          const node = fragmentToProseMirror(
            captured.getXmlFragment('body'),
            schema
          );
          body =
            meta.format === 'mime'
              ? {
                  html: decode.decode(await converters.html(node)),
                  text: node.textBetween(0, node.content.size, '\n', (leaf) =>
                    leaf.type.name === 'br' || leaf.type.name === 'hard_break'
                      ? '\n'
                      : typeof leaf.attrs.alt === 'string'
                        ? leaf.attrs.alt
                        : (leaf.type.spec.leafText?.(leaf) ?? '')
                  ),
                }
              : decode.decode(await converters.markdown(node));
        }
      } else {
        body = globalThis.structuredClone(preview.body);
      }
      assertActive();
      const document =
        meta.format === 'mime'
          ? ({
              ...meta,
              format: 'mime',
              body,
              attachments: parts,
            } as MimeDocument)
          : ({ ...meta, format: 'mdy', body } as EditableDocument);
      return { document, update, revision: capturedRevision };
    } finally {
      captured.destroy();
    }
  };

  const withPending = async <T>(
    label: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    assertActive();
    if (pending) throw new Error('Another document operation is pending.');
    pending = label;
    publish();
    try {
      assertActive();
      return await operation();
    } finally {
      pending = undefined;
      publish();
    }
  };

  const createView = (): ArtifactBodyViewBinding => {
    assertActive();
    const kit = createBorrowedBodyKit({ doc: ydoc, fragment });
    const targetDoc = ydoc;
    const epoch = bindingEpoch;
    let disposed = false;
    const view: ConnectedView = {
      kit,
      dispose: () => {
        if (disposed) return;
        disposed = true;
        views.delete(view);
        if (view.editor) {
          view.editor.removeEventListener('beforeDestroy', view.dispose);
          view.editor.view.setProps({ editable: () => false });
        }
        kit.dispose();
        view.editor = undefined;
      },
    };
    views.add(view);
    return {
      editorKits: [kit],
      dispose: view.dispose,
      connect: async (editor) => {
        assertActive();
        if (disposed || targetDoc !== ydoc)
          throw new Error('This body view is no longer active.');
        view.editor = editor;
        editor.addEventListener('beforeDestroy', view.dispose);
        schema = editor.schema;
        // Keep original/durable media references in the canonical body while
        // preventing editor rendering from fetching arbitrary outside URLs.
        // MIME display uses separately authorized, short-lived preview leases.
        const nodeViews: Record<string, NodeViewConstructor> = {
          ...editor.view.props.nodeViews,
        };
        for (const [name, nodeType] of Object.entries(editor.schema.nodes)) {
          if (
            !nodeType.spec.attrs?.src &&
            !['image', 'video', 'audio'].includes(name)
          )
            continue;
          nodeViews[name] = (node) => {
            const dom = document.createElement('span');
            dom.className =
              'border-border bg-muted text-muted-foreground inline-block rounded border px-2 py-1 text-sm';
            dom.contentEditable = 'false';
            dom.setAttribute('role', 'img');
            const label = String(
              node.attrs.alt || node.attrs.title || node.type.name
            );
            dom.setAttribute('aria-label', label);
            dom.textContent = label;
            return { dom };
          };
        }
        editor.view.setProps({ nodeViews });
        const htmlConverter = editor.getConverter('text/html');
        const markdownConverter = editor.getConverter('text/x-markdown');
        converters = {
          html: (node) => htmlConverter.fromDoc(node),
          markdown: (node) => markdownConverter.fromDoc(node),
        };
        if (resource.get('bodyInitialized') !== true) {
          initializing ??= (async () => {
            const current = project();
            const type =
              current.format === 'mime' ? 'text/html' : 'text/x-markdown';
            const source =
              current.format === 'mime'
                ? current.body.html
                  ? DOMPurify.sanitize(current.body.html, {
                      FORBID_TAGS: [
                        'script',
                        'iframe',
                        'object',
                        'embed',
                        'style',
                        'link',
                        'form',
                      ],
                      FORBID_ATTR: ['srcset', 'poster', 'background'],
                    })
                  : `<p>${(current.body.text ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', '<br>')}</p>`
                : current.body;
            const node = await editor
              .getConverter(type)
              .toDoc(encode.encode(source));
            assertActive();
            if (targetDoc !== ydoc || epoch !== bindingEpoch)
              throw new Error('The initializing body view was closed.');
            if (resource.get('bodyInitialized') !== true) {
              ydoc.transact(() => {
                if (fragment.length === 0) initializeFragment(fragment, node);
                resource.set('bodyInitialized', true);
              });
            }
          })().finally(() => {
            if (epoch === bindingEpoch) initializing = undefined;
          });
          await initializing;
        }
        assertActive();
        if (disposed || targetDoc !== ydoc) return;
        kit.connect(editor);
      },
    };
  };

  const unsubscribeSession = options.session.subscribe(() => {
    const nextLocked = options.session.getSnapshot().status !== 'open';
    if (nextLocked === locked) return;
    locked = nextLocked;
    if (locked) {
      revokePreviews();
      detachViews();
    }
    bodyVersion += 1;
    publish();
  });

  const controller: ArtifactDocumentController = {
    get ydoc() {
      return ydoc;
    },
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    body: { createBinding: createView },
    setHeader: (name: ArtifactMessageHeader, value: string) => {
      assertActive();
      if (
        resource.get('format') !== 'mime' ||
        mode !== 'compose' ||
        resource.get('readOnly')
      )
        throw new Error('This message cannot be edited in place.');
      if (/[\r\n]/.test(value) || value.includes('\0'))
        throw new Error('Header values cannot contain line breaks or NUL.');
      resource.set(
        name,
        addressFields.has(name) ? parseMailboxList(value) : value
      );
    },
    attachFiles: (files) =>
      withPending('Saving protected attachments…', async () => {
        if (mode !== 'compose' || resource.get('readOnly'))
          throw new Error('Create a draft before attaching files.');
        const target = storage;
        const bodyEditor = [...views].find((view) => view.editor)?.editor;
        if (resource.get('format') === 'mdy' && !bodyEditor?.schema.marks.link)
          throw new Error(
            'Connect the MDY body before adding attachment references.'
          );
        const newParts: DocumentAttachment[] = [];
        for (const file of files) {
          if (file.size > maxBytes)
            throw new Error(
              `The preview supports attachments up to ${maxBytes} bytes.`
            );
          const ref = await target.put(file.stream(), {
            filename: file.name,
            mediaType: file.type || 'application/octet-stream',
          });
          assertActive();
          if (target !== storage)
            throw new Error(
              'The target Artifact changed during attachment storage.'
            );
          newParts.push({
            id: globalThis.crypto.randomUUID(),
            ref,
            filename: file.name,
            mediaType: file.type || 'application/octet-stream',
            size: file.size,
            disposition: 'attachment',
          });
        }
        if (newParts.length)
          ydoc.transact(() => {
            attachments.push(newParts);
            if (resource.get('format') === 'mdy' && bodyEditor) {
              const links = newParts.map((part) =>
                bodyEditor.schema.nodes.paragraph.create(
                  null,
                  bodyEditor.schema.text(part.filename, [
                    bodyEditor.schema.marks.link.create({ href: part.ref }),
                  ])
                )
              );
              bodyEditor.view.dispatch(
                bodyEditor.view.state.tr.insert(
                  bodyEditor.view.state.doc.content.size,
                  links
                )
              );
            }
          });
      }),
    removeAttachment: (id) => {
      assertActive();
      if (mode !== 'compose' || resource.get('readOnly'))
        throw new Error('This message cannot be edited in place.');
      const index = attachments.toArray().findIndex((part) => part.id === id);
      if (index >= 0)
        ydoc.transact(() => {
          const part = attachments.get(index);
          attachments.delete(index, 1);
          if (resource.get('format') === 'mdy') {
            const editor = [...views].find((view) => view.editor)?.editor;
            if (!editor) return;
            const transaction = editor.view.state.tr;
            editor.view.state.doc.descendants((node, position) => {
              if (
                node.marks.some(
                  (mark) =>
                    mark.type.name === 'link' && mark.attrs.href === part.ref
                )
              )
                transaction.removeMark(
                  position,
                  position + node.nodeSize,
                  editor.schema.marks.link
                );
            });
            if (transaction.docChanged) editor.view.dispatch(transaction);
          }
        });
    },
    openAttachment: async (id) => {
      assertActive();
      const part = attachments
        .toArray()
        .find((candidate) => candidate.id === id);
      if (!part) throw new Error('This attachment is no longer available.');
      const target = storage;
      const epoch = bindingEpoch;
      const bytes = await readBytes(await storage.read(part.ref), { maxBytes });
      try {
        assertActive();
        if (
          storage !== target ||
          epoch !== bindingEpoch ||
          !attachments
            .toArray()
            .some(
              (current) => current.id === part.id && current.ref === part.ref
            )
        )
          throw new Error('This attachment view is no longer active.');
        const url = URL.createObjectURL(
          new Blob([new Uint8Array(bytes)], { type: part.mediaType })
        );
        let released = false;
        const lease: ArtifactPreviewLease = {
          url,
          release: () => {
            if (released) return;
            released = true;
            URL.revokeObjectURL(url);
            leases.delete(lease);
          },
        };
        leases.add(lease);
        return lease;
      } finally {
        bytes.fill(0);
      }
    },
    compose: (action) =>
      withPending('Preparing new draft…', async () => {
        if (!options.sender)
          throw new Error(
            'The host must supply an authorized sender before composing mail.'
          );
        if (!options.createDraftTarget)
          throw new Error('The host must provide a new draft Artifact target.');
        const captured = await capture();
        if (captured.document.format !== 'mime')
          throw new Error('Only MIME messages support reply and forwarding.');
        const next =
          action === 'forward'
            ? createForward(captured.document, { sender: options.sender })
            : createReply(captured.document, {
                sender: options.sender,
                replyAll: action === 'replyAll',
              });
        const target = await options.createDraftTarget(action, {
          ...reference,
        });
        assertActive();
        if (
          target.reference.artipodId === reference.artipodId &&
          target.reference.artifactId === reference.artifactId
        )
          throw new Error(
            'A reply or forward must use a different draft Artifact.'
          );
        for (const part of next.attachments) {
          part.ref = await target.storage.put(await storage.read(part.ref), {
            filename: part.filename,
            mediaType: part.mediaType,
          });
        }
        assertActive();
        const nextDoc = target.ydoc ?? new Y.Doc();
        if (
          nextDoc.getMap('resource').has('format') ||
          nextDoc.getXmlFragment('body').length
        )
          throw new Error('The new draft target must be empty.');
        detachViews();
        revokePreviews();
        unobserve();
        if (ownsDocument) ydoc.destroy();
        ydoc = nextDoc;
        ownsDocument = !target.ydoc;
        resource = ydoc.getMap('resource');
        attachments = ydoc.getArray('attachments');
        fragment = ydoc.getXmlFragment('body');
        reference = { ...target.reference };
        storage = target.storage;
        mode = 'compose';
        bodyVersion += 1;
        revision += 1;
        initializeMetadata(next);
        savedRevision = -1;
        observe();
        publish();
      }),
    serialize: (purpose: ArtifactSerializationPurpose) =>
      withPending('Preparing document output…', async () => {
        const captured = await capture();
        const result =
          captured.document.format === 'mime'
            ? await serializeMime(captured.document, {
                ...codecOptions(),
                purpose,
                sender: purpose === 'source' ? undefined : options.sender,
              })
            : await serializeMdy(captured.document, codecOptions());
        assertActive();
        if (revision === captured.revision) {
          preview = captured.document;
          previewRevision = captured.revision;
        }
        const output: SerializedArtifactDocument = {
          ...result,
          format: captured.document.format,
        };
        serializedCaptures.set(output, {
          captured,
          target: storage,
          epoch: bindingEpoch,
          mode,
        });
        return output;
      }),
    save: (output) =>
      withPending('Saving protected document…', async () => {
        const token = output ? serializedCaptures.get(output) : undefined;
        if (
          output &&
          (!token || token.target !== storage || token.epoch !== bindingEpoch)
        )
          throw new Error(
            'This document output belongs to a different or expired capture.'
          );
        const captured = token?.captured ?? (await capture());
        const saved: SavedArtifactDocument = {
          version: 1,
          reference: { ...reference },
          state: toBase64(captured.update),
          preview: captured.document,
          mode: token?.mode ?? mode,
        };
        const result = await storage.saveSnapshot(
          encode.encode(JSON.stringify(saved)),
          { mediaType: contentType }
        );
        assertActive();
        if (revision === captured.revision) {
          preview = captured.document;
          previewRevision = captured.revision;
          savedRevision = captured.revision;
        }
        return result;
      }),
    reload: () =>
      withPending('Reopening protected document…', async () => {
        if (!ownsDocument)
          throw new Error(
            'The host owns this canonical session and must reopen it.'
          );
        const saved = await storage.loadSnapshot();
        if (!saved) throw new Error('No saved document is available.');
        const parsed = JSON.parse(
          decode.decode(await readBytes(saved.source, { maxBytes }))
        ) as SavedArtifactDocument;
        assertActive();
        const restoredDoc = validateSaved(parsed, reference);
        detachViews();
        revokePreviews();
        unobserve();
        ydoc.destroy();
        ydoc = restoredDoc;
        resource = ydoc.getMap('resource');
        attachments = ydoc.getArray('attachments');
        fragment = ydoc.getXmlFragment('body');
        revision += 1;
        bodyVersion += 1;
        preview = parsed.preview;
        mode = parsed.mode;
        previewRevision = revision;
        savedRevision = revision;
        observe();
        publish();
      }),
    close: () => {
      if (closed) return;
      closed = true;
      locked = true;
      unsubscribeSession();
      revokePreviews();
      detachViews();
      unobserve();
      if (ownsDocument) ydoc.destroy();
      publish();
      listeners.clear();
    },
  };
  return controller;
}
