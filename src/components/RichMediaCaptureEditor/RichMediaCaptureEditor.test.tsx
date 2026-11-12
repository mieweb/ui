import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { RichMediaCaptureEditor } from './RichMediaCaptureEditor';
import type { RichEditorHandle, InsertFilesResult } from '../RichEditor';

// The composed editor's job is wiring: ribbon → files → insertFiles → status.
// RichEditor itself (and insertFiles' pipeline) is covered by its own tests,
// so stand in for it here — no Kerebron/WASM under jsdom.
const { insertFiles } = vi.hoisted(() => ({
  insertFiles: vi.fn(
    async (files: File[]): Promise<InsertFilesResult> => ({
      inserted: files,
      skipped: [],
    })
  ),
}));
vi.mock('../RichEditor', () => ({
  RichEditor: React.forwardRef<RichEditorHandle, object>(
    function MockRichEditor(_props, ref) {
      React.useImperativeHandle(ref, () => ({
        getContent: async () => '# doc',
        focus: () => {},
        insertFiles,
      }));
      return <div data-testid="rich-editor" />;
    }
  ),
}));

const png = () => new File(['x'], 'photo.png', { type: 'image/png' });

describe('RichMediaCaptureEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertFiles.mockImplementation(async (files: File[]) => ({
      inserted: files,
      skipped: [],
    }));
  });

  it('hides captures the runtime cannot perform (jsdom: no getDisplayMedia, no scanner)', () => {
    renderWithTheme(<RichMediaCaptureEditor />);
    expect(
      screen.getByRole('button', { name: 'Capture image' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Attach file' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Capture screen' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Scan document' })).toBeNull();
  });

  it.each([{ disabled: true }, { readOnly: true }])(
    'hides the capture ribbon when the editor is locked (%o)',
    (lockProps) => {
      renderWithTheme(<RichMediaCaptureEditor {...lockProps} />);
      expect(
        screen.queryByRole('button', { name: 'Capture image' })
      ).toBeNull();
      expect(screen.queryByRole('button', { name: 'Attach file' })).toBeNull();
    }
  );

  it('inserts picked files through the editor handle and announces it', async () => {
    const { container } = renderWithTheme(<RichMediaCaptureEditor />);
    const fileInput =
      container.querySelectorAll<HTMLInputElement>('input[type="file"]')[1]; // [0] is the image input (accept="image/*")
    const file = png();

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(insertFiles).toHaveBeenCalledWith([file]));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Attached')
    );
  });

  it('announces skipped files instead of the success message', async () => {
    const file = png();
    insertFiles.mockResolvedValueOnce({ inserted: [], skipped: [file] });
    const { container } = renderWithTheme(<RichMediaCaptureEditor />);
    const fileInput =
      container.querySelectorAll<HTMLInputElement>('input[type="file"]')[1];

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        '1 file(s) could not be attached'
      )
    );
  });

  it('runs a provided document scanner and reports the page count', async () => {
    const page = png();
    renderWithTheme(
      <RichMediaCaptureEditor scanDocument={async () => [page]} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Scan document' }));

    await waitFor(() => expect(insertFiles).toHaveBeenCalledWith([page]));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Scanned 1 page(s)')
    );
  });

  it('renders host extraCaptures and honors their available flag', () => {
    renderWithTheme(
      <RichMediaCaptureEditor
        extraCaptures={[
          { id: 'a', label: 'Host capture', icon: null, run: () => {} },
          {
            id: 'b',
            label: 'Hidden capture',
            icon: null,
            run: () => {},
            available: false,
          },
        ]}
      />
    );
    expect(
      screen.getByRole('button', { name: 'Host capture' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Hidden capture' })).toBeNull();
  });

  it('forwards the RichEditorHandle, including insertFiles', async () => {
    const ref = React.createRef<RichEditorHandle>();
    renderWithTheme(<RichMediaCaptureEditor ref={ref} />);
    await expect(ref.current!.getContent()).resolves.toBe('# doc');
    const file = png();
    await ref.current!.insertFiles!([file]);
    expect(insertFiles).toHaveBeenCalledWith([file]);
  });

  describe('confirmScreenCapture (mieweb/ui#736)', () => {
    let getDisplayMedia: ReturnType<typeof vi.fn>;
    beforeEach(() => {
      getDisplayMedia = vi.fn().mockRejectedValue(new Error('no stream'));
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getDisplayMedia },
      });
      return () => {
        delete (navigator as { mediaDevices?: unknown }).mediaDevices;
      };
    });

    it('cancels the capture before the screen picker when refused', async () => {
      renderWithTheme(
        <RichMediaCaptureEditor confirmScreenCapture={async () => false} />
      );
      fireEvent.click(
        await screen.findByRole('button', { name: 'Capture screen' })
      );
      await waitFor(() =>
        expect(screen.getByRole('status')).toHaveTextContent(
          'Screen capture cancelled'
        )
      );
      expect(getDisplayMedia).not.toHaveBeenCalled();
    });

    it('proceeds to the screen picker when confirmed', async () => {
      renderWithTheme(
        <RichMediaCaptureEditor confirmScreenCapture={async () => true} />
      );
      fireEvent.click(
        await screen.findByRole('button', { name: 'Capture screen' })
      );
      await waitFor(() => expect(getDisplayMedia).toHaveBeenCalled());
    });
  });
});
