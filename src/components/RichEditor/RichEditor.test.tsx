import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { RichEditor, type RichEditorHandle } from './RichEditor';
import { CodeEditor } from './CodeEditor';
import { MDY_PROJECTION_META } from './mdyTransaction';

// The Kerebron editor loads tree-sitter WASM grammars at runtime, which isn't
// available under jsdom. Mock the editor so these stay fast, deterministic
// smoke tests that just verify the wrappers mount/unmount without throwing.
const changeRoom = vi.fn();
const setProps = vi.fn();
// Stands in for the ProseMirror document. Identity is what the component uses
// to tell an edit from a selection change, so tests swap the object to mean
// "the document changed" and leave it alone to mean "only the caret moved".
const docMock = { current: { id: 'doc-0' } as object };
const editorMock = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  destroy: vi.fn(),
  loadDocumentText: vi.fn().mockResolvedValue(undefined),
  saveDocument: vi
    .fn()
    .mockResolvedValue(new globalThis.TextEncoder().encode('# hello')),
  run: { changeRoom },
  view: {
    setProps,
    get state() {
      return { doc: docMock.current };
    },
  },
};

/** Extension names the kit handed to `CoreEditor.create` produces. */
const extensionNames = () => {
  const { editorKits } = coreEditorCreate.mock.calls[0][0] as {
    editorKits: { getExtensions: () => { name: string }[] }[];
  };
  return editorKits[0].getExtensions().map((extension) => extension.name);
};

/** The `transaction` handler the component registered on mount. */
const transactionHandler = () =>
  editorMock.addEventListener.mock.calls.find(
    ([event]) => event === 'transaction'
  )?.[1] as (event?: Event) => Promise<void>;

const coreEditorCreate = vi.fn((_opts: unknown) => editorMock);
vi.mock('@kerebron/editor', () => ({
  CoreEditor: { create: (opts: unknown) => coreEditorCreate(opts) },
}));
// A stand-in for the real kit's extension list: enough of it to observe which
// extensions the wrapper drops and which it replaces.
vi.mock('@kerebron/editor-kits/AdvancedEditorKit', () => ({
  AdvancedEditorKit: vi.fn(() => ({
    getExtensions: () => [
      { name: 'mediaUpload' },
      { name: 'history' },
      { name: 'autocomplete' },
      { name: 'hover' },
      { name: 'bold' },
    ],
  })),
}));
vi.mock('@kerebron/editor-kits/CodeEditorKit', () => ({
  CodeEditorKit: vi.fn(),
}));
// `vi.hoisted` because this module is imported statically by editorKits.ts, so
// the mock factory runs before a plain top-level const would be initialized.
// (The collab kit below escapes this only because it is imported dynamically.)
const { extensionMediaUpload } = vi.hoisted(() => ({
  extensionMediaUpload: vi.fn(function (
    this: Record<string, unknown>,
    config: unknown
  ) {
    this.name = 'mediaUpload';
    this.config = config;
  }),
}));
vi.mock('@kerebron/extension-basic-editor/ExtensionMediaUpload', () => ({
  ExtensionMediaUpload: extensionMediaUpload,
}));
vi.mock('@kerebron/wasm/web', () => ({
  createAssetLoad: vi.fn(() => vi.fn()),
}));
// The collab kit is lazy-imported by editorKits.ts only when `collab` is set;
// mock it so the yjs optional peers aren't needed under jsdom.
const huddleYjsKit = vi.fn(function (
  this: Record<string, unknown>,
  url: string,
  params: Record<string, string>
) {
  this.name = 'yjs-editor';
  this.url = url;
  this.params = params;
  this.getExtensions = () => [];
});
// Set to simulate the lazy chunk failing to load: reading the export throws
// where the real `await import('./collabKit')` would reject. Cleared between
// tests by `beforeEach`.
let collabKitLoadError: Error | null = null;
vi.mock('./collabKit', () => ({
  get HuddleYjsKit() {
    if (collabKitLoadError) throw collabKitLoadError;
    return huddleYjsKit;
  },
  defaultWsUrl: () => 'ws://localhost/yjs',
}));

describe('RichEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collabKitLoadError = null;
    docMock.current = { id: 'doc-0' };
  });

  it('renders without throwing', async () => {
    const { container } = renderWithTheme(<RichEditor />);
    expect(container.querySelector('.kb-component')).not.toBeNull();
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
  });

  it('destroys the editor on unmount', async () => {
    const { unmount } = renderWithTheme(<RichEditor value="# hi" />);
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    unmount();
    expect(editorMock.destroy).toHaveBeenCalled();
  });

  it('plain mode does not load the yjs collab kit', async () => {
    renderWithTheme(<RichEditor />);
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    expect(huddleYjsKit).not.toHaveBeenCalled();
    expect(changeRoom).not.toHaveBeenCalled();
  });

  it('installs additional host editor kits beside the standard kit', async () => {
    const kit = { name: 'host-fields', getExtensions: () => [] };
    renderWithTheme(<RichEditor editorKits={[kit]} />);
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    const kits = (
      coreEditorCreate.mock.calls[0][0] as { editorKits: unknown[] }
    ).editorKits;
    expect(kits).toHaveLength(2);
    expect(kits[1]).toBe(kit);
  });

  it('collab mode includes the yjs kit and joins the room', async () => {
    renderWithTheme(
      <RichEditor
        value="# shared"
        collab={{
          room: 'room-1',
          wsUrl: 'ws://example.test/yjs',
          params: { token: 't' },
        }}
      />
    );
    await waitFor(() => expect(changeRoom).toHaveBeenCalledWith('room-1'));
    // The yjs kit was constructed with the caller's url + auth params …
    expect(huddleYjsKit).toHaveBeenCalledWith(
      'ws://example.test/yjs',
      { token: 't' },
      undefined, // no WebSocketPolyfill override
      undefined // no user — anonymous cursors
    );
    // … and handed to the editor.
    const kits = (
      coreEditorCreate.mock.calls[0][0] as {
        editorKits: { name: string }[];
      }
    ).editorKits;
    expect(kits.map((k) => k.name)).toEqual(['advanced-editor', 'yjs-editor']);
  });

  it('does not join the room when unmounted before content loads', async () => {
    let resolveLoad!: () => void;
    editorMock.loadDocumentText.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveLoad = resolve;
      })
    );
    const { unmount } = renderWithTheme(
      <RichEditor value="# shared" collab={{ room: 'room-1' }} />
    );
    await waitFor(() => expect(editorMock.loadDocumentText).toHaveBeenCalled());
    unmount();
    resolveLoad();
    await Promise.resolve(); // flush the continuation
    expect(changeRoom).not.toHaveBeenCalled();
    expect(editorMock.destroy).toHaveBeenCalled();
  });

  it('mounts into a disposable child div, not the React-owned host', async () => {
    const { container } = renderWithTheme(<RichEditor />);
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    const host = container.querySelector('.kb-component');
    const mounted = (coreEditorCreate.mock.calls[0][0] as { element: Element })
      .element;
    // `CoreEditor.destroy()` replaces its element with a clone — if that were
    // the host, React's ref would be left pointing at a detached node.
    expect(mounted).not.toBe(host);
    expect(host?.contains(mounted)).toBe(true);
  });

  it('exposes the editor content through the imperative handle', async () => {
    const ref = createRef<RichEditorHandle>();
    renderWithTheme(<RichEditor ref={ref} value="# hello" />);
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    await expect(ref.current?.getContent()).resolves.toBe('# hello');
  });

  it('retains the exact loaded Markdown and emits no change on opening or selection', async () => {
    const source = '\n##  Assessment\n\nWeight: [198 lb](mdy:weight).  \n\n';
    const ref = createRef<RichEditorHandle>();
    const onChange = vi.fn();
    renderWithTheme(
      <RichEditor ref={ref} value={source} onChange={onChange} />
    );
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    await expect(ref.current?.getContent()).resolves.toBe(source);
    await transactionHandler()();
    expect(onChange).not.toHaveBeenCalled();
    expect(editorMock.saveDocument).not.toHaveBeenCalled();
  });

  it('preserves the replacement source when an external value reload completes', async () => {
    const ref = createRef<RichEditorHandle>();
    const onChange = vi.fn();
    const { rerender } = renderWithTheme(
      <RichEditor ref={ref} value="# first" onChange={onChange} />
    );
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    await ref.current?.getContent();
    const replacement = '#  New assessment\n\n[198 lb](mdy:weight)  \n';
    rerender(<RichEditor ref={ref} value={replacement} onChange={onChange} />);
    await expect(ref.current?.getContent()).resolves.toBe(replacement);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('serializes edits when reading content for submit', async () => {
    const ref = createRef<RichEditorHandle>();
    renderWithTheme(<RichEditor ref={ref} value="# original" />);
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    await ref.current?.getContent();
    docMock.current = { id: 'edited' };
    await expect(ref.current?.getContent()).resolves.toBe('# hello');
    expect(editorMock.saveDocument).toHaveBeenCalledTimes(1);
  });

  it('reports a failed initial load and rejects content reads', async () => {
    const failure = new Error('WASM grammar failed to load');
    editorMock.loadDocumentText.mockRejectedValueOnce(failure);
    const ref = createRef<RichEditorHandle>();
    const onError = vi.fn();
    const onChange = vi.fn();
    renderWithTheme(
      <RichEditor
        ref={ref}
        value="# original"
        onError={onError}
        onChange={onChange}
      />
    );
    await waitFor(() => expect(onError).toHaveBeenCalledWith(failure));
    await expect(ref.current?.getContent()).rejects.toBe(failure);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps the exact source after a clean host projection update', async () => {
    const ref = createRef<RichEditorHandle>();
    const onChange = vi.fn();
    const source = '##  Assessment\n\n[198 lb](mdy:weight)  \n';
    renderWithTheme(
      <RichEditor ref={ref} value={source} onChange={onChange} />
    );
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    await ref.current?.getContent();
    const before = docMock.current;
    docMock.current = { id: 'projection' };
    await transactionHandler()(
      new globalThis.CustomEvent('transaction', {
        detail: {
          transaction: {
            before,
            getMeta: (key: string) => key === MDY_PROJECTION_META,
          },
        },
      })
    );
    await expect(ref.current?.getContent()).resolves.toBe(source);
    expect(onChange).not.toHaveBeenCalled();
    expect(editorMock.saveDocument).not.toHaveBeenCalled();
  });

  it('discards a serialized transaction when a newer edit has arrived', async () => {
    const ref = createRef<RichEditorHandle>();
    const onChange = vi.fn();
    renderWithTheme(
      <RichEditor ref={ref} value="# original" onChange={onChange} />
    );
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    await ref.current?.getContent();
    let finishSave!: (buffer: Uint8Array) => void;
    editorMock.saveDocument.mockReturnValueOnce(
      new Promise<Uint8Array>((resolve) => {
        finishSave = resolve;
      })
    );
    docMock.current = { id: 'first-edit' };
    const first = transactionHandler()();
    docMock.current = { id: 'second-edit' };
    await transactionHandler()();
    finishSave(new TextEncoder().encode('# stale first edit'));
    await first;
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('# hello');
  });

  it('does not return an outdated save when a newer external body is loaded', async () => {
    const ref = createRef<RichEditorHandle>();
    const { rerender } = renderWithTheme(
      <RichEditor ref={ref} value="# original" />
    );
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    await ref.current?.getContent();
    let finishSave!: (buffer: Uint8Array) => void;
    editorMock.saveDocument.mockReturnValueOnce(
      new Promise<Uint8Array>((resolve) => {
        finishSave = resolve;
      })
    );
    docMock.current = { id: 'edited' };
    const pending = ref.current!.getContent();
    await waitFor(() => expect(editorMock.saveDocument).toHaveBeenCalled());
    const replacement = '#  New MCP body\n\n[200 lb](mdy:weight)  \n';
    rerender(<RichEditor ref={ref} value={replacement} />);
    await waitFor(() =>
      expect(editorMock.loadDocumentText).toHaveBeenLastCalledWith(
        'text/x-markdown',
        replacement
      )
    );
    finishSave(new TextEncoder().encode('# stale local body'));
    await expect(pending).resolves.toBe(replacement);
  });

  it('retries a content read after a live projection refresh while retaining free prose', async () => {
    const ref = createRef<RichEditorHandle>();
    const onChange = vi.fn();
    renderWithTheme(
      <RichEditor ref={ref} value="# original" onChange={onChange} />
    );
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    await ref.current?.getContent();
    let finishSave!: (buffer: Uint8Array) => void;
    editorMock.saveDocument.mockReturnValueOnce(
      new Promise<Uint8Array>((resolve) => {
        finishSave = resolve;
      })
    );
    docMock.current = { id: 'authored-edit' };
    const pending = ref.current!.getContent();
    await waitFor(() => expect(editorMock.saveDocument).toHaveBeenCalled());
    const before = docMock.current;
    docMock.current = { id: 'same-prose-new-data' };
    await transactionHandler()(
      new globalThis.CustomEvent('transaction', {
        detail: {
          transaction: {
            before,
            getMeta: (key: string) => key === MDY_PROJECTION_META,
          },
        },
      })
    );
    finishSave(new TextEncoder().encode('# old projected value'));
    await expect(pending).resolves.toBe('# hello');
    expect(onChange).toHaveBeenCalledWith('# hello');
    expect(editorMock.saveDocument).toHaveBeenCalledTimes(2);
  });

  it('publishes the freshest prose after a projection overtakes a pending edit save', async () => {
    const ref = createRef<RichEditorHandle>();
    const onChange = vi.fn();
    renderWithTheme(
      <RichEditor ref={ref} value="# original" onChange={onChange} />
    );
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    await ref.current?.getContent();
    let finishOldSave!: (buffer: Uint8Array) => void;
    editorMock.saveDocument.mockReturnValueOnce(
      new Promise<Uint8Array>((resolve) => {
        finishOldSave = resolve;
      })
    );
    const freshest = '# Authored prose\n\n[200 lb](mdy:weight)';
    editorMock.saveDocument.mockResolvedValueOnce(
      new TextEncoder().encode(freshest)
    );
    docMock.current = { id: 'authored-edit-old-data' };
    const oldSave = transactionHandler()();
    const before = docMock.current;
    docMock.current = { id: 'same-prose-fresh-data' };
    await transactionHandler()(
      new globalThis.CustomEvent('transaction', {
        detail: {
          transaction: {
            before,
            getMeta: (key: string) => key === MDY_PROJECTION_META,
          },
        },
      })
    );
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(freshest));
    finishOldSave(
      new TextEncoder().encode('# Authored prose\n\n[198 lb](mdy:weight)')
    );
    await oldSave;
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(editorMock.saveDocument).toHaveBeenCalledTimes(2);
  });

  it('reloads when value changes, without echoing the load back', async () => {
    const onChange = vi.fn();
    const { rerender } = renderWithTheme(
      <RichEditor value="# one" onChange={onChange} />
    );
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    onChange.mockClear();

    // Hold the load open: the transactions it dispatches must not be reported
    // as edits, or the caller's own `value` echoes back through `onChange`.
    let finishLoad!: () => void;
    editorMock.loadDocumentText.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finishLoad = resolve;
      })
    );

    rerender(<RichEditor value="# two" onChange={onChange} />);
    await waitFor(() =>
      expect(editorMock.loadDocumentText).toHaveBeenLastCalledWith(
        'text/x-markdown',
        '# two'
      )
    );

    await transactionHandler()();
    expect(onChange).not.toHaveBeenCalled();

    finishLoad();
  });

  // The Yjs kit is an optional peer behind a dynamic import, so it can be
  // absent, stale or unreachable at runtime. It must not take the editor with
  // it: before this was handled, a failed load rejected `setup()` and the
  // consumer was left with an empty container — no editor, no error it could
  // see, and no way to edit the document at all.
  describe('when the collab kit fails to load', () => {
    it('still mounts an editor, as a local one', async () => {
      collabKitLoadError = new Error(
        'Failed to fetch dynamically imported module'
      );

      const { container } = renderWithTheme(
        <RichEditor value="# shared" collab={{ room: 'room-1' }} />
      );

      await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
      expect(container.querySelector('.kb-component')).not.toBeNull();
      const kits = (
        coreEditorCreate.mock.calls[0][0] as { editorKits: { name: string }[] }
      ).editorKits;
      expect(kits.map((k) => k.name)).toEqual(['advanced-editor']);
    });

    it('does not try to join a room it has no kit for', async () => {
      collabKitLoadError = new Error(
        'Failed to fetch dynamically imported module'
      );

      renderWithTheme(
        <RichEditor value="# shared" collab={{ room: 'room-1' }} />
      );

      await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
      await waitFor(() =>
        expect(editorMock.loadDocumentText).toHaveBeenCalled()
      );
      expect(changeRoom).not.toHaveBeenCalled();
    });

    // The fallback builds a second, local kit. Handing it `mediaUpload` is
    // easy to forget, and forgetting is silent: the stock extension returns
    // and pasted images go back to being embedded as base64.
    it('keeps the configured media upload when it degrades to local', async () => {
      collabKitLoadError = new Error(
        'Failed to fetch dynamically imported module'
      );
      const uploadHandler = vi.fn().mockResolvedValue('https://cdn.test/a.png');

      renderWithTheme(
        <RichEditor
          value="# shared"
          collab={{ room: 'room-1' }}
          mediaUpload={{ uploadHandler }}
        />
      );

      await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
      // `getExtensions` is lazy, so read the names first — that is what
      // constructs the extensions this asserts on.
      const names = extensionNames();
      expect(extensionMediaUpload).toHaveBeenCalledWith({ uploadHandler });
      expect(names.filter((name) => name === 'mediaUpload')).toHaveLength(1);
    });

    it('tells the host through onUnavailable', async () => {
      const failure = new Error('Failed to fetch dynamically imported module');
      collabKitLoadError = failure;
      const onUnavailable = vi.fn();

      renderWithTheme(
        <RichEditor
          value="# shared"
          collab={{ room: 'room-1', onUnavailable }}
        />
      );

      await waitFor(() => expect(onUnavailable).toHaveBeenCalledWith(failure));
    });

    it('leaves onUnavailable alone when collaboration starts normally', async () => {
      const onUnavailable = vi.fn();

      renderWithTheme(
        <RichEditor
          value="# shared"
          collab={{ room: 'room-1', onUnavailable }}
        />
      );

      await waitFor(() => expect(changeRoom).toHaveBeenCalledWith('room-1'));
      expect(onUnavailable).not.toHaveBeenCalled();
    });
  });

  it('collab mode ignores value changes so the CRDT stays authoritative', async () => {
    const { rerender } = renderWithTheme(
      <RichEditor value="# one" collab={{ room: 'room-1' }} />
    );
    await waitFor(() => expect(changeRoom).toHaveBeenCalled());
    editorMock.loadDocumentText.mockClear();
    rerender(<RichEditor value="# two" collab={{ room: 'room-1' }} />);
    expect(editorMock.loadDocumentText).not.toHaveBeenCalled();
  });

  it('skips re-serializing when only the selection changed', async () => {
    // ProseMirror fires a transaction for arrow keys, clicks and blurs too.
    // Serializing the document for those costs a tree-sitter pass and a React
    // render per caret move.
    const onChange = vi.fn();
    renderWithTheme(<RichEditor onChange={onChange} />);
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    editorMock.saveDocument.mockClear();
    onChange.mockClear();

    await transactionHandler()();
    await transactionHandler()();

    expect(editorMock.saveDocument).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('re-serializes when the document actually changed', async () => {
    const onChange = vi.fn();
    renderWithTheme(<RichEditor onChange={onChange} />);
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    editorMock.saveDocument.mockClear();
    onChange.mockClear();

    docMock.current = { id: 'doc-1' };
    await transactionHandler()();

    expect(editorMock.saveDocument).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('# hello');
  });

  it('replaces the media-upload extension with a configured one', async () => {
    // Without an uploadHandler the extension embeds pasted images in the
    // document as base64 `data:` URLs, so a host that persists its documents
    // has to be able to configure it. The kit builds its extensions with no
    // options, and options are fixed at construction, so the stock instance has
    // to be dropped rather than adjusted.
    const uploadHandler = vi.fn().mockResolvedValue('https://cdn.test/a.png');
    renderWithTheme(<RichEditor mediaUpload={{ uploadHandler }} />);
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());

    const names = extensionNames();
    expect(extensionMediaUpload).toHaveBeenCalledWith({ uploadHandler });
    // Exactly one — the stock instance is gone, not shadowed by a second.
    expect(names.filter((name) => name === 'mediaUpload')).toHaveLength(1);
  });

  it('leaves the default media-upload extension alone when unconfigured', async () => {
    renderWithTheme(<RichEditor />);
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());

    expect(extensionMediaUpload).not.toHaveBeenCalled();
    expect(extensionNames()).toContain('mediaUpload');
  });

  it('drops the teardown-unsafe extensions, and keeps history in plain mode', async () => {
    renderWithTheme(<RichEditor />);
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());

    const names = extensionNames();
    // `autocomplete`/`hover` fire debounced callbacks at a destroyed view.
    expect(names).not.toContain('autocomplete');
    expect(names).not.toContain('hover');
    // `history` only conflicts with the Yjs CRDT, so plain mode keeps undo.
    expect(names).toContain('history');
    expect(names).toContain('bold');
  });

  it('disabled makes the surface read-only and labelled', async () => {
    const { container } = renderWithTheme(
      <RichEditor disabled id="note-body" aria-labelledby="note-label" />
    );
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    const host = container.querySelector('#note-body');
    expect(host).toHaveAttribute('aria-disabled', 'true');
    expect(host).toHaveAttribute('aria-labelledby', 'note-label');
    expect(
      (coreEditorCreate.mock.calls[0][0] as { readOnly?: boolean }).readOnly
    ).toBe(true);
    const editable = setProps.mock.calls
      .map(([props]) => (props as { editable?: () => boolean }).editable)
      .filter(Boolean)
      .pop();
    expect(editable?.()).toBe(false);
  });

  it('follows dark mode changes without remounting the editor', async () => {
    const root = document.documentElement;
    const initialClassName = root.className;
    const initialTheme = root.getAttribute('data-theme');
    root.classList.remove('dark');
    root.removeAttribute('data-theme');

    try {
      const { container } = renderWithTheme(<RichEditor id="note-body" />);
      await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
      const host = container.querySelector('#note-body');
      expect(host?.classList.contains('kb-component--dark')).toBe(false);

      root.classList.add('dark');
      await waitFor(() =>
        expect(host?.classList.contains('kb-component--dark')).toBe(true)
      );

      root.classList.remove('dark');
      root.dataset.theme = 'dark';
      await waitFor(() =>
        expect(host?.classList.contains('kb-component--dark')).toBe(true)
      );

      root.removeAttribute('data-theme');
      await waitFor(() =>
        expect(host?.classList.contains('kb-component--dark')).toBe(false)
      );
      // A theme swap is a class swap: the editor was created exactly once.
      expect(coreEditorCreate).toHaveBeenCalledTimes(1);
    } finally {
      root.className = initialClassName;
      if (initialTheme === null) {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', initialTheme);
      }
    }
  });
});

describe('CodeEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    collabKitLoadError = null;
  });

  it('renders without throwing', () => {
    const { container } = renderWithTheme(<CodeEditor lang="javascript" />);
    expect(container.querySelector('.kb-component')).not.toBeNull();
  });

  it('destroys the editor on unmount', () => {
    const { unmount } = renderWithTheme(
      <CodeEditor value="const a = 1;" lang="javascript" />
    );
    unmount();
    expect(editorMock.destroy).toHaveBeenCalled();
  });
});
