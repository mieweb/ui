import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Modal } from './Modal';

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
