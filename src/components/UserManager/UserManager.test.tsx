import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { UserManager, type ManagedUser } from './UserManager';

const users: ManagedUser[] = [
  {
    id: '1',
    name: 'Jane Smith',
    number: 'EMP-1001',
    email: 'jane@company.com',
    location: 'Toledo, OH',
    role: 'admin',
    active: true,
  },
  {
    id: '2',
    name: 'John Doe',
    number: 'EMP-1002',
    location: 'Toronto, ON',
    active: false,
  },
];

describe('UserManager', () => {
  it('renders users with role and access badges', () => {
    renderWithTheme(
      <UserManager
        users={users}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('No Access')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('adds a new user', () => {
    const onAdd = vi.fn();
    renderWithTheme(
      <UserManager
        users={users}
        onAdd={onAdd}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText('Name *'), {
      target: { value: 'Pat Person' },
    });
    fireEvent.change(screen.getByLabelText('Employee # *'), {
      target: { value: 'EMP-1003' },
    });
    fireEvent.change(screen.getByLabelText('Location *'), {
      target: { value: 'Dallas, TX' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
    expect(onAdd).toHaveBeenCalledWith({
      name: 'Pat Person',
      number: 'EMP-1003',
      email: undefined,
      location: 'Dallas, TX',
      role: undefined,
      active: true,
    });
  });

  it('toggles active state', () => {
    const onUpdate = vi.fn();
    renderWithTheme(
      <UserManager
        users={users}
        onAdd={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate' }));
    expect(onUpdate).toHaveBeenCalledWith('1', { active: false });
  });

  it('deletes a user', () => {
    const onDelete = vi.fn();
    renderWithTheme(
      <UserManager
        users={users}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete Jane Smith' }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('assigns a role through the dropdown when adding', () => {
    const onAdd = vi.fn();
    renderWithTheme(
      <UserManager
        users={users}
        onAdd={onAdd}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText('Name *'), {
      target: { value: 'Pat Person' },
    });
    fireEvent.change(screen.getByLabelText('Employee # *'), {
      target: { value: 'EMP-1003' },
    });
    fireEvent.change(screen.getByLabelText('Location *'), {
      target: { value: 'Dallas, TX' },
    });
    fireEvent.click(screen.getByRole('combobox', { name: 'Security Role' }));
    fireEvent.click(screen.getByRole('option', { name: 'Viewer' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Employee' }));
    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'viewer' })
    );
  });
});
