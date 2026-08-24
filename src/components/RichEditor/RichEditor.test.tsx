import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRef } from 'react';
import { waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { RichEditor, type RichEditorHandle } from './RichEditor';
import { CodeEditor } from './CodeEditor';

// The Kerebron editor loads tree-sitter WASM grammars at runtime, which isn't
// available under jsdom. Mock the editor so these stay fast, deterministic
// smoke tests that just verify the wrappers mount/unmount without throwing.
const changeRoom = vi.fn();
const setProps = vi.fn();
const editorMock = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  destroy: vi.fn(),
  loadDocumentText: vi.fn().mockResolvedValue(undefined),
  saveDocument: vi
    .fn()
    .mockResolvedValue(new globalThis.TextEncoder().encode('# hello')),
  run: { changeRoom },
  view: { setProps },
};

const coreEditorCreate = vi.fn((_opts: unknown) => editorMock);
vi.mock('@kerebron/editor', () => ({
  CoreEditor: { create: (opts: unknown) => coreEditorCreate(opts) },
}));
vi.mock('@kerebron/editor-kits/AdvancedEditorKit', () => ({
  AdvancedEditorKit: vi.fn(() => ({ getExtensions: () => [] })),
}));
vi.mock('@kerebron/editor-kits/CodeEditorKit', () => ({
  CodeEditorKit: vi.fn(),
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
vi.mock('./collabKit', () => ({
  HuddleYjsKit: huddleYjsKit,
  defaultWsUrl: () => 'ws://localhost/yjs',
}));

describe('RichEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    renderWithTheme(<RichEditor ref={ref} />);
    await waitFor(() => expect(coreEditorCreate).toHaveBeenCalled());
    await expect(ref.current?.getContent()).resolves.toBe('# hello');
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

    const onTransaction = editorMock.addEventListener.mock.calls.find(
      ([event]) => event === 'transaction'
    )?.[1] as () => Promise<void>;
    await onTransaction();
    expect(onChange).not.toHaveBeenCalled();

    finishLoad();
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
