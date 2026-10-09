import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AssociationList } from './AssociationList';
import { contacts } from './storyData';

const base = { title: 'Contacts', items: contacts };

describe('AssociationList', () => {
  it('shows the title, count and the first maxVisible items', () => {
    render(<AssociationList {...base} />);
    const card = screen.getByRole('region', { name: 'Contacts' });
    expect(within(card).getByText('7')).toBeInTheDocument();
    expect(within(card).getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByText('VP Operations')).toBeInTheDocument();
  });

  it('expands and collapses with the toggle', async () => {
    render(<AssociationList {...base} maxVisible={2} />);
    const toggle = screen.getByRole('button', { name: 'Show all (7)' });
    await userEvent.click(toggle);
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(screen.getByRole('button', { name: 'Show less' }));
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('opens items through links and buttons', async () => {
    const onOpen = vi.fn();
    const { rerender } = render(
      <AssociationList {...base} onOpen={onOpen} getHref={(id) => `/c/${id}`} />
    );
    const link = screen.getByRole('link', { name: 'Dana Ruiz' });
    expect(link).toHaveAttribute('href', '/c/c1');
    await userEvent.click(link);
    expect(onOpen).toHaveBeenCalledWith('c1', contacts[0]);

    rerender(<AssociationList {...base} onOpen={onOpen} />);
    await userEvent.click(screen.getByRole('button', { name: 'Marcus Webb' }));
    expect(onOpen).toHaveBeenLastCalledWith('c2', contacts[1]);
  });

  it('calls onAdd', async () => {
    const onAdd = vi.fn();
    render(<AssociationList {...base} onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onAdd).toHaveBeenCalled();
  });

  it('marks a row pending during removal and restores it on rejection', async () => {
    let reject!: (e: Error) => void;
    const onRemove = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(<AssociationList {...base} onRemove={onRemove} />);
    const button = screen.getByRole('button', { name: 'Remove Dana Ruiz' });
    await userEvent.click(button);
    expect(onRemove).toHaveBeenCalledWith('c1', contacts[0]);
    expect(button).toBeDisabled();
    expect(button.closest('li')).toHaveAttribute('aria-busy', 'true');
    await act(async () => reject(new Error('nope')));
    expect(button).not.toBeDisabled();
  });

  it('renders the meta slot', () => {
    render(
      <AssociationList
        {...base}
        renderItemMeta={(item) => <span>meta-{item.id}</span>}
      />
    );
    expect(screen.getByText('meta-c1')).toBeInTheDocument();
  });

  it('renders the load states and forwards the ref', async () => {
    const onRetry = vi.fn();
    const ref = { current: null as HTMLElement | null };
    const { rerender } = render(
      <AssociationList ref={ref} {...base} items={[]} loading />
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(ref.current).toHaveAttribute('data-slot', 'association-list');

    rerender(
      <AssociationList
        {...base}
        items={[]}
        error={new Error('x')}
        onRetry={onRetry}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalled();

    rerender(<AssociationList {...base} items={[]} />);
    expect(screen.getByText('None yet')).toBeInTheDocument();
  });
});
