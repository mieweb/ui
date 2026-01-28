import type { Meta, StoryObj } from '@storybook/react';
import * as React from 'react';
import { DropzoneOverlay, useDropzone } from './DropzoneOverlay';
import { Button } from '../Button';
import { Card } from '../Card';

const meta: Meta<typeof DropzoneOverlay> = {
  title: 'Components/DropzoneOverlay',
  component: DropzoneOverlay,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A visual overlay component shown when dragging files over a drop zone. Includes a custom `useDropzone` hook for managing drag-and-drop file uploads.',
      },
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
        <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
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
        <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
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
        <div className="text-muted-foreground absolute inset-0 flex flex-col items-center justify-center gap-2">
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
                <span className="text-muted-foreground text-xs">
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
              <p className="text-muted-foreground text-sm">
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
              <div className="text-muted-foreground text-4xl">📁</div>
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
                className="bg-muted aspect-square overflow-hidden rounded-lg"
              >
                <img
                  src={src}
                  alt={`Upload ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            <div className="border-muted-foreground/25 text-muted-foreground flex aspect-square items-center justify-center rounded-lg border-2 border-dashed">
              <span className="text-2xl">+</span>
            </div>
          </div>
        ) : (
          <div className="text-muted-foreground flex h-40 flex-col items-center justify-center">
            <div className="mb-2 text-4xl">🖼️</div>
            <p>Drop images here or click to browse</p>
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="mt-4 flex gap-2">
          <Button onClick={() => setImages([])}>Clear All</Button>
          <span className="text-muted-foreground self-center text-sm">
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
        className="border-muted-foreground/25 bg-muted/10 relative h-48 cursor-not-allowed rounded-lg border-2 border-dashed opacity-50"
      >
        <input {...getInputProps()} />
        <DropzoneOverlay isVisible={isDragging} message="Disabled" />
        <div className="text-muted-foreground absolute inset-0 flex items-center justify-center">
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
