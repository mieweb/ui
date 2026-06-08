// App.tsx or MyEditor.tsx
import React, { useEffect, useRef, useState } from 'react';

import { CoreEditor } from '@kerebron/editor';
import { AdvancedEditorKit } from '@kerebron/editor-kits/AdvancedEditorKit';
import { createAssetLoad } from '@kerebron/wasm/web';

const RichEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<CoreEditor | null>(null);

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
        const markdown = new TextDecoder().decode(buffer);
        setMd(markdown);
      } catch (err) {
        console.error('Failed to save markdown:', err);
      }
    };

    editor.addEventListener('transaction', onTransaction);

    // Cleanup on unmount
    return () => {
      editor.removeEventListener('transaction', onTransaction);
      editor.destroy();
    };
  }, []);

  return (
    <div>
      <div>
        <div ref={editorRef} className="kb-component" />
      </div>

      <div>
        <div>
          <h5>Markdown Output</h5>
          <pre>{md || 'Loading...'}</pre>
        </div>
      </div>
    </div>
  );
};

RichEditor.displayName = 'RichEditor';

export { RichEditor };
