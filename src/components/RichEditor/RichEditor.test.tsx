import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithTheme } from '../../test/test-utils';
import { RichEditor } from './RichEditor';
import { CodeEditor } from './CodeEditor';

// The Kerebron editor loads tree-sitter WASM grammars at runtime, which isn't
// available under jsdom. Mock the editor so these stay fast, deterministic
// smoke tests that just verify the wrappers mount/unmount without throwing.
const editorMock = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  destroy: vi.fn(),
  loadDocumentText: vi.fn().mockResolvedValue(undefined),
  saveDocument: vi
    .fn()
    .mockResolvedValue(new globalThis.TextEncoder().encode('# hello')),
};

vi.mock('@kerebron/editor', () => ({
  CoreEditor: { create: vi.fn(() => editorMock) },
}));
vi.mock('@kerebron/editor-kits/AdvancedEditorKit', () => ({
  AdvancedEditorKit: vi.fn(),
}));
vi.mock('@kerebron/editor-kits/CodeEditorKit', () => ({
  CodeEditorKit: vi.fn(),
}));
vi.mock('@kerebron/wasm/web', () => ({
  createAssetLoad: vi.fn(() => vi.fn()),
}));

describe('RichEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without throwing', () => {
    const { container } = renderWithTheme(<RichEditor />);
    expect(container.querySelector('.kb-component')).not.toBeNull();
  });

  it('destroys the editor on unmount', () => {
    const { unmount } = renderWithTheme(<RichEditor value="# hi" />);
    unmount();
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
