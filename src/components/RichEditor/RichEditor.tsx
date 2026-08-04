import React, { useEffect, useRef, useState } from 'react';

import { CoreEditor } from '@kerebron/editor';
import { createAssetLoad } from '@kerebron/wasm/web';

import { createEditorKits, type CollabConfig } from './editorKits';

export type { CollabConfig } from './editorKits';

export interface RichEditorProps {
  /** Initial markdown content to load into the editor. */
  value?: string;
  /** Called with the editor's markdown content whenever it changes. */
  onChange?: (value: string) => void;
  /** Whether to render the live markdown output preview. Defaults to `false`. */
  showPreview?: boolean;
  /**
   * Enable live collaborative editing (Yjs) for the given room. When set, the
   * editor connects to the `/yjs` websocket relay and every peer in the same
   * `room` co-edits one shared document. Uncontrolled like `value` — remount via
   * `key` to switch rooms.
   */
  collab?: CollabConfig;
}

const RichEditor: React.FC<RichEditorProps> = ({
  value = '',
  onChange,
  showPreview = false,
  collab,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstance = useRef<CoreEditor | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [md, setMd] = useState<string>('');

  useEffect(() => {
    if (!editorRef.current) return;
    const element = editorRef.current;

    // Set on cleanup so async continuations (kit loading and the
    // `loadDocumentText` chain) don't touch the editor after `destroy()`.
    let disposed = false;
    let editor: CoreEditor | null = null;

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

    // Initialize the editor. Both modes drop the teardown-unsafe extensions;
    // collaborative mode additionally swaps `history` for the Yjs CRDT sync
    // and lazy-loads the Yjs kit (see `editorKits.ts` for why).
    const setup = async () => {
      const editorKits = await createEditorKits(collab);
      if (disposed) return;

      editor = CoreEditor.create({
        element,
        uri: 'file:///untitled.md',
        assetLoad: createAssetLoad('/kerebron-wasm'),
        editorKits,
      });

      editorInstance.current = editor;
      editor.addEventListener('transaction', onTransaction);

      // Seed initial content, then populate the preview once on mount.
      //
      // In collaborative mode we still load the local markdown first, then join
      // the room: the Yjs binding seeds an *empty* shared document from this
      // content on the first join, and overwrites the editor with the shared
      // content when the room already has edits — so the stored markdown is the
      // starting point without ever double-inserting.
      const joinRoom = () => {
        if (collab && editor && !disposed) {
          (
            editor.run as Record<string, (...args: unknown[]) => boolean>
          ).changeRoom?.(collab.room);
        }
      };

      if (value) {
        await editor.loadDocumentText('text/x-markdown', value);
        await onTransaction();
        joinRoom();
      } else {
        void onTransaction();
        joinRoom();
      }
    };

    setup().catch((err) => console.error('Failed to set up editor:', err));

    // Cleanup on unmount
    return () => {
      disposed = true;
      editorInstance.current = null; // makes onTransaction's guard effective
      editor?.removeEventListener('transaction', onTransaction);
      editor?.destroy();
    };
    // Initial `value`/`collab` are intentionally only applied on mount
    // (uncontrolled). Remount via `key` to switch rooms.
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
