import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Autocomplete } from './Autocomplete';

interface Person {
  id: string;
  name: string;
}

const people: Person[] = [
  { id: '1', name: 'Sarah Johnson' },
  { id: '2', name: 'Michael Chen' },
  { id: '3', name: 'Jennifer Smith' },
];

const baseProps = {
  items: people,
  getItemKey: (p: Person) => p.id,
  renderItem: (p: Person) => <span>{p.name}</span>,
  filter: (p: Person, q: string) =>
    p.name.toLowerCase().includes(q.toLowerCase()),
  'aria-label': 'Search people',
};

describe('Autocomplete', () => {
  it('is a closed combobox by default', () => {
    renderWithTheme(<Autocomplete {...baseProps} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox', { name: /search people/i });
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens and filters results as the user types', () => {
    renderWithTheme(<Autocomplete {...baseProps} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'sa' } });
    expect(input).toHaveAttribute('aria-expanded', 'true');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Sarah Johnson');
  });

  it('calls onSelect with the chosen item and clears the query', () => {
    const onSelect = vi.fn();
    renderWithTheme(<Autocomplete {...baseProps} onSelect={onSelect} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'michael' } });
    fireEvent.click(screen.getByRole('option', { name: /michael chen/i }));
    expect(onSelect).toHaveBeenCalledWith(people[1]);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('shows the empty message when no items match', () => {
    renderWithTheme(
      <Autocomplete
        {...baseProps}
        onSelect={vi.fn()}
        emptyMessage="No people found"
      />
    );
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'zzz' },
    });
    expect(screen.getByText('No people found')).toBeInTheDocument();
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('renders a create action and calls onCreate with the query', () => {
    const onCreate = vi.fn();
    renderWithTheme(
      <Autocomplete
        {...baseProps}
        onSelect={vi.fn()}
        onCreate={onCreate}
        createLabel={(q) => `Create "${q}"`}
      />
    );
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'zzz' },
    });
    const createBtn = screen.getByRole('option', { name: /create "zzz"/i });
    fireEvent.click(createBtn);
    expect(onCreate).toHaveBeenCalledWith('zzz');
  });

  it('supports keyboard navigation and selection', () => {
    const onSelect = vi.fn();
    renderWithTheme(<Autocomplete {...baseProps} onSelect={onSelect} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'e' } });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    renderWithTheme(<Autocomplete {...baseProps} onSelect={vi.fn()} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'sa' } });
    expect(input).toHaveAttribute('aria-expanded', 'true');
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});
