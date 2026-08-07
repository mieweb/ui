import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Sheet, SheetHeader, SheetTitle, SheetBody, SheetClose } from './Sheet';

function renderSheet(props: Partial<React.ComponentProps<typeof Sheet>> = {}) {
  const onOpenChange = props.onOpenChange ?? vi.fn();
  const utils = renderWithTheme(
    <Sheet open onOpenChange={onOpenChange} {...props}>
      <SheetHeader>
        <SheetTitle>Filters</SheetTitle>
        <SheetClose />
      </SheetHeader>
      <SheetBody>Body content</SheetBody>
    </Sheet>
  );
  return { ...utils, onOpenChange };
}

describe('Sheet', () => {
  it('does not render when closed', () => {
    renderWithTheme(
      <Sheet open={false} onOpenChange={vi.fn()}>
        <SheetBody>Body content</SheetBody>
      </Sheet>
    );
    expect(screen.queryByText('Body content')).not.toBeInTheDocument();
  });

  it('renders as a modal dialog when open', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('labels the dialog via the title', () => {
    renderSheet();
    const dialog = screen.getByRole('dialog');
    const title = screen.getByText('Filters');
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
  });

  it('closes via the SheetClose button', () => {
    const { onOpenChange } = renderSheet();
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes on Escape by default', () => {
    const { onOpenChange } = renderSheet();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not close on Escape when closeOnEscape is false', () => {
    const onOpenChange = vi.fn();
    renderSheet({ closeOnEscape: false, onOpenChange });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  describe('side variants (logical properties)', () => {
    it.each([
      ['start', ['start-0', 'border-e']],
      ['end', ['end-0', 'border-s']],
    ] as const)('side="%s" positions via logical classes', (side, classes) => {
      renderSheet({ side });
      const dialog = screen.getByRole('dialog');
      classes.forEach((c) => expect(dialog).toHaveClass(c));
    });

    it.each([
      ['left', 'start'],
      ['right', 'end'],
    ] as const)(
      'side="%s" is a direction-aware alias for "%s"',
      (physical, logical) => {
        const { unmount } = renderSheet({ side: physical });
        const physicalClasses = screen.getByRole('dialog').className;
        unmount();
        renderSheet({ side: logical });
        expect(screen.getByRole('dialog').className).toBe(physicalClasses);
      }
    );
  });
});
