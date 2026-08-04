import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { RichEditor } from './RichEditor';
import { CodeEditor } from './CodeEditor';

// The Kerebron editor loads tree-sitter WASM grammars at runtime, which isn't
// available under jsdom. Mock the editor so these stay fast, deterministic
// smoke tests that just verify the wrappers mount/unmount without throwing.
const changeRoom = vi.fn();
const editorMock = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  destroy: vi.fn(),
  loadDocumentText: vi.fn().mockResolvedValue(undefined),
  saveDocument: vi
    .fn()
    .mockResolvedValue(new globalThis.TextEncoder().encode('# hello')),
  run: { changeRoom },
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
      undefined // no WebSocketPolyfill override
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
