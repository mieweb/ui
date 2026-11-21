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

  it('hears an Escape pressed in the same commit the overlay mounts', () => {
    // Overlays can open from un-act'd async continuations; on slow runners a
    // keypress can land right after the dialog is committed but before
    // passive effects run. The listener must attach with layout timing — a
    // passive effect would leave the dialog visible but deaf, silently
    // losing the keypress. A parent layout effect runs after the overlay's
    // own layout effect and before any passive effect, which is exactly
    // that window.
    const onClose = vi.fn();
    function Host() {
      React.useLayoutEffect(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      }, []);
      return <Overlay onClose={onClose} />;
    }
    render(<Host />);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('re-resolves ownership for a redispatched event after the dispatch ends', async () => {
    // The per-event freeze must not outlive the keypress: once the dispatch
    // is over the cache clears, so replaying the same event object reaches
    // the overlay that is topmost now — and no detached dialog subtree is
    // retained through the cached event's target.
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

    const escape = new KeyboardEvent('keydown', {
      key: 'Escape',
      bubbles: true,
    });
    fireEvent(document, escape);
    expect(outerClose).not.toHaveBeenCalled();

    // The freeze clears in a microtask once the dispatch completes.
    await Promise.resolve();
    fireEvent(document, escape);
    expect(outerClose).toHaveBeenCalledTimes(1);
  });
});
