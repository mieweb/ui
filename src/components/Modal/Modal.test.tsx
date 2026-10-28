import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
