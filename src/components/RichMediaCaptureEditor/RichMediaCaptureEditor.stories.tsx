import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SquareDashed } from 'lucide-react';
import { RichMediaCaptureEditor } from './RichMediaCaptureEditor';
import type { RichEditorHandle } from '../RichEditor';
import type { ScanDocument } from './captureCore';

/** Stand-in for the native document camera so Storybook can show Scan document. */
const mockScanDocument: ScanDocument = async () => {
  const canvas = document.createElement('canvas');
  canvas.width = 850;
  canvas.height = 1100;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.font = '48px sans-serif';
    ctx.fillText('Scanned document', 60, 120);
  }
  const blob = await new Promise<Blob | null>((r) =>
    canvas.toBlob(r, 'image/jpeg')
  );
  return blob
    ? [new File([blob], `document-${Date.now()}.jpg`, { type: 'image/jpeg' })]
    : [];
};

/**
 * Pretends to upload: returns an object URL so the demo image actually
 * renders. A real media store returns a persistent https URL instead — an
 * unreachable src leaves a broken-image glyph in the document.
 */
const mockUploadHandler = async (file: File) => {
  await new Promise((r) => setTimeout(r, 300));
  return URL.createObjectURL(file);
};

const meta: Meta<typeof RichMediaCaptureEditor> = {
  id: 'editors-richmediacaptureeditor',
  title: 'Modules/Editors/RichMediaCaptureEditor',
  component: RichMediaCaptureEditor,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**[RichEditor](?path=/docs/editors-richeditor--docs) with a docked capture ribbon.** The ribbon offers **Capture image** (camera / photo picker), **Capture screen** (a still screenshot via \`getDisplayMedia\`), **Attach file** and **Scan document** (the native iOS/Android document camera through a Capacitor/Cordova plugin, or a \`scanDocument\` adapter) — and every capture lands **in the document as an image/video node at the cursor**, through \`RichEditorHandle.insertFiles\` and the editor's \`mediaUpload\` pipeline. Hosts append their own actions via \`extraCaptures\`; captures a runtime cannot perform (screen capture in WebViews, document scan on the plain web) are hidden, each action's \`available\` flag. All other props are \`RichEditorProps\`, forwarded as-is; the ref is a \`RichEditorHandle\`.

Promoted from the [Composer Action Ribbon (POC)](?path=/docs/chat-chatcomposer-action-ribbon-poc--docs) (mieweb/ui#733, epic mieweb/ui#728). **The component name is a working name pending stakeholder sign-off.**

Ships from the **\`@mieweb/ui/kerebron\`** entry with the same peer/WASM setup as [RichEditor](?path=/docs/editors-richeditor--docs).

### Use it when

- A **Markdown document** (notes, documentation, narratives) should be assembled from more than typing: screenshots, camera photos, scanned paperwork, existing files.
- The host runs on the **web and in Cordova/Capacitor shells** and the capture set should adapt to each runtime.

### Don't use it when

- You are attaching files to a **chat message**, not inserting them into a document — [ChatComposer](?path=/docs/chat-chatcomposer--docs) (its \`+\` menu and \`addFiles\` already do this).
- The field is a **comment-sized HTML surface**, not a Markdown document — [TextAreaRich (Kerebron)](?path=/docs/editors-textarearich-kerebron--docs) docks this same ribbon via its \`mediaCapture\` opt-in.
- You need the plain editor — [RichEditor](?path=/docs/editors-richeditor--docs), or call its \`insertFiles\` handle method from your own UI.
- You need **recordings or dictation**: the markdown schema has no audio node and live voice-to-text is a different model — both tracked under mieweb/ui#728, out of scope here.
- You need **one document turned into fields** (ID, insurance card) with preview and extraction — [DocumentScanner](?path=/docs/files-documentscanner--docs).

### Set \`uploadHandler\` if documents are persisted

Without \`mediaUpload.uploadHandler\`, a captured image embeds in the markdown as a **base64 \`data:\` URL** (a 4 MB screenshot becomes ~5.8 MB of markdown) and a video becomes an object URL that dies on reload — same contract as pasting into RichEditor. With it, the document carries plain URLs:

\`\`\`tsx
const editorRef = useRef<RichEditorHandle>(null);

<RichMediaCaptureEditor
  ref={editorRef}
  aria-label="Visit note"
  value={note.markdown}
  mediaUpload={{ uploadHandler: (file) => uploadToMediaStore(file) }}
  onChange={setDraft}
/>
// editorRef.current.insertFiles?.(files) works here too — the ribbon uses it.
\`\`\`

### Captures are conditional

| Item | Needs | Browser | Cordova / Capacitor (iOS, Android) |
| --- | --- | --- | --- |
| Capture image | \`<input type="file" accept="image/*">\` | yes | yes (native photo picker / camera sheet) |
| Capture screen (still) | \`getDisplayMedia\` | desktop | hidden (WebViews lack it) |
| Attach file | \`<input type="file">\` | yes | yes |
| Scan document | native document camera plugin | hidden | \`capacitor-document-scanner\` / \`cordova-plugin-document-scanner\`, auto-detected; or pass \`scanDocument\` |
| Custom | host \`extraCaptures\` | — | — |

Files that cannot land as an image/video node (a PDF through Attach file, an oversize image) are skipped and announced in the status line, never thrown.

### Limitations

- **Native document-scanner adapters are unverified on devices**; Storybook exercises Scan document through a mock.
- The markdown schema has image and video nodes only — no audio.
- Captures insert **at the caret**, like paste. A caret inside a heading drops the image on markdown serialization (headings cannot carry images); concurrent edits during a slow upload can shift the insertion point.
- Strings externalize through the shared \`MessagesProvider\` contract (English defaults).`,
      },
    },
    catalog: {
      relationships: [
        {
          type: 'uses',
          target: 'editors-richeditor',
          why: 'It is RichEditor plus a docked CaptureRibbon; captures are inserted through RichEditorHandle.insertFiles and the mediaUpload pipeline.',
        },
        {
          type: 'uses',
          target: 'overlays-tooltip',
          why: 'Ribbon buttons are icon-only; Tooltip shows each capture’s name on hover and focus.',
        },
        {
          type: 'composes with',
          target: 'editors-textarearich-kerebron',
          why: 'TextAreaRich (Kerebron)’s mediaCapture opt-in docks this component’s capture ribbon above the comment field, through the shared CaptureDock and the same insertFiles pipeline.',
        },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * No `uploadHandler`: captures embed as base64 `data:` URLs, exactly like
 * pasting an image into RichEditor. Fine for drafts, wrong for persistence.
 */
export const Default: Story = {
  args: {
    'aria-label': 'Document with media capture',
    value: '# Trip report\n\nCapture something with the ribbon above.\n',
  },
};

/** The persistence-ready setup: every capture becomes a URL in the markdown. */
export const WithUploadHandler: Story = {
  render: function WithUploadHandlerStory() {
    const editorRef = useRef<RichEditorHandle>(null);
    const [markdown, setMarkdown] = useState('');
    return (
      <div className="flex flex-col gap-2">
        <RichMediaCaptureEditor
          ref={editorRef}
          aria-label="Document with media capture"
          value={'# Incident write-up\n\nAttach evidence below.\n'}
          mediaUpload={{ uploadHandler: mockUploadHandler }}
          onChange={setMarkdown}
        />
        <pre
          data-testid="markdown-output"
          className="max-h-40 overflow-auto text-xs"
        >
          {markdown}
        </pre>
      </div>
    );
  },
};

/**
 * Simulates a Cordova/Capacitor shell with a native document scanner, plus an
 * empty host slot showing where a custom capture plugs in via `extraCaptures`.
 */
export const NativeWithDocument: Story = {
  args: {
    'aria-label': 'Document with media capture',
    value: '# Intake\n\nScan the paperwork.\n',
    scanDocument: mockScanDocument,
    extraCaptures: [
      {
        id: 'custom-slot',
        label: 'Custom capture (empty slot)',
        icon: (
          <SquareDashed
            className="h-4 w-4 text-neutral-400"
            aria-hidden="true"
          />
        ),
        run: () => {},
      },
    ],
  },
};
