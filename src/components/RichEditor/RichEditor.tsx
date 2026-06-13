import React, { useEffect, useRef, useState } from 'react';

import { CoreEditor } from '@kerebron/editor';
import { AdvancedEditorKit } from '@kerebron/editor-kits/AdvancedEditorKit';
import { createAssetLoad } from '@kerebron/wasm/web';

export interface RichEditorProps {
  /** Initial markdown content to load into the editor. */
  value?: string;
  /** Called with the editor's markdown content whenever it changes. */
  onChange?: (value: string) => void;
  /** Whether to render the live markdown output preview. Defaults to `false`. */
  showPreview?: boolean;
}

const RichEditor: React.FC<RichEditorProps> = ({
  value = '',
  onChange,
  showPreview = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<CoreEditor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [md, setMd] = useState<string>('');

  useEffect(() => {
    if (!editorRef.current) return;

    // Initialize the editor
    const editor = CoreEditor.create({
      element: editorRef.current,
      uri: 'file:///untitled.md',
      assetLoad: createAssetLoad('/kerebron-wasm'),
      editorKits: [new AdvancedEditorKit()],
    });

    editorInstance.current = editor;

    // Listen to transactions and update markdown preview
    const onTransaction = async () => {
      if (!editorInstance.current) return;

      try {
        const buffer =
          await editorInstance.current.saveDocument('text/x-markdown');
        const markdown = new globalThis.TextDecoder().decode(buffer);
        setMd(markdown);
        onChangeRef.current?.(markdown);
      } catch (err) {
        console.error('Failed to save markdown:', err);
      }
    };

    editor.addEventListener('transaction', onTransaction);

    // Seed initial content, then populate the preview once on mount.
    if (value) {
      editor
        .loadDocumentText('text/x-markdown', value)
        .then(() => onTransaction())
        .catch((err) => console.error('Failed to load markdown:', err));
    } else {
      void onTransaction();
    }

    // Cleanup on unmount
    return () => {
      editor.removeEventListener('transaction', onTransaction);
      editor.destroy();
    };
    // Initial `value` is intentionally only applied on mount (uncontrolled).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div>
        <div ref={editorRef} className="kb-component" />
      </div>

      {showPreview && (
        <div>
          <div>
            <h5>Markdown Output</h5>
            <pre>{md}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

RichEditor.displayName = 'RichEditor';

export { RichEditor };
