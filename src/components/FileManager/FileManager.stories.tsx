import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FileManager } from './FileManager';

const meta: Meta<typeof FileManager> = {
  id: 'files-filemanager',
  title: 'Modules/Files/FileManager',
  component: FileManager,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**A standing "files on this record" panel: upload card, storage meter and a table of what is already there.** \`FileManager\` renders (top to bottom) an optional dashed drop/click card (\`showDropzone\`, default \`true\`; \`acceptedFileTypes\` → the picker's \`accept\`), an upload \`Progress\` bar while \`isUploading\` with \`uploadProgress\`, an \`errorMessage\` box, a "Used Storage" line from \`totalStorageUsed\` / \`storageLimit\`, and a \`Table\` of \`files: FileItem[]\` (\`id\`, \`filename\`, \`fileSize\`, \`fileExtension\`, optional \`uploadedAt\`, \`uploadedBy\`, \`url\`) with an icon per extension and a per-row ⋯ menu exposing whichever of \`onPreview\`, \`onDownload\`, \`onDelete\` you pass. \`onUpload(files: FileList)\` fires for drops and picks; the host performs the upload and updates \`files\`.

### Use it when

- A record (provider, employer, case) has an **attachment list** the user can add to, download from and prune, and you want the whole block in one component.
- You track a storage quota and want it shown beside the list.

### Don't use it when

- You only need a drag target over content you already render — \`DropzoneOverlay\` + \`useDropzone\`.
- Files are **scanned documents** needing validation, preview, camera capture or AI extraction before upload — \`DocumentScanner\`.
- You need sorting, filtering, selection or many columns — render the rows in \`Table\` / a grid yourself; this table is fixed at Filename · Extension · Size.

### Example

\`\`\`tsx
const { data: files = [] } = useFiles(providerId);
const upload = useUploadFiles(providerId); // { mutate, progress, isPending, error }

<FileManager
  files={files}
  totalStorageUsed={files.reduce((n, f) => n + f.fileSize, 0)}
  storageLimit={5 * 1024 ** 3}
  acceptedFileTypes=".pdf,image/*"
  onUpload={(list) => upload.mutate(Array.from(list))}
  isUploading={upload.isPending}
  uploadProgress={upload.progress}
  errorMessage={upload.error?.message}
  onPreview={(id) => openPreview(files.find((f) => f.id === id)!)}
  onDownload={(id) => window.open(files.find((f) => f.id === id)?.url)}
  onDelete={(id) => confirmDelete(id)}
/>
\`\`\`

The component is stateless about files: every change goes through the host and back in via \`files\`.

### Limitations

- Validation: \`maxFileSize\` is declared in \`FileManagerProps\` but **not read** — no size, count or type check happens on drop (\`acceptedFileTypes\` only filters the picker). Enforce limits in \`onUpload\` and report via \`errorMessage\`.
- Accessibility: the drop card is a clickable \`Card\` (\`div\`) with **no \`role="button"\`, \`tabIndex\` or key handler**, and its \`<input type="file">\` is \`hidden\` and unlabelled — keyboard users cannot open the picker. The row menu button is labelled ("File actions for {filename}", \`aria-haspopup\`/\`aria-expanded\`) and the menu is \`role="menu"\` with \`menuitem\`s, closes on Escape and outside click, but has no arrow-key navigation or focus return. Progress and error text are not \`aria-live\`.
- Drag state uses raw \`onDragOver\`/\`onDragLeave\` without a counter, so the highlight can flicker over child elements. \`uploadedAt\`, \`uploadedBy\` and \`url\` are accepted but **not rendered**.
- i18n: "Add File", "Click or drag and drop", "Drop files here", "Uploading...", "Used Storage", "No Files", column headers and menu labels are hard-coded English; sizes are \`B/KB/MB/GB\` base-1024 with a dot decimal.
- RTL/layout: the menu is portalled to \`document.body\` at \`left: rect.right\` with \`translateX(-100%)\` — physical right alignment; \`text-right\` on the actions cell. The table wraps with \`Table responsive\`.
- Theming: mixes semantic tokens (\`text-muted-foreground\`) with hard-coded \`blue-*\`, \`gray-*\`, \`red-*\`, \`bg-white\` and per-type icon colours. Depends on \`Card\`, \`Progress\`, \`Table\`, \`Icons\`. Entry \`@mieweb/ui\` (also the default export).`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'files-dropzoneoverlay',
          why: 'DropzoneOverlay adds an invisible-until-dragged target to an existing surface; FileManager is a standing upload card with a file table and actions.',
        },
        {
          type: 'alternative to',
          target: 'files-documentscanner',
          why: 'FileManager lists and manages files already on a record; DocumentScanner captures and validates one document and hands it to onScan.',
        },
        {
          type: 'uses',
          target: 'loading-progress',
          why: 'The upload bar while isUploading is a Progress with uploadProgress as its value.',
        },
        {
          type: 'uses',
          target: 'grids-table',
          why: 'The file list is a Table with fixed Filename, Extension and Size columns.',
        },
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof FileManager>;

const mockFiles = [
  {
    id: '1',
    filename: 'medical_license.pdf',
    fileSize: 1024 * 512, // 512 KB
    fileExtension: '.pdf',
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    uploadedBy: { id: 'user-1', name: 'John Smith' },
  },
  {
    id: '2',
    filename: 'insurance_certificate.pdf',
    fileSize: 1024 * 1024 * 2.5, // 2.5 MB
    fileExtension: '.pdf',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    uploadedBy: { id: 'user-2', name: 'Jane Doe' },
  },
  {
    id: '3',
    filename: 'staff_photo.jpg',
    fileSize: 1024 * 1024 * 1.2, // 1.2 MB
    fileExtension: '.jpg',
    uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    uploadedBy: { id: 'user-1', name: 'John Smith' },
  },
  {
    id: '4',
    filename: 'pricing_spreadsheet.xlsx',
    fileSize: 1024 * 256, // 256 KB
    fileExtension: '.xlsx',
    uploadedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    uploadedBy: { id: 'user-3', name: 'Mike Johnson' },
  },
];

export const Default: Story = {
  args: {
    files: mockFiles,
    onUpload: (files) => console.log('Upload:', files),
    onDelete: (id) => console.log('Delete:', id),
    onDownload: (id) => console.log('Download:', id),
    onPreview: (id) => console.log('Preview:', id),
  },
};

export const Empty: Story = {
  args: {
    files: [],
    onUpload: (files) => console.log('Upload:', files),
  },
};

export const WithStorageInfo: Story = {
  args: {
    files: mockFiles,
    totalStorageUsed: 1024 * 1024 * 4.5, // 4.5 MB
    storageLimit: 1024 * 1024 * 100, // 100 MB
    onUpload: (files) => console.log('Upload:', files),
    onDelete: (id) => console.log('Delete:', id),
    onDownload: (id) => console.log('Download:', id),
  },
};

export const Uploading: Story = {
  args: {
    files: mockFiles,
    isUploading: true,
    uploadProgress: 45,
    onDelete: (id) => console.log('Delete:', id),
    onDownload: (id) => console.log('Download:', id),
  },
};

export const WithError: Story = {
  args: {
    files: mockFiles,
    errorMessage: 'File too large. Maximum file size is 10 MB.',
    onUpload: (files) => console.log('Upload:', files),
    onDelete: (id) => console.log('Delete:', id),
  },
};

export const NoDropzone: Story = {
  args: {
    files: mockFiles,
    showDropzone: false,
    onDelete: (id) => console.log('Delete:', id),
    onDownload: (id) => console.log('Download:', id),
  },
};

export const ViewOnly: Story = {
  args: {
    files: mockFiles,
    showDropzone: false,
    onDownload: (id) => console.log('Download:', id),
    onPreview: (id) => console.log('Preview:', id),
  },
};

// Interactive story
function InteractiveFileManager() {
  const [files, setFiles] = useState(mockFiles);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | undefined>();

  const handleUpload = (fileList: FileList) => {
    setError(undefined);

    // Simulate upload
    setIsUploading(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setIsUploading(false);

          // Add files to list
          const newFiles = Array.from(fileList).map((file, index) => ({
            id: String(Date.now() + index),
            filename: file.name,
            fileSize: file.size,
            fileExtension: '.' + file.name.split('.').pop(),
            uploadedAt: new Date(),
            uploadedBy: { id: 'current-user', name: 'Current User' },
          }));

          setFiles((prev) => [...newFiles, ...prev]);
          return 0;
        }
        return p + 10;
      });
    }, 200);
  };

  const handleDelete = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const totalSize = files.reduce((sum, f) => sum + f.fileSize, 0);

  return (
    <div className="max-w-2xl">
      <FileManager
        files={files}
        totalStorageUsed={totalSize}
        storageLimit={1024 * 1024 * 100}
        onUpload={handleUpload}
        onDelete={handleDelete}
        onDownload={(id) => console.log('Download:', id)}
        onPreview={(id) => console.log('Preview:', id)}
        isUploading={isUploading}
        uploadProgress={progress}
        errorMessage={error}
      />
    </div>
  );
}

export const Interactive: Story = {
  render: () => <InteractiveFileManager />,
};
