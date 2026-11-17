import { useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { createArtifactEditorDemo } from '../../artipod/demo';
import { Button } from '../Button';
import { ArtifactDocumentEditor } from './ArtifactDocumentEditor';
import type { SerializedArtifactDocument } from './types';
import {
  EXTERNAL_IMAGE_EMAIL,
  MDY_DOCUMENT,
  PLAIN_EMAIL,
  RELATED_EMAIL,
  UNICODE_NESTED_EMAIL,
} from './storyData';

type Demo = Awaited<ReturnType<typeof createArtifactEditorDemo>>;

function DemoEditor({
  source,
  format,
  artifactId,
  shared = false,
}: {
  source: string;
  format: 'mime' | 'mdy';
  artifactId: string;
  shared?: boolean;
}) {
  const [demo, setDemo] = useState<Demo | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Opening protected synthetic demo…');
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState('');
  const [showSecondEditor, setShowSecondEditor] = useState(true);
  const urls = useRef(new Set<string>());

  useEffect(() => {
    let disposed = false;
    let instance: Demo | undefined;
    let unsubscribe: (() => void) | undefined;
    setDemo(null);
    setError('');
    setStatus('Opening protected synthetic demo…');
    void createArtifactEditorDemo({
      source,
      format,
      artifactId,
      artipodId: 'synthetic-workshop',
    })
      .then(async (created) => {
        instance = created;
        if (disposed) {
          await created.dispose();
          return;
        }
        unsubscribe = created.controller.subscribe(() => {
          if (created.controller.getSnapshot().locked) {
            setOutput('');
            urls.current.forEach((url) => URL.revokeObjectURL(url));
            urls.current.clear();
          }
        });
        setDemo(created);
        setStatus('Ready. Only synthetic data is used.');
      })
      .catch((reason: unknown) => {
        if (!disposed) {
          setError(reason instanceof Error ? reason.message : String(reason));
          setStatus('The protected demo could not open.');
        }
      });
    const downloads = urls.current;
    return () => {
      disposed = true;
      unsubscribe?.();
      downloads.forEach((url) => URL.revokeObjectURL(url));
      downloads.clear();
      void instance?.dispose().catch(() => {});
    };
  }, [source, format, artifactId]);

  const run = async (operation: () => Promise<void>, success: string) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await operation();
      setStatus(success);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };

  const showOutput = (result: SerializedArtifactDocument, action: string) => {
    const envelope = result.envelope
      ? `\nTransport recipients: ${result.envelope.to.join(', ')}`
      : '';
    setOutput(
      `${action}: ${result.bytes.byteLength.toLocaleString()} bytes (${result.mediaType})${envelope}\n\n${new TextDecoder().decode(result.bytes).slice(0, 4000)}`
    );
  };

  const exportSource = (result: SerializedArtifactDocument) => {
    showOutput(result, 'Exported source');
    const url = URL.createObjectURL(
      new Blob([new Uint8Array(result.bytes)], { type: result.mediaType })
    );
    urls.current.add(url);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${artifactId}.${result.format === 'mime' ? 'eml' : 'mdy'}`;
    link.click();
    setTimeout(() => {
      if (urls.current.delete(url)) URL.revokeObjectURL(url);
    }, 1000);
  };

  return (
    <div className="space-y-4" data-testid="artifact-document-demo">
      <div className="border-border bg-muted/40 space-y-3 rounded-lg border p-4">
        <p className="text-sm">
          Synthetic fixtures run locally. Save persists encrypted OPFS data;
          Reopen loads the last saved document. No mail account or IMAP server
          is needed. Send prepares MIME for inspection without transmitting
          mail.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={!demo || busy}
            onClick={() => {
              demo?.lock();
              setOutput('');
              setStatus('Demo locked. Use Unlock to continue.');
            }}
          >
            Lock
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!demo || busy}
            onClick={() => void run(() => demo!.unlock(), 'Demo unlocked.')}
          >
            Unlock
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!demo || busy}
            onClick={() =>
              void run(
                () => demo!.reopen(),
                'Reopened the last protected save.'
              )
            }
          >
            Reopen saved
          </Button>
          {shared && (
            <Button
              size="sm"
              variant="outline"
              disabled={!demo || busy}
              onClick={() => setShowSecondEditor((visible) => !visible)}
            >
              {showSecondEditor ? 'Hide second editor' : 'Show second editor'}
            </Button>
          )}
        </div>
        <p role="status" className="text-muted-foreground text-sm">
          {busy ? 'Working…' : status}
        </p>
        {error && (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        )}
      </div>
      {demo && (
        <div className={shared ? 'grid gap-4 xl:grid-cols-2' : ''}>
          {Array.from(
            { length: shared && showSecondEditor ? 2 : 1 },
            (_, index) => (
              <div key={index} className="min-w-0 space-y-2">
                {shared && (
                  <h2 className="font-semibold">Shared editor {index + 1}</h2>
                )}
                <ArtifactDocumentEditor
                  controller={demo.controller}
                  onSaveDraft={async (result) => {
                    await demo.save(result);
                    showOutput(result, 'Saved protected draft');
                  }}
                  onSend={(result) =>
                    showOutput(result, 'Prepared delivery; no mail was sent')
                  }
                  onExportSource={exportSource}
                  onError={(reason) =>
                    setError(
                      reason instanceof Error ? reason.message : String(reason)
                    )
                  }
                />
              </div>
            )
          )}
        </div>
      )}
      {output && (
        <details className="border-border rounded-lg border p-3">
          <summary className="cursor-pointer text-sm font-medium">
            Last serialized output
          </summary>
          <pre className="mt-3 max-h-64 overflow-auto text-xs break-words whitespace-pre-wrap">
            {output}
          </pre>
        </details>
      )}
    </div>
  );
}

const meta: Meta<typeof ArtifactDocumentEditor> = {
  id: 'editors-artifactdocumenteditor',
  title: 'Modules/Editors/ArtifactDocumentEditor',
  component: ArtifactDocumentEditor,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

A reusable MIME email viewer/composer and MDY document editor over host-owned shared state and protected Artipod storage. Pass a fetched raw email to the host adapter to display its body, CID media, headers and attachments. Reply, reply all, forward and complete-message serialization belong to this component and its codecs. Ordinary documents prefer MDY when the host does not need MIME.

### Use it when

- A mail client should supply small fetch/save/send adapters while the component handles message presentation and composing.
- A document must retain MDY front matter, share its body across editor views, and save attachments in protected Artipod storage.

### Don't use it when

- The field needs only a formatted body: use [RichEditor](?path=/docs/editors-richeditor--docs).
- You need the established MJML block/layout model: use [EmailEditor](?path=/docs/editors-emaileditor--docs).
- Your application has no authenticated protected-storage integration. The local synthetic Storybook key is only a test fixture.

### Example

\`\`\`tsx
// The host owns this authorized shared controller and its StorageSession.
<ArtifactDocumentEditor
  controller={documentController}
  onSaveDraft={(output) => host.saveDraft(output)}
  onSend={(output) => mailAdapter.send(output.bytes, output.envelope)}
  onExportSource={(output) => host.download(output)}
/>
\`\`\`

### Limitations

- These stories use synthetic raw messages and a hardcoded MDY document. No IMAP or SMTP server is used. Send only prepares bytes for inspection.
- The first codec/storage adapter buffers objects up to 10 MiB. Large-file streaming and overall cache bounds remain future work.
- Outside media and links stay inactive in the sandboxed preview. Encrypted/signed or unsupported message content may be read-only; inspect diagnostics and preserve the original source.
- Shared Views demonstrates two editors borrowing one canonical document in this page. Cross-user transport, eSheet schema integration and synchronization are separate integration work.
- Demo key custody has no account authentication. Use synthetic data only; production requires the host's authenticated key/authorization services.
- Actions have keyboard controls and status/error announcements. Labels are overridable; Kerebron owns its toolbar labels. Layout and prose follow inherited RTL direction; mailbox/date values and address inputs remain LTR islands. Theme colors apply to the surrounding editor; the mail preview is sandboxed.
- Hosts serve Kerebron WASM assets and install the Artipod, Kerebron MIME/document, and Yjs peers required by the optional Artipod entry point.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/artipod',
      peers: [
        '@artipod/core',
        '@kerebron/documents',
        '@kerebron/document-mime',
        'yjs',
      ],
      relationships: [
        {
          type: 'uses',
          target: 'editors-richeditor',
          why: 'Uses RichEditor for the borrowed Kerebron body view while the host owns canonical state and protected storage.',
        },
      ],
    },
  },
  argTypes: {
    controller: {
      description:
        'Host-owned, authorized controller for one shared Artifact and its protected storage.',
      control: false,
    },
    onSaveDraft: {
      description:
        'Persist a serialized MIME draft or MDY document after canonical state is captured.',
      control: false,
    },
    onSend: {
      description:
        'Deliver MIME bytes using the separate transport envelope supplied by the codec.',
      control: false,
    },
    onExportSource: {
      description:
        'Download complete source bytes, retaining imported source when unchanged.',
      control: false,
    },
    onError: {
      description: 'Report a codec, storage, editor, or host callback failure.',
      control: false,
    },
    labels: { description: 'Override component-owned English labels.' },
    assetLoad: {
      description: 'Load Kerebron WASM assets from the host location.',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const PlainEmail: Story = {
  render: () => (
    <DemoEditor source={PLAIN_EMAIL} format="mime" artifactId="plain-email" />
  ),
};

export const InlineImageAndAttachment: Story = {
  render: () => (
    <DemoEditor
      source={RELATED_EMAIL}
      format="mime"
      artifactId="related-email"
    />
  ),
};

export const UnicodeAndNestedMime: Story = {
  render: () => (
    <DemoEditor
      source={UNICODE_NESTED_EMAIL}
      format="mime"
      artifactId="unicode-email"
    />
  ),
};

export const BlockedExternalMedia: Story = {
  render: () => (
    <DemoEditor
      source={EXTERNAL_IMAGE_EMAIL}
      format="mime"
      artifactId="external-email"
    />
  ),
};

export const MdyDocument: Story = {
  render: () => (
    <DemoEditor source={MDY_DOCUMENT} format="mdy" artifactId="mdy-document" />
  ),
};

export const SharedViews: Story = {
  render: () => (
    <DemoEditor
      source={MDY_DOCUMENT}
      format="mdy"
      artifactId="shared-mdy-document"
      shared
    />
  ),
};
