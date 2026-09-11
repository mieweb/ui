import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';

import { Button } from '../Button';
import { Card } from '../Card';
import { DropzoneOverlay, useDropzone } from './DropzoneOverlay';

const meta: Meta<typeof DropzoneOverlay> = {
  id: 'files-dropzoneoverlay',
  title: 'Modules/Files/DropzoneOverlay',
  component: DropzoneOverlay,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

**Turning an existing area into a drop target, and showing "drop here" while a drag is over it.** Two exports: \`DropzoneOverlay\` is the visual — a dashed \`fixed inset-0\` (or \`absolute inset-0\` with \`size="compact"\`) layer with an icon (\`upload\` | \`file\` | \`folder\` | your node) and a \`message\`, rendered only while \`isVisible\`; \`useDropzone({ onDrop, accept?, multiple?, disabled? })\` is the behaviour — it returns \`isDragging\` (counter-based, so child enter/leave does not flicker), \`getRootProps()\` for the drag handlers, \`getInputProps()\` for a hidden \`<input type="file">\`, and \`open()\` to launch the picker. The host decides what happens to the \`File[]\`.

### Use it when

- A **page or panel you already have** (a message thread, a record, an editor) should accept dropped files without adding a permanent upload widget; the overlay appears only during the drag.
- You need drag-and-drop plus a "Browse" button but want to render the list, progress and errors yourself.

### Don't use it when

- You want a **standing upload area with a file table**, storage meter and per-file actions — \`FileManager\`.
- The files are **documents to scan** (camera/webcam, validation, preview, AI extraction) — \`DocumentScanner\`.
- Users need a clear affordance when nothing is being dragged — the overlay is invisible until then; pair it with a visible \`Button\` calling \`open()\` or use \`FileManager\`.

### Example

\`\`\`tsx
const [queue, setQueue] = useState<File[]>([]);
const { isDragging, getRootProps, getInputProps, open } = useDropzone({
  onDrop: (files) => setQueue((q) => [...q, ...files]),
  accept: ['image/*', 'application/pdf'],
  multiple: true,
  disabled: uploading,
});

<section {...getRootProps()} className="relative min-h-[320px]">
  <input {...getInputProps()} aria-label="Attach files" />
  <DropzoneOverlay isVisible={isDragging} size="compact" variant="primary" message="Drop to attach" />
  <Button variant="outline" onClick={open}>Attach files</Button>
  <AttachmentList files={queue} onRemove={(f) => setQueue((q) => q.filter((x) => x !== f))} />
</section>
\`\`\`

\`size="compact"\` positions inside the nearest \`relative\` ancestor; the default covers the viewport.

### Limitations

- Accessibility: the overlay is \`role="status" aria-live="polite"\`, so the \`message\` is announced when it appears — but it appears only for **pointer drags**; keyboard and screen-reader users need the \`open()\` button you provide. \`getInputProps()\` renders \`display: none\` with no label — add \`aria-label\` yourself. Nothing announces the drop result; \`onDrop\` is your hook for that.
- The hook does **no validation**: \`accept\` is passed to the picker only (dropped files of any type are delivered) and there is no size limit, count limit or duplicate check. With \`multiple: false\` only the first dropped file is kept.
- The default \`message\` ("Drop to upload file") is English. Icons come from \`lucide-react\`.
- Layout/RTL: the overlay is symmetric and centred; \`z-50\` may sit under other fixed chrome. Because the default is \`fixed inset-0\`, several overlays on one page stack; use \`compact\` for per-region targets.
- Theming: \`bg-background/90\`, \`border-border\`, \`text-muted-foreground\`; \`primary\` and \`success\` variants use \`/10\` tints. Entry \`@mieweb/ui\` (also the default export).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'files-filemanager',
          why: 'DropzoneOverlay adds an invisible-until-dragged target to an existing surface; FileManager is a standing upload card with a file table and actions.',
        },
        {
          type: 'alternative to',
          target: 'files-documentscanner',
          why: 'DropzoneOverlay delivers raw File[] with no validation or preview; DocumentScanner validates, previews, adds camera/webcam capture and sends to onScan.',
        },
      ],
    },
  },
  argTypes: {
    isVisible: {
      control: 'boolean',
      description: 'Whether the overlay is visible',
    },
    message: {
      control: 'text',
      description: 'Message to display in the overlay',
    },
    icon: {
      control: 'select',
      options: ['upload', 'file', 'folder'],
      description: 'Icon to display',
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success'],
      description: 'Color variant of the overlay',
    },
    size: {
      control: 'select',
      options: ['default', 'compact'],
      description: 'Size variant of the overlay',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DropzoneOverlay>;

// Basic visible overlay
export const Default: Story = {
  args: {
    isVisible: true,
    message: 'Drop files to upload',
    icon: 'upload',
    variant: 'default',
  },
  decorators: [
    (Story) => (
      <div className="border-muted-foreground/25 bg-muted/10 relative h-96 rounded-lg border-2 border-dashed">
        <Story />
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <p>Drag files here or click to upload</p>
        </div>
      </div>
    ),
  ],
};

// Hidden state
export const Hidden: Story = {
  args: {
    isVisible: false,
    message: 'Drop files to upload',
  },
  decorators: [
    (Story) => (
      <div className="border-muted-foreground/25 bg-muted/10 relative h-96 rounded-lg border-2 border-dashed">
        <Story />
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <p>Overlay is hidden - set isVisible to true to see it</p>
        </div>
      </div>
    ),
  ],
};

// File icon variant
export const FileIcon: Story = {
  args: {
    isVisible: true,
    message: 'Drop document to attach',
    icon: 'file',
  },
  decorators: Default.decorators,
};

// Folder icon variant
export const FolderIcon: Story = {
  args: {
    isVisible: true,
    message: 'Drop folder to upload',
    icon: 'folder',
  },
  decorators: Default.decorators,
};

// Compact variant
export const Compact: Story = {
  args: {
    isVisible: true,
    message: 'Drop here',
    icon: 'upload',
    size: 'compact',
  },
  decorators: [
    (Story) => (
      <div className="border-muted-foreground/25 bg-muted/10 relative h-32 rounded-lg border-2 border-dashed">
        <Story />
      </div>
    ),
  ],
};

// Interactive demo with useDropzone hook
function InteractiveDemo() {
  const [files, setFiles] = React.useState<File[]>([]);

  const { isDragging, getRootProps, getInputProps, open } = useDropzone({
    onDrop: (newFiles) => {
      setFiles((prev) => [...prev, ...newFiles]);
    },
    multiple: true,
    accept: ['image/*', '.pdf', '.doc', '.docx'],
  });

  return (
    <div className="space-y-4 p-8">
      <div
        {...getRootProps()}
        className="border-muted-foreground/25 bg-muted/10 hover:bg-muted/20 relative h-64 cursor-pointer rounded-lg border-2 border-dashed transition-colors"
      >
        <input {...getInputProps()} />
        <DropzoneOverlay
          isVisible={isDragging}
          message="Drop files to upload"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <p className="text-sm">Drag files here or click to upload</p>
          <p className="text-xs">Accepts: Images, PDF, Word documents</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={open}>Choose Files</Button>
        {files.length > 0 && (
          <Button variant="outline" onClick={() => setFiles([])}>
            Clear ({files.length})
          </Button>
        )}
      </div>

      {files.length > 0 && (
        <Card className="p-4">
          <h4 className="mb-2 font-medium">Uploaded Files:</h4>
          <ul className="space-y-1 text-sm">
            {files.map((file, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-muted-foreground">📄</span>
                <span>{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Interactive demo using the `useDropzone` hook. Try dragging files onto the drop zone or clicking to select files.',
      },
    },
  },
};

// Document upload context
function DocumentUploadDemo() {
  const [file, setFile] = React.useState<File | null>(null);

  const { isDragging, getRootProps, getInputProps, open } = useDropzone({
    onDrop: (files) => {
      setFile(files[0] ?? null);
    },
    accept: ['.pdf', '.doc', '.docx'],
    multiple: false,
  });

  return (
    <div className="mx-auto max-w-md p-8">
      <Card className="p-6">
        <h3 className="mb-4 font-semibold">Upload Medical Document</h3>

        <div
          {...getRootProps()}
          className="border-muted-foreground/25 hover:bg-muted/10 relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors"
        >
          <input {...getInputProps()} />
          <DropzoneOverlay
            isVisible={isDragging}
            message="Drop document here"
            icon="file"
            size="compact"
          />

          {file ? (
            <div className="space-y-2">
              <div className="text-4xl">📄</div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                Remove
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-4xl text-muted-foreground">📁</div>
              <p className="text-muted-foreground">
                Drop a PDF or Word document here
              </p>
              <Button variant="outline" size="sm" onClick={open}>
                Browse Files
              </Button>
            </div>
          )}
        </div>

        {file && <Button className="mt-4 w-full">Upload Document</Button>}
      </Card>
    </div>
  );
}

export const DocumentUpload: Story = {
  render: () => <DocumentUploadDemo />,
  parameters: {
    docs: {
      description: {
        story:
          'Single file upload for medical documents with compact overlay variant.',
      },
    },
  },
};

// Image gallery upload
function ImageGalleryDemo() {
  const [images, setImages] = React.useState<string[]>([]);

  const { isDragging, getRootProps, getInputProps } = useDropzone({
    onDrop: (files) => {
      const newImages = files.map((file) => URL.createObjectURL(file));
      setImages((prev) => [...prev, ...newImages]);
    },
    accept: ['image/*'],
    multiple: true,
  });

  return (
    <div className="p-8">
      <h3 className="mb-4 font-semibold">Upload Images</h3>

      <div
        {...getRootProps()}
        className="border-muted-foreground/25 hover:bg-muted/10 relative min-h-48 cursor-pointer rounded-lg border-2 border-dashed p-4 transition-colors"
      >
        <input {...getInputProps()} />
        <DropzoneOverlay
          isVisible={isDragging}
          message="Drop images here"
          icon="upload"
        />

        {images.length > 0 ? (
          <div className="grid grid-cols-4 gap-4">
            {images.map((src, i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-lg bg-muted"
              >
                <img
                  src={src}
                  alt={`Upload ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            <div className="border-muted-foreground/25 flex aspect-square items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground">
              <span className="text-2xl">+</span>
            </div>
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
            <div className="mb-2 text-4xl">🖼️</div>
            <p>Drop images here or click to browse</p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="mt-4 flex gap-2">
          <Button onClick={() => setImages([])}>Clear All</Button>
          <span className="self-center text-sm text-muted-foreground">
            {images.length} image(s) selected
          </span>
        </div>
      )}
    </div>
  );
}

export const ImageGallery: Story = {
  render: () => <ImageGalleryDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Multi-image upload with preview gallery.',
      },
    },
  },
};

// Mobile viewport
export const Mobile: Story = {
  args: {
    isVisible: true,
    message: 'Drop to upload',
    icon: 'upload',
    size: 'compact',
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
  decorators: [
    (Story) => (
      <div className="border-muted-foreground/25 bg-muted/10 relative m-4 h-48 rounded-lg border-2 border-dashed">
        <Story />
      </div>
    ),
  ],
};

// Disabled state demo
function DisabledDemo() {
  const { isDragging, getRootProps, getInputProps } = useDropzone({
    onDrop: () => {},
    disabled: true,
  });

  return (
    <div className="p-8">
      <div
        {...getRootProps()}
        className="border-muted-foreground/25 bg-muted/10 relative h-48 cursor-not-allowed rounded-lg border-2 border-dashed"
      >
        <input {...getInputProps()} />
        <DropzoneOverlay isVisible={isDragging} message="Disabled" />
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <p>Upload disabled</p>
        </div>
      </div>
    </div>
  );
}

export const Disabled: Story = {
  render: () => <DisabledDemo />,
  parameters: {
    docs: {
      description: {
        story: 'Dropzone in disabled state - drag events are ignored.',
      },
    },
  },
};
