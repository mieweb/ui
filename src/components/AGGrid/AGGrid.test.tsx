import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// jsdom cannot cascade `dir` into computed `direction` (see
// useDirection.test.ts), so the hook is stubbed with a controllable value and
// the grid engine with a prop-reflecting stub — the tests pin the wrapper's
// contract: resolved direction feeds AG Grid's `enableRtl`, and an explicit
// prop wins.
const direction = vi.hoisted(() => ({ value: 'ltr' as 'ltr' | 'rtl' }));

vi.mock('../../hooks/useDirection', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('../../hooks/useDirection')>();
  return { ...actual, useDirection: () => direction.value };
});

vi.mock('ag-grid-react', async () => {
  const React = await import('react');
  return {
    AgGridReact: React.forwardRef(function AgGridStub(
      props: { enableRtl?: boolean },
      _ref: React.ForwardedRef<unknown>
    ) {
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
});
