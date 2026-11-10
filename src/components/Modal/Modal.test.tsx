import { describe, it, expect, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Modal, ModalBody, ModalHeader, ModalTitle } from './Modal';

function Dialog({
  title,
  onOpenChange,
  children,
  closeOnEscape,
}: {
  title: string;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
  closeOnEscape?: boolean;
}) {
  return (
    <Modal open onOpenChange={onOpenChange} closeOnEscape={closeOnEscape}>
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        <button type="button">{title} action</button>
        {children}
      </ModalBody>
    </Modal>
  );
}

describe('Modal Escape', () => {
  it('closes on Escape', () => {
    const onOpenChange = vi.fn();
    renderWithTheme(<Dialog title="Outer" onOpenChange={onOpenChange} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('ignores Escape when closeOnEscape is false', () => {
    const onOpenChange = vi.fn();
    renderWithTheme(
      <Dialog title="Outer" onOpenChange={onOpenChange} closeOnEscape={false} />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('lets a nested Modal handle Escape first', () => {
    const outer = vi.fn();
    const inner = vi.fn();
    const { rerender } = renderWithTheme(
      <Dialog title="Outer" onOpenChange={outer}>
        <Dialog title="Inner" onOpenChange={inner} />
      </Dialog>
    );
    expect(screen.getAllByRole('dialog')).toHaveLength(2);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(inner).toHaveBeenCalledWith(false);
    expect(outer).not.toHaveBeenCalled();

    rerender(<Dialog title="Outer" onOpenChange={outer} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(outer).toHaveBeenCalledWith(false);
  });
});
