import React, { useEffect, useRef } from 'react';

import { CoreEditor } from '@kerebron/editor';
import { CodeEditorKit } from '@kerebron/editor-kits/CodeEditorKit';
import { createAssetLoad } from '@kerebron/wasm/web';

export interface CodeEditorProps {
  /** Initial source code to load into the editor. */
  value?: string;
  /** Called with the editor's contents whenever they change. */
  onChange?: (value: string) => void;
  /** Language/grammar to use for syntax highlighting. Defaults to `typescript`. */
  lang?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value = '',
  onChange,
  lang = 'typescript',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<CoreEditor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    const root = editorRef.current;
    if (!root) return;

    const applySelectLabel = () => {
      root
        .querySelectorAll('select.codejar-select')
        .forEach((element) => {
          if (!element.getAttribute('aria-label')) {
            element.setAttribute('aria-label', 'Code editor language');
          }
        });
    };

    applySelectLabel();
    const observer = new MutationObserver(() => applySelectLabel());
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;

    // Initialize the editor
    const editor = CoreEditor.create({
      element: editorRef.current,
      uri: 'file:///untitled.ts',
      assetLoad: createAssetLoad('/kerebron-wasm'),
      editorKits: [new CodeEditorKit(lang)],
    });

    editorInstance.current = editor;

    // Surface edits to callers.
    const onTransaction = async () => {
      if (!editorInstance.current) return;

      try {
        const buffer = await editorInstance.current.saveDocument('text/plain');
        onChangeRef.current?.(new globalThis.TextDecoder().decode(buffer));
      } catch (err) {
        console.error('Failed to read code:', err);
      }
    };

    editor.addEventListener('transaction', onTransaction);

    // Seed initial content on mount.
    if (value) {
      editor
        .loadDocumentText('text/plain', value)
        .catch((err) => console.error('Failed to load code:', err));
    }

    // Cleanup on unmount
    return () => {
      editor.removeEventListener('transaction', onTransaction);
      editor.destroy();
    };
    // Initial `value`/`lang` are intentionally only applied on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div>
        <div ref={editorRef} className="kb-component" />
      </div>
    </div>
  );
};

CodeEditor.displayName = 'CodeEditor';

export { CodeEditor };
