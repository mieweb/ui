import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompletenessMeter, getCompleteness } from './CompletenessMeter';

const fields = [
  { key: 'name', label: 'Name', complete: true, weight: 2 },
  { key: 'phone', label: 'Phone', complete: false },
  { key: 'npi', label: 'NPI', complete: false },
];

describe('getCompleteness', () => {
  it('ignores negative and non-finite weights', () => {
    const { percent } = getCompleteness([
      { key: 'a', label: 'A', complete: true, weight: 2 },
      { key: 'b', label: 'B', complete: false, weight: -1 },
      { key: 'c', label: 'C', complete: true, weight: Number.NaN },
    ]);
    expect(percent).toBe(100);
    expect(
      getCompleteness([
        { key: 'a', label: 'A', complete: true, weight: 1 },
        { key: 'b', label: 'B', complete: false, weight: Infinity },
      ]).percent
    ).toBe(100);
  });

  it('weights fields and lists the missing ones', () => {
    const { percent, missing } = getCompleteness(fields);
    expect(percent).toBe(50);
    expect(missing.map((f) => f.key)).toEqual(['phone', 'npi']);
  });

  it('treats an empty field list as complete', () => {
    expect(getCompleteness([]).percent).toBe(100);
  });
});

describe('CompletenessMeter', () => {
  it('renders a progress bar and the missing fields', () => {
    render(<CompletenessMeter fields={fields} />);

    const bar = screen.getByRole('progressbar', { name: 'Data completeness' });
    expect(bar).toHaveAttribute('aria-valuenow', '50');
    expect(bar).toHaveAttribute('aria-valuetext', '50%');
    expect(screen.getByText('Missing (2)')).toBeInTheDocument();
    expect(screen.getByText('Phone')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('makes missing fields buttons with onFieldClick', async () => {
    const onFieldClick = vi.fn();
    render(<CompletenessMeter fields={fields} onFieldClick={onFieldClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'NPI' }));
    expect(onFieldClick).toHaveBeenCalledWith('npi');
  });

  it('says so when everything is complete', () => {
    render(
      <CompletenessMeter
        fields={[{ key: 'a', label: 'A', complete: true }]}
        labels={{ allComplete: 'Done' }}
      />
    );
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('shows only the bar and percentage when compact', () => {
    render(<CompletenessMeter fields={fields} variant="compact" />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.queryByText('Phone')).toBeNull();
  });
});
