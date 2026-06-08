// App.tsx or MyEditor.tsx
import React, { useEffect, useRef } from 'react';

import { CoreEditor } from '@kerebron/editor';
import { CodeEditorKit } from '@kerebron/editor-kits/CodeEditorKit';
import { createAssetLoad } from '@kerebron/wasm/web';

const CodeEditor: React.FC = () => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<CoreEditor | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Initialize the editor
    const editor = CoreEditor.create({
      element: editorRef.current,
      uri: 'file:///untitled.ts',
      assetLoad: createAssetLoad('/kerebron-wasm'),
      editorKits: [new CodeEditorKit('typescript')],
    });

    editorInstance.current = editor;

    // Cleanup on unmount
    return () => {
      editor.destroy();
    };
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
