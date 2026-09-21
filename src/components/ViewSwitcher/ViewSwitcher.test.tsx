import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { ViewSwitcher } from './ViewSwitcher';
import type { ViewId } from '../../views/types';

function Controlled({
  onChange,
  ...props
}: {
  onChange?: (v: ViewId) => void;
} & Partial<React.ComponentProps<typeof ViewSwitcher>>) {
  const [view, setView] = React.useState<ViewId>('list');
  return (
    <ViewSwitcher
      views={['list', 'board', 'gantt']}
      {...props}
      value={view}
      onValueChange={(v) => {
        setView(v);
        onChange?.(v);
      }}
    />
  );
}

describe('ViewSwitcher', () => {
  it('renders a radio per view with the built-in labels', () => {
    render(<Controlled />);
    const group = screen.getByRole('radiogroup', { name: 'View' });
    expect(group).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'Board' })).toBeInTheDocument();
  });

  it('marks only the active view as checked', () => {
    render(<Controlled />);
    expect(screen.getByRole('radio', { name: 'List' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Board' })).not.toBeChecked();
  });

  it('reports the chosen view on click', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Board' }));
    expect(onChange).toHaveBeenCalledWith('board');
  });

  it('keeps one tab stop, on the active option', () => {
    render(<Controlled />);
    expect(screen.getByRole('radio', { name: 'List' })).toHaveAttribute(
      'tabindex',
      '0'
    );
    expect(screen.getByRole('radio', { name: 'Board' })).toHaveAttribute(
      'tabindex',
      '-1'
    );
  });

  it('moves and selects with arrow keys, wrapping at the end', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    screen.getByRole('radio', { name: 'List' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('board');
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    expect(onChange).toHaveBeenLastCalledWith('list');
  });

  it('skips disabled views when arrowing', async () => {
    const onChange = vi.fn();
    render(
      <Controlled
        views={['list', { id: 'board', disabled: true }, 'gantt']}
        onChange={onChange}
      />
    );
    screen.getByRole('radio', { name: 'List' }).focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith('gantt');
  });

  it('jumps to the ends with Home and End', async () => {
    const onChange = vi.fn();
    render(<Controlled onChange={onChange} />);
    screen.getByRole('radio', { name: 'List' }).focus();
    await userEvent.keyboard('{End}');
    expect(onChange).toHaveBeenLastCalledWith('gantt');
    await userEvent.keyboard('{Home}');
    expect(onChange).toHaveBeenLastCalledWith('list');
  });

  it('names icon-only options through aria-label', () => {
    render(<Controlled showLabels={false} />);
    const board = screen.getByRole('radio', { name: 'Board' });
    expect(board).toHaveAttribute('aria-label', 'Board');
  });

  it('honours per-option label overrides', () => {
    render(<Controlled views={[{ id: 'calendar', label: 'Month' }, 'list']} />);
    expect(screen.getByRole('radio', { name: 'Month' })).toBeInTheDocument();
  });

  it('accepts a custom group label', () => {
    render(<Controlled label="Layout" />);
    expect(
      screen.getByRole('radiogroup', { name: 'Layout' })
    ).toBeInTheDocument();
  });
});
