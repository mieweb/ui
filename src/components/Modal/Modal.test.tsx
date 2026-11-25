import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

describe('Modal overlay dismissal', () => {
  it.each([
    {
      pressOnOverlay: false,
      releaseOnOverlay: true,
      shouldClose: false,
      description: 'keeps the modal open when dragging from input to overlay',
    },
    {
      pressOnOverlay: true,
      releaseOnOverlay: true,
      shouldClose: true,
      description:
        'closes the modal when pressing and releasing on the overlay',
    },
    {
      pressOnOverlay: true,
      releaseOnOverlay: false,
      shouldClose: false,
      description: 'keeps the modal open when dragging from overlay to input',
    },
    {
      pressOnOverlay: false,
      releaseOnOverlay: false,
      shouldClose: false,
      description: 'keeps the modal open when clicking the input',
    },
  ])(
    '$description',
    async ({ pressOnOverlay, releaseOnOverlay, shouldClose }) => {
      const user = userEvent.setup();
      const onOpenChange = vi.fn();
      render(
        <Modal open onOpenChange={onOpenChange} aria-label="Edit text">
          <input aria-label="Text" defaultValue="Keep this text" />
        </Modal>
      );
      const input = screen.getByRole('textbox');
      const overlay = screen.getByRole('dialog').parentElement!;

      await user.pointer([
        {
          target: pressOnOverlay ? overlay : input,
          keys: '[MouseLeft>]',
        },
        {
          target: releaseOnOverlay ? overlay : input,
          keys: '[/MouseLeft]',
        },
      ]);

      if (shouldClose) {
        expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
      } else {
        expect(onOpenChange).not.toHaveBeenCalled();
        expect(input).toHaveValue('Keep this text');
      }
    }
  );

  it('respects closeOnOverlayClick=false', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Modal
        open
        onOpenChange={onOpenChange}
        closeOnOverlayClick={false}
        aria-label="Edit text"
      >
        <input aria-label="Text" />
      </Modal>
    );

    await user.click(screen.getByRole('dialog').parentElement!);

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

/**
 * Both modals mount open in the same commit — React runs the inner modal's
 * passive effect before the outer's, so Escape ownership must be resolved
 * from DOM depth, not effect registration order.
 */
function NestedModals() {
  const [outer, setOuter] = React.useState(true);
  const [inner, setInner] = React.useState(true);
  return (
    <Modal open={outer} onOpenChange={setOuter} aria-label="Outer host">
      <p>Outer content</p>
      <Modal open={inner} onOpenChange={setInner} aria-label="Inner dialog">
        <p>Inner content</p>
      </Modal>
    </Modal>
  );
}

describe('Modal Escape ownership', () => {
  it('dismisses initially-open nested modals one layer per Escape', async () => {
    render(<NestedModals />);
    expect(
      screen.getByRole('dialog', { name: 'Inner dialog' })
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Inner dialog' })
      ).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole('dialog', { name: 'Outer host' })
    ).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Outer host' })
      ).not.toBeInTheDocument()
    );
  });
});
