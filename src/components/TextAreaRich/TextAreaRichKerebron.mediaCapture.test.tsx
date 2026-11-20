/**
 * `mediaCapture` opt-in on the REAL Kerebron TextAreaRich surface
 * (mieweb/ui#734).
 *
 * Unit suites normally see the legacy-backed stub (vitest.config.ts aliases
 * every `…/TextAreaRichKerebron` import), so this suite dodges the alias with
 * a Vite query suffix, as the variables suite does. RichEditor itself is
 * mocked (no Kerebron/WASM under jsdom) — the point here is the wiring:
 * default-off renders the unchanged field, opt-in docks the ribbon and
 * funnels captures through `RichEditorHandle.insertFiles`.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import type { RichEditorHandle, InsertFilesResult } from '../RichEditor';
import type { TextAreaRichKerebronProps } from './TextAreaRichKerebron';

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
        getContent: async () => '<p>doc</p>',
        focus: () => {},
        insertFiles,
      }));
      return <div data-testid="rich-editor" />;
    }
  ),
}));

// @ts-expect-error — the `?real` query dodges the vitest stub alias (it only
// matches specifiers *ending* in /TextAreaRichKerebron); Vite resolves the
// query to the real module.
const kerebronModule = (await import('./TextAreaRichKerebron?real')) as {
  TextAreaRichKerebron: React.ForwardRefExoticComponent<
    TextAreaRichKerebronProps & React.RefAttributes<HTMLDivElement>
  >;
};
const { TextAreaRichKerebron } = kerebronModule;

const png = () => new File(['x'], 'photo.png', { type: 'image/png' });
const noop = () => {};

describe('TextAreaRichKerebron mediaCapture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is off by default: the field is the root element, with no ribbon or inputs', () => {
    const { container } = renderWithTheme(
      <TextAreaRichKerebron value="" onChange={noop} />
    );
    // No CaptureDock wrapper: the field wrapper itself is the root, exactly
    // the pre-#734 tree.
    expect(container.firstElementChild?.getAttribute('data-slot')).toBe(
      'textarea-rich'
    );
    expect(container.querySelector('[data-slot="capture-ribbon"]')).toBeNull();
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });

  it('mediaCapture docks the ribbon and inserts picked files through the editor handle', async () => {
    const { container } = renderWithTheme(
      <TextAreaRichKerebron value="" onChange={noop} mediaCapture />
    );
    expect(
      container.querySelector('[data-slot="capture-ribbon"]')
    ).toBeInTheDocument();

    const fileInput =
      container.querySelectorAll<HTMLInputElement>('input[type="file"]')[1]; // [0] is the image input (accept="image/*")
    const file = png();
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(insertFiles).toHaveBeenCalledWith([file]));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Attached')
    );
  });

  it('passes MediaCaptureOptions through (scanDocument)', async () => {
    const page = png();
    renderWithTheme(
      <TextAreaRichKerebron
        value=""
        onChange={noop}
        mediaCapture={{ scanDocument: async () => [page] }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Scan document' }));

    await waitFor(() => expect(insertFiles).toHaveBeenCalledWith([page]));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Scanned 1 page(s)')
    );
  });

  it.each([{ disabled: true }, { readOnly: true }])(
    'hides the ribbon while the field is locked (%o)',
    (lockProps) => {
      renderWithTheme(
        <TextAreaRichKerebron
          value=""
          onChange={noop}
          mediaCapture
          {...lockProps}
        />
      );
      expect(
        screen.queryByRole('button', { name: 'Capture image' })
      ).toBeNull();
      expect(screen.queryByRole('button', { name: 'Attach file' })).toBeNull();
    }
  );

  it('toggles the capture bar from the block menu', async () => {
    const { container } = renderWithTheme(
      <TextAreaRichKerebron value="" onChange={noop} mediaCapture />
    );
    const ribbon = () =>
      container.querySelector('[data-slot="capture-ribbon"]');
    expect(ribbon()).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Block menu' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Hide capture bar' })
    );
    expect(ribbon()).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Block menu' }));
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Show capture bar' })
    );
    expect(ribbon()).toBeInTheDocument();
  });

  it('offers no capture-bar toggle when mediaCapture is off', async () => {
    renderWithTheme(<TextAreaRichKerebron value="" onChange={noop} />);
    fireEvent.click(screen.getByRole('button', { name: 'Block menu' }));
    await screen.findByRole('menuitem', { name: 'Show toolbar' });
    expect(screen.queryByRole('menuitem', { name: /capture bar/i })).toBeNull();
  });
});
