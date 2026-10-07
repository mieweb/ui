import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldHistory } from './FieldHistory';
import { fieldChanges, historyNow, historyZone } from './storyData';

const base = {
  items: fieldChanges,
  now: historyNow,
  timeZone: historyZone,
  locale: 'en-US',
};

describe('FieldHistory', () => {
  it('groups entries by day, newest first', () => {
    render(<FieldHistory {...base} />);
    expect(screen.getAllByRole('heading').map((h) => h.textContent)).toEqual([
      'Today',
      'Yesterday',
      'Monday, March 2',
    ]);
  });

  it('falls back to all fields when the selected field is gone', () => {
    const { container } = render(
      <FieldHistory {...base} defaultField="No such field" />
    );
    expect(
      container.querySelectorAll('[data-slot="field-history-entry"]')
    ).toHaveLength(fieldChanges.length);
  });

  it('shows the old value struck through and the new one', () => {
    render(<FieldHistory {...base} />);
    const entry = screen.getByText('Close date').closest('li')!;
    expect(entry.querySelector('del')).toHaveTextContent('2026-04-30');
    expect(entry.querySelector('ins')).toHaveTextContent('2026-05-15');
    expect(within(entry).getByText('Changed from')).toHaveClass('sr-only');
    expect(within(entry).getByText('Priya Shah')).toBeInTheDocument();
  });

  it('labels blank values and skips formatValue for them', () => {
    const formatValue = vi.fn((v: unknown) => `<${String(v)}>`);
    render(<FieldHistory {...base} formatValue={formatValue} />);
    const entry = screen.getByText('Phone').closest('li')!;
    expect(entry.querySelector('del')).toHaveTextContent('Empty');
    expect(entry.querySelector('ins')).toHaveTextContent('<(317) 555-0142>');
    expect(within(entry).getByText('Import')).toBeInTheDocument();
    expect(formatValue).not.toHaveBeenCalledWith(null, expect.anything());
  });

  it('shows relative time with the absolute time as a title', () => {
    render(<FieldHistory {...base} />);
    const time = screen
      .getAllByText('Stage', { selector: 'span' })[0]
      .closest('li')!
      .querySelector('time')!;
    expect(time).toHaveTextContent('50 minutes ago');
    expect(time.getAttribute('title')).toMatch(/March 12, 2026/);
  });

  it('filters to one field', () => {
    render(<FieldHistory {...base} defaultField="Stage" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('changes the field filter through the select', async () => {
    render(<FieldHistory {...base} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Amount' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(1);
  });

  it('files undated entries last and honours label overrides', () => {
    render(
      <FieldHistory
        {...base}
        items={[
          { id: 'x', field: 'Owner', from: '', to: 'Kim', changedAt: 'n/a' },
        ]}
        labels={{ undated: 'Sans date', emptyValue: 'Vide' }}
      />
    );
    expect(screen.getByRole('heading')).toHaveTextContent('Sans date');
    expect(screen.getByText('Vide')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(document.querySelector('time')).toBeNull();
  });

  it('renders the load states and forwards the ref', async () => {
    const onRetry = vi.fn();
    const ref = { current: null as HTMLDivElement | null };
    const { rerender } = render(
      <FieldHistory ref={ref} {...base} items={[]} loading />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading history');
    expect(ref.current).toHaveAttribute('data-slot', 'field-history');

    rerender(
      <FieldHistory
        {...base}
        items={[]}
        error={new Error('x')}
        onRetry={onRetry}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();

    rerender(<FieldHistory {...base} items={[]} />);
    expect(screen.getByText('No changes recorded')).toBeInTheDocument();
  });
});
