import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { renderWithTheme } from '../../test/test-utils';
import { CaptureDock } from './CaptureDock';

/**
 * The annotate affordance and dialog shell (mieweb/ui#735). jsdom can't load
 * images or draw to canvas, so the pen/flatten pipeline is covered by the
 * Playwright round-trip and replaceImageSrc.test.ts — these tests pin the
 * affordance's appearance rules and the dialog's open/cancel contract.
 */

const insertFiles = vi.fn();

function Surface() {
  return (
    <p>
      <img src="blob:captured" alt="capture" />
      some text
    </p>
  );
}

function renderDock(
  props: Partial<React.ComponentProps<typeof CaptureDock>> = {}
) {
  return renderWithTheme(
    <CaptureDock insertFiles={insertFiles} {...props}>
      <Surface />
    </CaptureDock>
  );
}

const hoverImage = () =>
  fireEvent.mouseOver(screen.getByRole('img', { name: 'capture' }));

afterEach(cleanup);

describe('CaptureDock annotate affordance', () => {
  it('shows the annotate button when an image is hovered', async () => {
    renderDock({ replaceImage: vi.fn() });
    hoverImage();
    expect(
      await screen.findByRole('button', { name: 'Annotate image' })
    ).toBeInTheDocument();
  });

  it('hides the affordance again when the pointer moves to other content', async () => {
    renderDock({ replaceImage: vi.fn() });
    hoverImage();
    await screen.findByRole('button', { name: 'Annotate image' });
    fireEvent.mouseOver(screen.getByText('some text'));
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Annotate image' })
      ).not.toBeInTheDocument()
    );
  });

  it('renders no affordance without a replaceImage handler', () => {
    renderDock();
    hoverImage();
    expect(
      screen.queryByRole('button', { name: 'Annotate image' })
    ).not.toBeInTheDocument();
  });

  it('renders no affordance while locked', () => {
    renderDock({ replaceImage: vi.fn(), locked: true });
    hoverImage();
    expect(
      screen.queryByRole('button', { name: 'Annotate image' })
    ).not.toBeInTheDocument();
  });

  it('targets the caret-adjacent image, the keyboard path', async () => {
    renderDock({ replaceImage: vi.fn() });
    const img = screen.getByRole('img', { name: 'capture' });
    // Arrowing through the editor parks the caret in the text node right
    // after the image; jsdom never fires selectionchange on its own.
    const text = img.nextSibling as Text;
    document.getSelection()?.collapse(text, 0);
    fireEvent(document, new Event('selectionchange'));
    expect(
      await screen.findByRole('button', { name: 'Annotate image' })
    ).toBeInTheDocument();
  });

  it('opens the annotate dialog and closes it on cancel, leaving the image alone', async () => {
    const replaceImage = vi.fn();
    renderDock({ replaceImage });
    hoverImage();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Annotate image' })
    );
    expect(
      await screen.findByRole('heading', { name: 'Annotate image' })
    ).toBeInTheDocument();
    // jsdom never loads the image, so the dialog is in its loading state and
    // Save is disabled — the cancel contract is what jsdom can pin.
    expect(
      screen.getByRole('button', { name: 'Save annotation' })
    ).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', { name: 'Annotate image' })
      ).not.toBeInTheDocument()
    );
    expect(replaceImage).not.toHaveBeenCalled();
  });
});
