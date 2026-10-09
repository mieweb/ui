import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PropertyList, type PropertyListItem } from './PropertyList';

const items: PropertyListItem[] = [
  {
    key: 'email',
    label: 'Email',
    value: 'ada@example.com',
    editable: true,
    copyable: true,
    type: 'email',
  },
  {
    key: 'phone',
    label: 'Phone',
    value: '',
    editable: true,
    placeholder: 'Add phone',
  },
  {
    key: 'id',
    label: 'Record ID',
    value: 1042,
    hint: 'Assigned by the system',
  },
  { key: 'notes', label: 'Notes', value: null },
];

describe('PropertyList', () => {
  it('renders a description list with labels, values and the empty marker', () => {
    render(<PropertyList items={items} onSave={vi.fn()} />);
    const terms = screen.getAllByRole('term').map((t) => t.textContent);
    expect(terms).toEqual(['Email', 'Phone', 'Record ID', 'Notes']);
    expect(screen.getByText('1042')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('Add phone')).toBeInTheDocument();
    expect(screen.getByText('Assigned by the system')).toBeInTheDocument();
  });

  it('edits through InlineEdit and calls onSave with the key', async () => {
    const onSave = vi.fn();
    render(<PropertyList items={items} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Phone' }));
    await userEvent.type(screen.getByRole('textbox'), '555-0100{Enter}');
    expect(onSave).toHaveBeenCalledWith('phone', '555-0100');
  });

  it('treats editable items as read-only without onSave', () => {
    render(<PropertyList items={items} />);
    expect(
      screen.queryByRole('button', { name: /^Edit/ })
    ).not.toBeInTheDocument();
  });

  it('renders a copy button only for non-empty copyable values', () => {
    render(<PropertyList items={items} />);
    expect(screen.getAllByRole('button', { name: /^Copy/ })).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Copy Email' })
    ).toBeInTheDocument();
  });

  it('hides empty values behind a toggle', async () => {
    render(<PropertyList items={items} hideEmpty />);
    expect(screen.queryByText('Notes')).not.toBeInTheDocument();
    const toggle = screen.getByRole('button', { name: 'Show 2 empty fields' });
    await userEvent.click(toggle);
    expect(screen.getByText('Notes')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveTextContent('Hide 2 empty fields');
  });

  it('renders collapsible groups with headings', async () => {
    render(
      <PropertyList
        headingLevel={2}
        groups={[
          { id: 'contact', title: 'Contact', items: items.slice(0, 2) },
          {
            id: 'system',
            title: 'System',
            items: items.slice(2),
            defaultOpen: false,
          },
        ]}
      />
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Contact' });
    const trigger = within(heading).getByRole('button');
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.queryByText('Record ID')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'System' }));
    expect(screen.getByText('Record ID')).toBeInTheDocument();
  });

  it('uses custom render and select option labels', () => {
    render(
      <PropertyList
        layout="inline"
        density="compact"
        items={[
          {
            key: 'stage',
            label: 'Stage',
            value: 'won',
            type: 'select',
            options: [{ value: 'won', label: 'Closed won' }],
          },
          {
            key: 'site',
            label: 'Website',
            value: 'acme.test',
            render: (v) => <a href={`https://${v}`}>{v}</a>,
          },
        ]}
      />
    );
    expect(screen.getByText('Closed won')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'acme.test' })).toBeInTheDocument();
  });
});
