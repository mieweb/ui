import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import {
  CaseTypeManager,
  type CaseTypeDefinition,
} from './CaseTypeManager';

const caseTypes: CaseTypeDefinition[] = [
  {
    id: '1',
    name: 'Short-term Disability',
    defaultTodos: ['Request medical documentation', 'Review eligibility'],
  },
];

describe('CaseTypeManager', () => {
  it('renders existing case types and their todos', () => {
    renderWithTheme(
      <CaseTypeManager
        caseTypes={caseTypes}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Short-term Disability')).toBeInTheDocument();
    expect(screen.getByText('Request medical documentation')).toBeInTheDocument();
    expect(screen.getByText('2 default todos')).toBeInTheDocument();
  });

  it('adds a new case type with todo lines', () => {
    const onAdd = vi.fn();
    renderWithTheme(
      <CaseTypeManager
        caseTypes={caseTypes}
        onAdd={onAdd}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    fireEvent.change(screen.getByLabelText('Case Type Name'), {
      target: { value: 'FMLA' },
    });
    fireEvent.change(
      screen.getByLabelText('Default Todo Items (one per line)'),
      { target: { value: 'Send packet\n\nFollow up' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add Case Type' }));
    expect(onAdd).toHaveBeenCalledWith({
      name: 'FMLA',
      defaultTodos: ['Send packet', 'Follow up'],
    });
  });

  it('deletes a case type', () => {
    const onDelete = vi.fn();
    renderWithTheme(
      <CaseTypeManager
        caseTypes={caseTypes}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Delete Short-term Disability' })
    );
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('hides the Test action when no preview callback is supplied', () => {
    renderWithTheme(
      <CaseTypeManager
        caseTypes={caseTypes}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(
      screen.queryByRole('button', { name: 'Test' })
    ).not.toBeInTheDocument();
  });

  it('previews generated todos via the callback', () => {
    const onPreviewTodos = vi.fn(() => [
      { title: 'Generated todo', dueDate: '2024-02-01' },
    ]);
    renderWithTheme(
      <CaseTypeManager
        caseTypes={caseTypes}
        onAdd={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
        onPreviewTodos={onPreviewTodos}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Test' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Generate Todo Preview' })
    );
    expect(onPreviewTodos).toHaveBeenCalled();
    expect(screen.getByText('Generated todo')).toBeInTheDocument();
  });
});
