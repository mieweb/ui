import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom cannot cascade `dir` into computed `direction` (see
// useDirection.test.ts), so the hook is stubbed with a controllable value and
// the grid engine with a prop-reflecting stub — the tests pin the wrapper's
// contract: resolved direction feeds AG Grid's `enableRtl`, and an explicit
// prop wins.
const direction = vi.hoisted(() => ({ value: 'ltr' as 'ltr' | 'rtl' }));
// Spy api handed to onGridReady on every stub (re)mount, so tests can assert
// what the wrapper re-applies after the enableRtl direction-flip remount.
const gridApi = vi.hoisted(() => ({
  showLoadingOverlay: vi.fn(),
  hideOverlay: vi.fn(),
}));

vi.mock('../../hooks/useDirection', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../hooks/useDirection')>();
  return { ...actual, useDirection: () => direction.value };
});

vi.mock('ag-grid-react', async () => {
  const React = await import('react');
  return {
    AgGridReact: React.forwardRef(function AgGridStub(
      props: {
        enableRtl?: boolean;
        onGridReady?: (event: { api: typeof gridApi }) => void;
      },
      _ref: React.ForwardedRef<unknown>
    ) {
      const { onGridReady } = props;
      React.useEffect(() => {
        // Fires once per mount — a key change remounts and fires again,
        // mirroring AG Grid's real gridReady lifecycle.
        onGridReady?.({ api: gridApi });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
      return (
        <div
          data-testid="ag-grid-stub"
          data-enable-rtl={String(props.enableRtl)}
        />
      );
    }),
  };
});

import { AGGrid } from './AGGrid';

describe('AGGrid direction', () => {
  beforeEach(() => {
    direction.value = 'ltr';
    gridApi.showLoadingOverlay.mockClear();
    gridApi.hideOverlay.mockClear();
  });

  it('defaults enableRtl to false under ltr', () => {
    render(<AGGrid columnDefs={[]} rowData={[]} />);
    expect(screen.getByTestId('ag-grid-stub')).toHaveAttribute(
      'data-enable-rtl',
      'false'
    );
  });

  it('passes enableRtl when the inherited direction is rtl', () => {
    direction.value = 'rtl';
    render(<AGGrid columnDefs={[]} rowData={[]} />);
    expect(screen.getByTestId('ag-grid-stub')).toHaveAttribute(
      'data-enable-rtl',
      'true'
    );
  });

  it('lets an explicit enableRtl prop pin the direction', () => {
    direction.value = 'rtl';
    render(<AGGrid columnDefs={[]} rowData={[]} enableRtl={false} />);
    expect(screen.getByTestId('ag-grid-stub')).toHaveAttribute(
      'data-enable-rtl',
      'false'
    );
  });

  it('re-applies the loading overlay after a direction-flip remount', () => {
    const { rerender } = render(
      <AGGrid columnDefs={[]} rowData={[]} loading />
    );
    expect(gridApi.showLoadingOverlay).toHaveBeenCalled();
    gridApi.showLoadingOverlay.mockClear();

    // Live dir flip: the resolved enableRtl changes, the key remounts the
    // grid, and the new instance must get the loading overlay re-applied —
    // the [loading] effect alone won't rerun (loading didn't change).
    direction.value = 'rtl';
    rerender(<AGGrid columnDefs={[]} rowData={[]} loading />);
    expect(screen.getByTestId('ag-grid-stub')).toHaveAttribute(
      'data-enable-rtl',
      'true'
    );
    expect(gridApi.showLoadingOverlay).toHaveBeenCalled();
    // The false path must stay untouched so AG Grid's automatic no-rows
    // overlay isn't suppressed on fresh mounts.
    expect(gridApi.hideOverlay).not.toHaveBeenCalled();
  });
});
