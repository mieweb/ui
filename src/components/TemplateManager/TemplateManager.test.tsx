import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  TemplateManager,
  type TemplateInput,
  type TemplateItem,
} from './TemplateManager';

const initial: TemplateItem[] = [
  {
    id: '1',
    code: 'initial-contact',
    name: 'Initial Contact',
    description: 'First contact letter.',
    content: '<p>Hello</p>',
    active: true,
  },
];

function Harness({
  onAdd = vi.fn(),
  onUpdate = vi.fn(),
  onDelete = vi.fn(),
}: {
  onAdd?: (t: TemplateInput) => void;
  onUpdate?: (id: string, u: Partial<TemplateInput>) => void;
  onDelete?: (id: string) => void;
}) {
  const [templates, setTemplates] = useState<TemplateItem[]>(initial);
  return (
    <TemplateManager
      templates={templates}
      onAdd={(t) => {
        onAdd(t);
        setTemplates((prev) => [...prev, { id: '2', ...t }]);
      }}
      onUpdate={onUpdate}
      onDelete={(id) => {
        onDelete(id);
        setTemplates((prev) => prev.filter((x) => x.id !== id));
      }}
      entityLabel="Letter Template"
    />
  );
}

describe('TemplateManager', () => {
  it('renders existing templates', () => {
    renderWithTheme(<Harness />);
    expect(screen.getByText('Initial Contact')).toBeInTheDocument();
    expect(screen.getByText('Code: initial-contact')).toBeInTheDocument();
  });

  it('opens the create dialog', async () => {
    renderWithTheme(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Create Letter Template' }));
    expect(await screen.findByLabelText('Template Name *')).toBeInTheDocument();
  });

  it('adds a new template', async () => {
    const onAdd = vi.fn();
    renderWithTheme(<Harness onAdd={onAdd} />);
    fireEvent.click(screen.getByRole('button', { name: 'Create Letter Template' }));
    fireEvent.change(await screen.findByLabelText('Template Name *'), {
      target: { value: 'RTW Notice' },
    });
    fireEvent.change(screen.getByLabelText('Template Code *'), {
      target: { value: 'RTW Notice' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Template' }));
    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'RTW Notice', code: 'rtw-notice' })
      )
    );
  });

  it('disables save until name and code are provided', async () => {
    renderWithTheme(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'Create Letter Template' }));
    expect(
      await screen.findByRole('button', { name: 'Create Template' })
    ).toBeDisabled();
  });

  it('confirms before deleting a template', async () => {
    const onDelete = vi.fn();
    renderWithTheme(<Harness onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Delete Initial Contact' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('1'));
  });
});
