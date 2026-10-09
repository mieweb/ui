import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { UserPicker, type UserPickerUser } from './UserPicker';

const users: UserPickerUser[] = [
  { id: 'u1', name: 'Ada Lovelace', email: 'ada@example.com' },
  { id: 'u2', name: 'Grace Hopper', email: 'grace@navy.test' },
  { id: 'u3', name: 'Alan Turing' },
];

function Single(props: { onChange?: (v: string | null) => void }) {
  const [value, setValue] = React.useState<string | null>('u1');
  return (
    <UserPicker
      label="Owner"
      users={users}
      allowUnassigned
      value={value}
      onChange={(v) => {
        props.onChange?.(v);
        setValue(v);
      }}
    />
  );
}

describe('UserPicker', () => {
  it('shows the selected user and opens a searchable listbox', async () => {
    render(<Single />);
    const trigger = screen.getByRole('button', { name: /Owner/ });
    expect(trigger).toHaveTextContent('Ada Lovelace');
    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const search = screen.getByRole('combobox', { name: 'Search users' });
    expect(search).toHaveFocus();
    expect(screen.getAllByRole('option')).toHaveLength(4);
    expect(
      screen.getByRole('option', { name: /Ada Lovelace/ })
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('filters by name or email and selects with the keyboard', async () => {
    const onChange = vi.fn();
    render(<Single onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /Owner/ });
    await userEvent.click(trigger);
    await userEvent.type(screen.getByRole('combobox'), 'navy');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith('u2');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await waitFor(() => expect(trigger).toHaveTextContent('Grace Hopper'));
  });

  it('opens with ArrowDown, walks options, and clears via Unassigned', async () => {
    const onChange = vi.fn();
    render(<Single onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /Owner/ });
    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    const search = screen.getByRole('combobox');
    expect(search.getAttribute('aria-activedescendant')).toMatch(/-1$/);
    await userEvent.keyboard('{Home}');
    expect(search.getAttribute('aria-activedescendant')).toMatch(/-0$/);
    await userEvent.keyboard('{End}{ArrowUp}{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith('u3');
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('option', { name: /Unassigned/ }));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<Single />);
    const trigger = screen.getByRole('button', { name: /Owner/ });
    await userEvent.click(trigger);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('toggles users in multiple mode and stays open', async () => {
    function Multi() {
      const [value, setValue] = React.useState<string[]>(['u1']);
      return (
        <UserPicker
          label="Watchers"
          users={users}
          multiple
          value={value}
          onChange={setValue}
        />
      );
    }
    render(<Multi />);
    await userEvent.click(screen.getByRole('button', { name: /Watchers/ }));
    expect(screen.getByRole('listbox')).toHaveAttribute(
      'aria-multiselectable',
      'true'
    );
    await userEvent.click(screen.getByRole('option', { name: /Grace/ }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Watchers/ })
      ).toHaveTextContent('2 selected')
    );
    await userEvent.click(screen.getByRole('option', { name: /Ada/ }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Watchers/ })
      ).toHaveTextContent('Grace Hopper')
    );
  });

  it('ignores further selections while a save is pending', async () => {
    let resolve!: () => void;
    const onChange = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(
      <UserPicker
        label="Watchers"
        users={users}
        multiple
        value={['u1']}
        onChange={onChange}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /Watchers/ }));
    await userEvent.click(screen.getByRole('option', { name: /Grace/ }));
    await userEvent.click(screen.getByRole('option', { name: /Alan/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    resolve();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Watchers/ })
      ).not.toHaveAttribute('aria-busy')
    );
  });

  it('restores the previous value and shows an error on rejection', async () => {
    let reject!: (e: Error) => void;
    const onChange = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(
      <UserPicker label="Owner" users={users} value="u1" onChange={onChange} />
    );
    const trigger = screen.getByRole('button', { name: /Owner/ });
    await userEvent.click(trigger);
    await userEvent.click(screen.getByRole('option', { name: /Alan/ }));
    expect(trigger).toHaveTextContent('Alan Turing');
    expect(trigger).toHaveAttribute('aria-busy', 'true');
    reject(new Error('Not allowed'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Not allowed');
    expect(trigger).toHaveTextContent('Ada Lovelace');
  });

  it('renders loading, empty and placeholder states', async () => {
    const onQueryChange = vi.fn();
    const { rerender } = render(
      <UserPicker
        label="Owner"
        users={[]}
        value={null}
        loading
        onChange={vi.fn()}
        onQueryChange={onQueryChange}
      />
    );
    const trigger = screen.getByRole('button', { name: /Owner/ });
    expect(trigger).toHaveTextContent('Select a user');
    await userEvent.click(trigger);
    expect(screen.getByRole('status')).toHaveTextContent('Loading users…');
    await userEvent.type(screen.getByRole('combobox'), 'z');
    expect(onQueryChange).toHaveBeenLastCalledWith('z');
    rerender(
      <UserPicker
        label="Owner"
        users={users}
        value={null}
        onChange={vi.fn()}
        onQueryChange={onQueryChange}
      />
    );
    expect(screen.getByText('No matching users')).toBeInTheDocument();
    await userEvent.click(trigger);
    expect(onQueryChange).toHaveBeenLastCalledWith('');
  });

  it('keeps showing selected users when search results omit them', async () => {
    function ServerSearch() {
      const [list, setList] = React.useState(users);
      return (
        <>
          <button onClick={() => setList([users[1]])}>Shrink</button>
          <UserPicker
            label="Owner"
            users={list}
            value="u1"
            onChange={vi.fn()}
          />
        </>
      );
    }
    render(<ServerSearch />);
    const trigger = screen.getByRole('button', { name: /Owner/ });
    expect(trigger).toHaveTextContent('Ada Lovelace');
    // A server-side search replaces `users` with results that omit the
    // selected person; the trigger must not fall back to the placeholder.
    await userEvent.click(screen.getByRole('button', { name: 'Shrink' }));
    expect(trigger).toHaveTextContent('Ada Lovelace');
  });
});
