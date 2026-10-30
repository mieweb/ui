import * as React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useFocusTrap } from './useFocusTrap';

function Trap({
  initialFocus,
  extra = false,
}: {
  initialFocus?: boolean;
  extra?: boolean;
}) {
  const ref = useFocusTrap<HTMLDivElement>(true, { initialFocus });
  return (
    <div ref={ref}>
      <button type="button">First</button>
      <button type="button">Second</button>
      {extra && <button type="button">Added</button>}
    </div>
  );
}

describe('useFocusTrap', () => {
  it('focuses the first element when it turns on', () => {
    render(<Trap />);
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
  });

  it('leaves focus alone with initialFocus false', () => {
    render(<Trap initialFocus={false} />);
    expect(document.body).toHaveFocus();
  });

  it('wraps Tab at both ends, including elements added later', () => {
    const { rerender } = render(<Trap />);
    rerender(<Trap extra />);
    const added = screen.getByRole('button', { name: 'Added' });
    added.focus();
    fireEvent.keyDown(added, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus();
    fireEvent.keyDown(screen.getByRole('button', { name: 'First' }), {
      key: 'Tab',
      shiftKey: true,
    });
    expect(added).toHaveFocus();
  });
});
