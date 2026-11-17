import { afterEach, describe, expect, it, vi } from 'vitest';
import { webcrypto } from 'node:crypto';
import { Schema } from 'prosemirror-model';
import type { CoreEditor } from '@kerebron/editor';
import { readBytes } from '@kerebron/documents';
import { importMime } from '@kerebron/document-mime';
import * as Y from 'yjs';
import {
  createArtifactEditorController,
  type ArtifactDocumentController,
  type ArtifactDocumentStorage,
} from './controller';
import {
  MDY_DOCUMENT,
  PLAIN_EMAIL,
  RELATED_EMAIL,
} from '../components/ArtifactDocumentEditor/storyData';

// Real MIME/MDY codecs and Yjs fragment helpers run here. The actual editor
// connection and body converters are isolated from jsdom's layout limitations.
vi.mock('@kerebron/document-yjs', async (original) => ({
  ...(await original<typeof import('@kerebron/document-yjs')>()),
  createBorrowedBodyKit: () => ({
    getExtensions: () => [],
    connect: vi.fn(),
    dispose: vi.fn(),
  }),
}));

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const reference = {
  artipodId: 'synthetic-group',
  artifactId: 'synthetic-document',
};
const controllers: ArtifactDocumentController[] = [];
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const stream = (bytes: Uint8Array) =>
  new globalThis.ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array(bytes));
      controller.close();
    },
  });

class Storage implements ArtifactDocumentStorage {
  readonly objects = new Map<string, Uint8Array>();
  snapshot: Uint8Array | null = null;
  beforeSave?: () => Promise<void>;
  beforeLoad?: () => Promise<void>;
  beforeRead?: () => Promise<void>;
  beforePut?: () => Promise<void>;
  async put(source: Uint8Array | globalThis.ReadableStream<Uint8Array>) {
    await this.beforePut?.();
    const ref = `immutable:${globalThis.crypto.randomUUID()}`;
    this.objects.set(
      ref,
      source instanceof Uint8Array
        ? new Uint8Array(source)
        : await readBytes(source)
    );
    return ref;
  }
  async read(ref: string) {
    await this.beforeRead?.();
    const bytes = this.objects.get(ref);
    if (!bytes) throw new Error('Missing immutable bytes');
    return stream(bytes);
  }
  async saveSnapshot(bytes: Uint8Array) {
    await this.beforeSave?.();
    this.snapshot = new Uint8Array(bytes);
    return `revision:${globalThis.crypto.randomUUID()}`;
  }
  async loadSnapshot() {
    await this.beforeLoad?.();
    return this.snapshot
      ? { revision: 'saved', source: stream(this.snapshot) }
      : null;
  }
}

class Session {
  status = 'open';
  private readonly listeners = new Set<() => void>();
  getSnapshot = () => ({ status: this.status });
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  lock() {
    this.status = 'locked';
    this.listeners.forEach((listener) => listener());
  }
  unlock() {
    this.status = 'open';
    this.listeners.forEach((listener) => listener());
  }
}

async function fixture(source = MDY_DOCUMENT, format: 'mime' | 'mdy' = 'mdy') {
  vi.stubGlobal('crypto', webcrypto);
  // Node's TextEncoder produces Node-realm arrays; jsdom's constructor differs.
  vi.stubGlobal('Uint8Array', new TextEncoder().encode('').constructor);
  const storage = new Storage();
  const session = new Session();
  const draft = new Storage();
  const controller = await createArtifactEditorController({
    reference,
    storage,
    session,
    source,
    format,
    sender: { address: 'reviewer@example.test' },
    createDraftTarget: async () => ({
      reference: { ...reference, artifactId: 'new-draft' },
      storage: draft,
    }),
  });
  controllers.push(controller);
  return { controller, session, storage, draft };
}

const schema = new Schema({
  nodes: {
    doc: { content: 'paragraph+' },
    paragraph: { content: 'inline*', toDOM: () => ['p', 0] },
    text: { group: 'inline' },
    br: { inline: true, group: 'inline', toDOM: () => ['br'] },
    hard_break: { inline: true, group: 'inline', toDOM: () => ['br'] },
    image: {
      inline: true,
      group: 'inline',
      attrs: { src: {}, alt: { default: '' } },
      toDOM: (node) => ['img', node.attrs],
    },
  },
});
const bodyNode = (text: string) =>
  schema.node('doc', null, [
    schema.node('paragraph', null, text ? schema.text(text) : undefined),
  ]);
function editor(toDoc: () => Promise<ReturnType<typeof bodyNode>>) {
  const target = new globalThis.EventTarget();
  const view = {
    props: { nodeViews: {} },
    setProps: vi.fn((next: object) => Object.assign(view.props, next)),
  };
  return Object.assign(target, {
    schema,
    view,
    getConverter: () => ({
      toDoc,
      fromDoc: async (node: ReturnType<typeof bodyNode>) =>
        encoder.encode(node.textContent),
    }),
  }) as unknown as CoreEditor;
}

afterEach(() => {
  controllers.splice(0).forEach((controller) => controller.close());
  vi.unstubAllGlobals();
});

describe('canonical Artifact controller integration', () => {
  it.each(['br', 'hard_break'])(
    'preserves %s line breaks and image alt in the MIME plain-text alternative',
    async (breakName) => {
      const { controller, storage } = await fixture(PLAIN_EMAIL, 'mime');
      await controller.compose('reply');
      const view = controller.body.createBinding();
      await view.connect(
        editor(async () =>
          schema.node('doc', null, [
            schema.node('paragraph', null, [
              schema.text('First line'),
              schema.node(breakName),
              schema.text('Second line'),
              schema.node(breakName),
              schema.node('image', {
                src: 'protected:diagram',
                alt: 'Illustration',
              }),
            ]),
            schema.node('paragraph', null, schema.text('Next paragraph')),
          ])
        )
      );
      const output = await controller.serialize('draft');
      const parsed = await importMime(output.bytes, { storage });
      expect(parsed.body.text).toBe(
        'First line\nSecond line\nIllustration\nNext paragraph'
      );
    }
  );

  it('preserves exact MDY source/front matter through save and fresh-controller reopen', async () => {
    const { controller, session, storage } = await fixture();
    expect(decoder.decode((await controller.serialize('source')).bytes)).toBe(
      MDY_DOCUMENT
    );
    await controller.save();
    controller.close();
    const reopened = await createArtifactEditorController({
      reference,
      storage,
      session,
      format: 'mdy',
    });
    controllers.push(reopened);
    expect(reopened.getSnapshot().document.format).toBe('mdy');
    expect(decoder.decode((await reopened.serialize('source')).bytes)).toBe(
      MDY_DOCUMENT
    );
    expect(reopened.getSnapshot().dirty).toBe(false);
  });

  it('keeps edits arriving during a save dirty and outside the captured revision', async () => {
    const { controller, storage } = await fixture();
    const entered = deferred();
    const release = deferred();
    storage.beforeSave = async () => {
      entered.resolve();
      await release.promise;
    };
    const saving = controller.save();
    await entered.promise;
    controller.ydoc.getMap('resource').set('concurrent-change', true);
    release.resolve();
    await saving;
    expect(controller.getSnapshot().dirty).toBe(true);
    const saved = JSON.parse(decoder.decode(storage.snapshot!));
    const clone = new Y.Doc();
    Y.applyUpdate(
      clone,
      Uint8Array.from(atob(saved.state), (character) => character.charCodeAt(0))
    );
    expect(clone.getMap('resource').has('concurrent-change')).toBe(false);
    clone.destroy();
  });

  it('saves the serialized capture while newer canonical body edits stay dirty', async () => {
    const { controller, session, storage } = await fixture();
    const binding = controller.body.createBinding();
    await binding.connect(editor(async () => bodyNode('Captured body')));
    const output = await controller.serialize('draft');
    const paragraph = controller.ydoc
      .getXmlFragment('body')
      .get(0) as Y.XmlElement;
    const body = paragraph.get(0) as Y.XmlText;
    body.insert(body.length, ' plus a newer edit');
    await controller.save(output);
    expect(controller.getSnapshot().dirty).toBe(true);
    expect(controller.ydoc.getXmlFragment('body').toString()).toContain(
      'newer edit'
    );
    const reopened = await createArtifactEditorController({
      reference,
      session,
      storage,
      format: 'mdy',
    });
    controllers.push(reopened);
    const reopenedOutput = await reopened.serialize('source');
    expect(decoder.decode(reopenedOutput.bytes)).toBe(
      decoder.decode(output.bytes)
    );
    expect(decoder.decode(reopenedOutput.bytes)).toContain('Captured body');
    expect(decoder.decode(reopenedOutput.bytes)).not.toContain('newer edit');
    expect(reopened.getSnapshot().dirty).toBe(false);
  });

  it('rejects a foreign serialization capture even for the same logical Artifact', async () => {
    const first = await fixture();
    const second = await fixture();
    const foreign = await second.controller.serialize('draft');
    await expect(first.controller.save(foreign)).rejects.toThrow();
    expect(first.storage.snapshot).toBeNull();
  });

  it('rejects a serialization capture invalidated by lock and unlock', async () => {
    const { controller, session, storage } = await fixture();
    const output = await controller.serialize('draft');
    session.lock();
    session.unlock();
    await expect(controller.save(output)).rejects.toThrow();
    expect(storage.snapshot).toBeNull();
  });

  it('rejects a serialization capture from the prior Artifact after reply retargets', async () => {
    const { controller, storage, draft } = await fixture(PLAIN_EMAIL, 'mime');
    const output = await controller.serialize('draft');
    await controller.compose('reply');
    await expect(controller.save(output)).rejects.toThrow();
    expect(storage.snapshot).toBeNull();
    expect(draft.snapshot).toBeNull();
  });

  it('captures deletion history even when the state vector is unchanged', async () => {
    const { controller, storage } = await fixture();
    const resource = controller.ydoc.getMap('resource');
    resource.set('deleted-field', 'must stay deleted');
    await controller.save();
    const before = JSON.parse(decoder.decode(storage.snapshot!));
    const vector = Y.encodeStateVector(controller.ydoc);
    resource.delete('deleted-field');
    expect(Y.encodeStateVector(controller.ydoc)).toEqual(vector);
    await controller.save();
    const after = JSON.parse(decoder.decode(storage.snapshot!));
    expect(after.state).not.toBe(before.state);
    const clone = new Y.Doc();
    Y.applyUpdate(
      clone,
      Uint8Array.from(atob(before.state), (character) =>
        character.charCodeAt(0)
      )
    );
    Y.applyUpdate(
      clone,
      Uint8Array.from(atob(after.state), (character) => character.charCodeAt(0))
    );
    expect(clone.getMap('resource').has('deleted-field')).toBe(false);
    clone.destroy();
  });

  it('does not report a pending save as successful after lock', async () => {
    const { controller, session, storage } = await fixture();
    const entered = deferred();
    const release = deferred();
    storage.beforeSave = async () => {
      entered.resolve();
      await release.promise;
    };
    const saving = controller.save();
    await entered.promise;
    session.lock();
    release.resolve();
    await expect(saving).rejects.toThrow('locked');
    expect(controller.getSnapshot().locked).toBe(true);
    expect(controller.getSnapshot().dirty).toBe(true);
  });

  it('creates a separate reply Artifact and leaves the imported message unchanged', async () => {
    const { controller, storage, draft } = await fixture(PLAIN_EMAIL, 'mime');
    const original = controller.ydoc;
    await controller.compose('reply');
    expect(controller.getSnapshot().reference.artifactId).toBe('new-draft');
    expect(controller.getSnapshot().mode).toBe('compose');
    expect(controller.ydoc).not.toBe(original);
    await controller.save();
    expect(draft.snapshot).not.toBeNull();
    expect(storage.snapshot).toBeNull();
    const message = controller.getSnapshot().document;
    expect(message.format === 'mime' && message.to[0].address).toBe(
      'alex@example.test'
    );
  });

  it('keeps current state intact if a saved snapshot is corrupt', async () => {
    const { controller, storage } = await fixture();
    await controller.save();
    const live = controller.ydoc;
    const saved = JSON.parse(decoder.decode(storage.snapshot!));
    saved.state = 'not base64 or a Yjs update';
    storage.snapshot = encoder.encode(JSON.stringify(saved));
    await expect(controller.reload()).rejects.toThrow();
    expect(controller.ydoc).toBe(live);
    expect(live.isDestroyed).toBe(false);
    expect(controller.getSnapshot().document.format).toBe('mdy');
  });

  it('does not replace canonical state when locked during a pending reopen', async () => {
    const { controller, session, storage } = await fixture();
    await controller.save();
    const live = controller.ydoc;
    const entered = deferred();
    const release = deferred();
    storage.beforeLoad = async () => {
      entered.resolve();
      await release.promise;
    };
    const reopening = controller.reload();
    await entered.promise;
    session.lock();
    release.resolve();
    await expect(reopening).rejects.toThrow('locked');
    expect(controller.ydoc).toBe(live);
    expect(live.isDestroyed).toBe(false);
  });

  it('does not revive a closed controller after a pending reopen completes', async () => {
    const { controller, storage } = await fixture();
    await controller.save();
    const live = controller.ydoc;
    const entered = deferred();
    const release = deferred();
    storage.beforeLoad = async () => {
      entered.resolve();
      await release.promise;
    };
    const reopening = controller.reload();
    await entered.promise;
    controller.close();
    release.resolve();
    await expect(reopening).rejects.toThrow('closed');
    expect(controller.ydoc).toBe(live);
    expect(live.isDestroyed).toBe(true);
    expect(controller.getSnapshot().locked).toBe(true);
  });

  it('redacts message bodies, headers and attachment descriptors while locked', async () => {
    const { controller, session } = await fixture(RELATED_EMAIL, 'mime');
    expect(controller.getSnapshot().attachments).toHaveLength(2);
    session.lock();
    const snapshot = controller.getSnapshot();
    expect(snapshot.attachments).toEqual([]);
    expect(JSON.stringify(snapshot.document)).not.toContain('Workshop');
    expect(JSON.stringify(snapshot.document)).not.toContain(
      'alex@example.test'
    );
    session.unlock();
    expect(controller.getSnapshot().attachments).toHaveLength(2);
  });

  it('does not switch to a forwarded Artifact when locking during attachment copy', async () => {
    const { controller, session, draft } = await fixture(RELATED_EMAIL, 'mime');
    const live = controller.ydoc;
    const entered = deferred();
    const release = deferred();
    draft.beforePut = async () => {
      entered.resolve();
      await release.promise;
    };
    const forwarding = controller.compose('forward');
    await entered.promise;
    session.lock();
    release.resolve();
    await expect(forwarding).rejects.toThrow('locked');
    expect(controller.ydoc).toBe(live);
    expect(live.isDestroyed).toBe(false);
    expect(controller.getSnapshot().reference).toEqual(reference);
  });

  it('allows the surviving shared view to finish initialization after the first detaches', async () => {
    const { controller } = await fixture();
    const release = deferred();
    const started = deferred();
    const first = controller.body.createBinding();
    const second = controller.body.createBinding();
    const initializing = first.connect(
      editor(async () => {
        started.resolve();
        await release.promise;
        return bodyNode('Shared body');
      })
    );
    await started.promise;
    const joining = second.connect(
      editor(async () => bodyNode('must not replace'))
    );
    first.dispose();
    release.resolve();
    await expect(initializing).resolves.toBeUndefined();
    await expect(joining).resolves.toBeUndefined();
    expect(controller.ydoc.getXmlFragment('body').length).toBeGreaterThan(0);
    expect(controller.ydoc.isDestroyed).toBe(false);
  });

  it('refuses an attachment preview that completes after its source attachment is removed', async () => {
    const { controller, storage } = await fixture(RELATED_EMAIL, 'mime');
    const attachment = controller.getSnapshot().attachments[0];
    const entered = deferred();
    const release = deferred();
    storage.beforeRead = async () => {
      entered.resolve();
      await release.promise;
    };
    const preview = controller.openAttachment(attachment.id);
    await entered.promise;
    const shared = controller.ydoc.getArray('attachments');
    shared.delete(0, 1);
    release.resolve();
    await expect(preview).rejects.toThrow();
  });

  it('renders canonical media references through inert placeholders without a fetchable src', async () => {
    const { controller } = await fixture();
    const binding = controller.body.createBinding();
    const bodyEditor = editor(async () =>
      bodyNode('Body with protected media')
    );
    await binding.connect(bodyEditor);
    const nodeViews = bodyEditor.view.props.nodeViews!;
    const render = nodeViews.image as unknown as (
      node: ReturnType<typeof bodyNode>
    ) => { dom: HTMLElement };
    const image = schema.nodes.image.create({
      src: 'https://outside.example.test/tracker.png',
      alt: 'Outside image',
    });
    const rendered = render(image).dom;
    expect(rendered.tagName).toBe('SPAN');
    expect(rendered.getAttribute('aria-label')).toBe('Outside image');
    expect(rendered.querySelector('img, video, audio, source')).toBeNull();
    expect(rendered.outerHTML).not.toContain('https://');
    expect(image.attrs.src).toBe('https://outside.example.test/tracker.png');
  });
});
