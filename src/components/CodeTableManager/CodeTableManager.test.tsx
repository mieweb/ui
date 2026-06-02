import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { CodeTableManager, type CodeTableItem } from './CodeTableManager';

const items: CodeTableItem[] = [
  { id: '1', code: 'Open', description: 'Active case', active: true },
  { id: '2', code: 'Closed', description: 'Resolved case', active: false },
];

describe('CodeTableManager', () => {
  it('renders existing items', () => {
    renderWithTheme(
      <CodeTableManager
        title="Case Status Codes"
        description="Manage case status values"
        items={items}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('adds a new item', () => {
    const onAdd = vi.fn();
    renderWithTheme(
      <CodeTableManager
        title="Case Status Codes"
        description="Manage case status values"
        items={items}
        onAdd={onAdd}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Enter code...'), {
      target: { value: 'Pending' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Add Code' }));
    expect(onAdd).toHaveBeenCalledWith({
      code: 'Pending',
      description: undefined,
      active: true,
      category: undefined,
    });
  });

  it('deletes an item', () => {
    const onDelete = vi.fn();
    renderWithTheme(
      <CodeTableManager
        title="Case Status Codes"
        description="Manage case status values"
        items={items}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Delete Open' }));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('edits an item', () => {
    const onUpdate = vi.fn();
    renderWithTheme(
      <CodeTableManager
        title="Case Status Codes"
        description="Manage case status values"
        items={items}
        hasDescription
        onAdd={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Edit Open' }));
    const codeInput = screen.getByDisplayValue('Open');
    fireEvent.change(codeInput, { target: { value: 'Reopened' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onUpdate).toHaveBeenCalledWith('1', {
      code: 'Reopened',
      description: 'Active case',
      active: true,
      category: undefined,
    });
  });

  it('groups items by category when categoryOptions provided', () => {
    const grouped: CodeTableItem[] = [
      { id: '1', code: 'Toledo', active: true, category: 'US' },
      { id: '2', code: 'Toronto', active: true, category: 'Canada' },
    ];
    renderWithTheme(
      <CodeTableManager
        title="Locations"
        description="Manage locations"
        items={grouped}
        codeLabel="Location Name"
        categoryOptions={['US', 'Canada']}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByRole('heading', { name: 'US' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Canada' })).toBeInTheDocument();
  });
});
