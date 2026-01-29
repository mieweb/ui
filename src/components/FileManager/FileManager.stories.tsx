import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FileManager } from './FileManager';

const meta: Meta<typeof FileManager> = {
  title: 'Components/FileManager',
  component: FileManager,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
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
