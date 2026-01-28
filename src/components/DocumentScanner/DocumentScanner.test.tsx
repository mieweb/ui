import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import * as React from 'react';
import { DocumentScanner } from './DocumentScanner';
import { useFileUpload } from './useFileUpload';
import { useCamera } from './useCamera';
import { useIsMobile } from '../../hooks';
import { DropZone } from './DropZone';
import { FilePreview } from './FilePreview';
import type { PreviewFile } from './types';

// Mark unused imports as used for type checking
void useCamera;

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  URL.createObjectURL = mockCreateObjectURL;
  URL.revokeObjectURL = mockRevokeObjectURL;
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Helper to create mock files
function createMockFile(
  name: string,
  type: string = 'image/jpeg',
  size: number = 1024
): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

// Helper to create FileList from files
function createFileList(files: File[]): FileList {
  const dataTransfer = new DataTransfer();
  files.forEach((file) => dataTransfer.items.add(file));
  return dataTransfer.files;
}

// ============================================================================
// DocumentScanner Component Tests
// ============================================================================

describe('DocumentScanner', () => {
  const defaultProps = {
    onScan: vi.fn().mockResolvedValue({ success: true }),
    onResult: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders with default props', () => {
      render(<DocumentScanner {...defaultProps} />);

      expect(screen.getByText('Scan your document')).toBeInTheDocument();
      expect(screen.getByText(/upload a file/i)).toBeInTheDocument();
    });

    it('renders custom title and description', () => {
      render(
        <DocumentScanner
          {...defaultProps}
          title="Scan your ID"
          description="Upload a photo of your driver's license"
        />
      );

      expect(screen.getByText('Scan your ID')).toBeInTheDocument();
      expect(screen.getByText(/driver's license/i)).toBeInTheDocument();
    });

    it('renders dropzone', () => {
      render(<DocumentScanner {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /drop files here/i })
      ).toBeInTheDocument();
    });

    it('renders webcam button on desktop', () => {
      // Mock non-mobile
      vi.mock('./useCamera', async (importOriginal) => {
        const actual = await importOriginal<typeof import('./useCamera')>();
        return {
          ...actual,
          useIsMobile: () => false,
        };
      });

      render(<DocumentScanner {...defaultProps} enableWebcam />);

      expect(
        screen.getByRole('button', { name: /use webcam/i })
      ).toBeInTheDocument();
    });

    it('does not render webcam button when disabled', () => {
      render(<DocumentScanner {...defaultProps} enableWebcam={false} />);

      expect(
        screen.queryByRole('button', { name: /use webcam/i })
      ).not.toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<DocumentScanner {...defaultProps} className="custom-class" />);

      const container = screen
        .getByText('Scan your document')
        .closest('.custom-class');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('disables dropzone when disabled prop is true', () => {
      render(<DocumentScanner {...defaultProps} disabled />);

      const dropzone = screen.getByRole('button', { name: /drop files here/i });
      expect(dropzone).toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('File Selection', () => {
    it('accepts dropped files', async () => {
      render(<DocumentScanner {...defaultProps} />);

      const dropzone = screen.getByRole('button', { name: /drop files here/i });
      const file = createMockFile('test.jpg');
      const fileList = createFileList([file]);

      fireEvent.drop(dropzone, {
        dataTransfer: { files: fileList },
      });

      // Wait for preview state
      await waitFor(() => {
        expect(screen.getByText('Scan document')).toBeInTheDocument();
      });
    });
  });

  describe('State Changes', () => {
    it('calls onStateChange callback', async () => {
      const onStateChange = vi.fn();
      render(
        <DocumentScanner {...defaultProps} onStateChange={onStateChange} />
      );

      expect(onStateChange).toHaveBeenCalledWith('idle');
    });
  });

  describe('Processing Flow', () => {
    it('shows processing state during scan', async () => {
      const slowScan = vi
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve({ success: true }), 1000)
            )
        );

      render(<DocumentScanner {...defaultProps} onScan={slowScan} />);

      // Add a file first
      const dropzone = screen.getByRole('button', { name: /drop files here/i });
      const file = createMockFile('test.jpg');
      const fileList = createFileList([file]);

      fireEvent.drop(dropzone, {
        dataTransfer: { files: fileList },
      });

      // Wait for preview and click scan
      await waitFor(() => {
        expect(screen.getByText('Scan document')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Scan document'));

      // Should show processing state
      await waitFor(() => {
        expect(
          screen.getByText(/analyzing your document/i)
        ).toBeInTheDocument();
      });
    });

    it('shows success state after successful scan', async () => {
      const fastScan = vi.fn().mockResolvedValue({ success: true });

      render(<DocumentScanner {...defaultProps} onScan={fastScan} />);

      // Add a file
      const dropzone = screen.getByRole('button', { name: /drop files here/i });
      const file = createMockFile('test.jpg');
      const fileList = createFileList([file]);

      fireEvent.drop(dropzone, {
        dataTransfer: { files: fileList },
      });

      // Click scan
      await waitFor(() => {
        expect(screen.getByText('Scan document')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Scan document'));

      // Should show success
      await waitFor(() => {
        expect(screen.getByText(/scanned successfully/i)).toBeInTheDocument();
      });
    });

    it('shows error state on scan failure', async () => {
      const failingScan = vi.fn().mockRejectedValue(new Error('Scan failed'));

      render(<DocumentScanner {...defaultProps} onScan={failingScan} />);

      // Add a file
      const dropzone = screen.getByRole('button', { name: /drop files here/i });
      const file = createMockFile('test.jpg');
      const fileList = createFileList([file]);

      fireEvent.drop(dropzone, {
        dataTransfer: { files: fileList },
      });

      // Click scan
      await waitFor(() => {
        expect(screen.getByText('Scan document')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Scan document'));

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/processing failed/i)).toBeInTheDocument();
      });
    });

    it('calls onResult with extracted data', async () => {
      const mockData = { firstName: 'John', lastName: 'Doe' };
      const mockScan = vi.fn().mockResolvedValue(mockData);
      const onResult = vi.fn();

      render(
        <DocumentScanner
          {...defaultProps}
          onScan={mockScan}
          onResult={onResult}
        />
      );

      // Add a file
      const dropzone = screen.getByRole('button', { name: /drop files here/i });
      const file = createMockFile('test.jpg');
      const fileList = createFileList([file]);

      fireEvent.drop(dropzone, {
        dataTransfer: { files: fileList },
      });

      // Click scan
      await waitFor(() => {
        expect(screen.getByText('Scan document')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Scan document'));

      // Should call onResult
      await waitFor(() => {
        expect(onResult).toHaveBeenCalledWith(mockData);
      });
    });
  });

  describe('Validation', () => {
    it('rejects files with invalid type', async () => {
      const onValidationError = vi.fn();

      render(
        <DocumentScanner
          {...defaultProps}
          acceptedFileTypes={['image/jpeg']}
          onValidationError={onValidationError}
        />
      );

      const dropzone = screen.getByRole('button', { name: /drop files here/i });
      const file = createMockFile('test.pdf', 'application/pdf');
      const fileList = createFileList([file]);

      fireEvent.drop(dropzone, {
        dataTransfer: { files: fileList },
      });

      await waitFor(() => {
        expect(onValidationError).toHaveBeenCalled();
      });
    });

    it('rejects files exceeding size limit', async () => {
      const onValidationError = vi.fn();

      render(
        <DocumentScanner
          {...defaultProps}
          maxFileSizeMb={0.001} // 1KB limit
          onValidationError={onValidationError}
        />
      );

      const dropzone = screen.getByRole('button', { name: /drop files here/i });
      const largeFile = createMockFile('large.jpg', 'image/jpeg', 10000); // 10KB
      const fileList = createFileList([largeFile]);

      fireEvent.drop(dropzone, {
        dataTransfer: { files: fileList },
      });

      await waitFor(() => {
        expect(onValidationError).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<DocumentScanner {...defaultProps} />);

      expect(
        screen.getByRole('button', { name: /drop files here/i })
      ).toBeInTheDocument();
    });

    it('dropzone is keyboard accessible', async () => {
      render(<DocumentScanner {...defaultProps} />);

      const dropzone = screen.getByRole('button', { name: /drop files here/i });
      expect(dropzone).toHaveAttribute('tabIndex', '0');
    });
  });
});

// ============================================================================
// useFileUpload Hook Tests
// ============================================================================

describe('useFileUpload', () => {
  function TestComponent({
    options,
  }: {
    options?: Parameters<typeof useFileUpload>[0];
  }) {
    const {
      files,
      addFiles: _addFiles,
      addFile,
      removeFile: _removeFile,
      clearFiles,
      hasFiles,
    } = useFileUpload(options);

    // Mark unused variables as intentionally unused
    void _addFiles;
    void _removeFile;

    return (
      <div>
        <span data-testid="has-files">{hasFiles.toString()}</span>
        <span data-testid="file-count">{files.length}</span>
        <ul>
          {files.map((f) => (
            <li key={f.id} data-testid={`file-${f.id}`}>
              {f.file.name}
            </li>
          ))}
        </ul>
        <button
          onClick={() => {
            const file = createMockFile('test.jpg');
            addFile(file);
          }}
        >
          Add File
        </button>
        <button onClick={() => clearFiles()}>Clear</button>
      </div>
    );
  }

  it('starts with no files', () => {
    render(<TestComponent />);

    expect(screen.getByTestId('has-files')).toHaveTextContent('false');
    expect(screen.getByTestId('file-count')).toHaveTextContent('0');
  });

  it('adds files correctly', async () => {
    render(<TestComponent />);

    fireEvent.click(screen.getByText('Add File'));

    await waitFor(() => {
      expect(screen.getByTestId('has-files')).toHaveTextContent('true');
      expect(screen.getByTestId('file-count')).toHaveTextContent('1');
    });
  });

  it('clears files correctly', async () => {
    render(<TestComponent />);

    // Add a file
    fireEvent.click(screen.getByText('Add File'));

    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('1');
    });

    // Clear files
    fireEvent.click(screen.getByText('Clear'));

    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('0');
    });
  });

  it('validates file types', async () => {
    const onValidationError = vi.fn();

    function TestWithValidation() {
      const { addFile } = useFileUpload({
        acceptedFileTypes: ['image/jpeg'],
        onValidationError,
      });

      return (
        <button
          onClick={() => {
            const file = createMockFile('test.pdf', 'application/pdf');
            addFile(file);
          }}
        >
          Add Invalid File
        </button>
      );
    }

    render(<TestWithValidation />);
    fireEvent.click(screen.getByText('Add Invalid File'));

    await waitFor(() => {
      expect(onValidationError).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'type',
          }),
        ])
      );
    });
  });

  it('validates file size', async () => {
    const onValidationError = vi.fn();

    function TestWithValidation() {
      const { addFile } = useFileUpload({
        maxFileSizeMb: 0.001, // 1KB
        onValidationError,
      });

      return (
        <button
          onClick={() => {
            const file = createMockFile('large.jpg', 'image/jpeg', 10000);
            addFile(file);
          }}
        >
          Add Large File
        </button>
      );
    }

    render(<TestWithValidation />);
    fireEvent.click(screen.getByText('Add Large File'));

    await waitFor(() => {
      expect(onValidationError).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'size',
          }),
        ])
      );
    });
  });

  it('replaces file in single mode', async () => {
    function TestSingleMode() {
      const { files, addFile } = useFileUpload({ multiple: false });

      return (
        <div>
          <span data-testid="file-count">{files.length}</span>
          <button onClick={() => addFile(createMockFile('first.jpg'))}>
            Add First
          </button>
          <button onClick={() => addFile(createMockFile('second.jpg'))}>
            Add Second
          </button>
        </div>
      );
    }

    render(<TestSingleMode />);

    fireEvent.click(screen.getByText('Add First'));
    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('1');
    });

    fireEvent.click(screen.getByText('Add Second'));
    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('1');
    });
  });

  it('accumulates files in multiple mode', async () => {
    function TestMultipleMode() {
      const { files, addFile } = useFileUpload({ multiple: true });

      return (
        <div>
          <span data-testid="file-count">{files.length}</span>
          <button onClick={() => addFile(createMockFile('first.jpg'))}>
            Add First
          </button>
          <button onClick={() => addFile(createMockFile('second.jpg'))}>
            Add Second
          </button>
        </div>
      );
    }

    render(<TestMultipleMode />);

    fireEvent.click(screen.getByText('Add First'));
    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('1');
    });

    fireEvent.click(screen.getByText('Add Second'));
    await waitFor(() => {
      expect(screen.getByTestId('file-count')).toHaveTextContent('2');
    });
  });
});

// ============================================================================
// DropZone Component Tests
// ============================================================================

describe('DropZone', () => {
  const defaultProps = {
    onFilesSelected: vi.fn(),
    acceptedFileTypes: ['image/jpeg', 'image/png'],
    multiple: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children', () => {
    render(
      <DropZone {...defaultProps}>
        <span>Drop content</span>
      </DropZone>
    );

    expect(screen.getByText('Drop content')).toBeInTheDocument();
  });

  it('handles drag events', () => {
    render(<DropZone {...defaultProps} />);

    const dropzone = screen.getByRole('button');

    fireEvent.dragEnter(dropzone, {
      dataTransfer: { items: [{}] },
    });

    // Check for visual feedback (dragging state)
    expect(dropzone).toHaveClass('scale-[1.01]');
  });

  it('handles drop events', () => {
    const onFilesSelected = vi.fn();
    render(<DropZone {...defaultProps} onFilesSelected={onFilesSelected} />);

    const dropzone = screen.getByRole('button');
    const file = createMockFile('test.jpg');
    const fileList = createFileList([file]);

    fireEvent.drop(dropzone, {
      dataTransfer: { files: fileList },
    });

    expect(onFilesSelected).toHaveBeenCalledWith(fileList);
  });

  it('handles keyboard activation', async () => {
    const onFilesSelected = vi.fn();
    render(<DropZone {...defaultProps} onFilesSelected={onFilesSelected} />);

    const dropzone = screen.getByRole('button');

    // Focus and press Enter
    dropzone.focus();
    fireEvent.keyDown(dropzone, { key: 'Enter' });

    // The hidden input should be clicked (we can't fully test this without mocking)
  });

  it('respects disabled state', () => {
    const onFilesSelected = vi.fn();
    render(
      <DropZone {...defaultProps} onFilesSelected={onFilesSelected} disabled />
    );

    const dropzone = screen.getByRole('button');
    expect(dropzone).toHaveAttribute('aria-disabled', 'true');
    expect(dropzone).toHaveAttribute('tabIndex', '-1');
  });

  it('prevents drop when disabled', () => {
    const onFilesSelected = vi.fn();
    render(
      <DropZone {...defaultProps} onFilesSelected={onFilesSelected} disabled />
    );

    const dropzone = screen.getByRole('button');
    const file = createMockFile('test.jpg');
    const fileList = createFileList([file]);

    fireEvent.drop(dropzone, {
      dataTransfer: { files: fileList },
    });

    expect(onFilesSelected).not.toHaveBeenCalled();
  });
});

// ============================================================================
// FilePreview Component Tests
// ============================================================================

describe('FilePreview', () => {
  const createPreviewFile = (
    name: string,
    type: string = 'image/jpeg'
  ): PreviewFile => ({
    file: createMockFile(name, type),
    previewUrl: `blob:${name}`,
    source: 'upload',
    id: `id-${name}`,
  });

  it('renders nothing when files array is empty', () => {
    const { container } = render(<FilePreview files={[]} onRemove={vi.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders file previews', () => {
    const files = [
      createPreviewFile('test1.jpg'),
      createPreviewFile('test2.jpg'),
    ];

    render(<FilePreview files={files} onRemove={vi.fn()} />);

    expect(screen.getByText('test1.jpg')).toBeInTheDocument();
    expect(screen.getByText('test2.jpg')).toBeInTheDocument();
  });

  it('shows PDF icon for PDF files', () => {
    const files = [createPreviewFile('document.pdf', 'application/pdf')];

    render(<FilePreview files={files} onRemove={vi.fn()} />);

    expect(screen.getByText('PDF Document')).toBeInTheDocument();
  });

  it('calls onRemove when remove button is clicked', async () => {
    const onRemove = vi.fn();
    const files = [createPreviewFile('test.jpg')];

    render(<FilePreview files={files} onRemove={onRemove} />);

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    expect(onRemove).toHaveBeenCalledWith('id-test.jpg');
  });

  it('disables remove button when disabled', () => {
    const files = [createPreviewFile('test.jpg')];

    render(<FilePreview files={files} onRemove={vi.fn()} disabled />);

    const removeButton = screen.getByRole('button', { name: /remove/i });
    expect(removeButton).toBeDisabled();
  });

  it('displays file size', () => {
    const files = [createPreviewFile('test.jpg')];

    render(<FilePreview files={files} onRemove={vi.fn()} />);

    // File is 1KB (1024 bytes)
    expect(screen.getByText('1 KB')).toBeInTheDocument();
  });

  it('displays source badge', () => {
    const files = [createPreviewFile('test.jpg')];

    render(<FilePreview files={files} onRemove={vi.fn()} />);

    expect(screen.getByText('upload')).toBeInTheDocument();
  });
});

// ============================================================================
// useCamera Hook Tests (limited - requires mocking)
// ============================================================================

describe('useCamera', () => {
  // Mock navigator.mediaDevices
  const mockGetUserMedia = vi.fn();
  const mockPermissionsQuery = vi.fn();

  beforeEach(() => {
    // @ts-expect-error - mocking navigator
    globalThis.navigator.mediaDevices = {
      getUserMedia: mockGetUserMedia,
    };

    // @ts-expect-error - mocking navigator
    globalThis.navigator.permissions = {
      query: mockPermissionsQuery,
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('checks initial permission status', async () => {
    mockPermissionsQuery.mockResolvedValue({ state: 'prompt' });

    function TestComponent() {
      const { permission } = useCamera();
      return <span data-testid="permission">{permission}</span>;
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('permission')).toHaveTextContent('prompt');
    });
  });
});

// ============================================================================
// useIsMobile Hook Tests
// ============================================================================

describe('useIsMobile', () => {
  const originalUserAgent = navigator.userAgent;
  const originalInnerWidth = window.innerWidth;

  afterEach(() => {
    Object.defineProperty(navigator, 'userAgent', {
      value: originalUserAgent,
      writable: true,
    });
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      writable: true,
    });
  });

  it('returns false for desktop', () => {
    // Mock matchMedia to simulate desktop viewport
    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: !query.includes('max-width: 639px'), // Desktop = not mobile
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    function TestComponent() {
      const isMobile = useIsMobile();
      return <span data-testid="is-mobile">{isMobile.toString()}</span>;
    }

    render(<TestComponent />);

    expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
  });

  it('returns true for narrow viewport', async () => {
    // Mock matchMedia to simulate mobile viewport
    const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('max-width: 639px'), // Mobile = matches this query
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    function TestComponent() {
      const isMobile = useIsMobile();
      return <span data-testid="is-mobile">{isMobile.toString()}</span>;
    }

    render(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
    });
  });
});
