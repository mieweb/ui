import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Avatar } from '../Avatar/Avatar';
import { AvatarGroup } from './AvatarGroup';

const people = [
  { id: 'a', name: 'Ann Lee' },
  { id: 'b', name: 'Bo Diaz', presence: 'editing' as const },
  { id: 'c', name: 'Cy Park', presence: 'viewing' as const },
  { id: 'd', name: 'Di Moss' },
];

describe('AvatarGroup', () => {
  it('renders a labelled list with editors first and presence in the name', () => {
    render(<AvatarGroup items={people} />);

    expect(screen.getByRole('list', { name: 'People' })).toBeInTheDocument();
    const imgs = screen.getAllByRole('img');
    expect(imgs[0]).toHaveAccessibleName('Bo Diaz is editing');
    expect(
      screen.getByRole('img', { name: 'Cy Park is viewing' })
    ).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Ann Lee' })).toBeTruthy();
  });

  it('collapses the rest into a +N chip that names who is hidden', () => {
    render(<AvatarGroup items={people} max={2} />);

    const chip = screen.getByRole('img', { name: /^2 more/ });
    expect(chip).toHaveTextContent('+2');
    expect(chip).toHaveAccessibleName('2 more: Cy Park, Di Moss');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('makes items buttons when onItemClick is set', async () => {
    const onItemClick = vi.fn();
    render(<AvatarGroup items={people} onItemClick={onItemClick} />);

    await userEvent.click(
      screen.getByRole('button', { name: 'Cy Park is viewing' })
    );
    expect(onItemClick).toHaveBeenCalledWith('c');
  });

  it('uses label overrides and per-item labels', () => {
    render(
      <AvatarGroup
        items={[{ id: 'x', name: 'Bo', label: 'Bo (2)', presence: 'editing' }]}
        labels={{
          list: 'Here now',
          presence: (n, p) => `${n} — ${p}`,
        }}
      />
    );
    expect(screen.getByRole('list', { name: 'Here now' })).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Bo (2) — editing' })).toBeTruthy();
  });

  it('still accepts legacy Avatar children', () => {
    render(
      <AvatarGroup max={1} size="sm">
        <Avatar name="Ann Lee" />
        <Avatar name="Bo Diaz" />
      </AvatarGroup>
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('img', { name: '1 more: Bo Diaz' })).toBeTruthy();
  });
});
