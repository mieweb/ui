import * as React from 'react';
import { flushSync } from 'react-dom';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEscapeKey } from './useEscapeKey';

function Overlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children?: React.ReactNode;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  useEscapeKey(onClose, true, ref);
  return (
    <div ref={ref} role="dialog">
      {children}
    </div>
  );
}

describe('useEscapeKey exclusive ownership', () => {
  it('dismisses only the inner overlay when its close flushes synchronously', () => {
    // A synchronous close (legacy root or flushSync) unregisters the inner
    // owner while the Escape event is still dispatching. The outer overlay's
    // listener runs later on the same event and must not recompute ownership
    // and close too — one keypress dismisses exactly one layer.
    const outerClose = vi.fn();
    function Host() {
      const [innerOpen, setInnerOpen] = React.useState(true);
      return (
        <Overlay onClose={outerClose}>
          {innerOpen && (
            <Overlay onClose={() => flushSync(() => setInnerOpen(false))} />
          )}
        </Overlay>
      );
    }
    render(<Host />);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(outerClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(outerClose).toHaveBeenCalledTimes(1);
  });
});
