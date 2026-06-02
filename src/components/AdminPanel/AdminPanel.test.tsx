import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { AdminPanel } from './AdminPanel';

const sections = [
  { value: 'one', label: 'Section One', content: <p>First content</p> },
  { value: 'two', label: 'Section Two', content: <p>Second content</p> },
];

describe('AdminPanel', () => {
  it('renders the title and section tabs', () => {
    renderWithTheme(<AdminPanel sections={sections} />);
    expect(
      screen.getByRole('heading', { name: 'Admin Panel' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Section One' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'Section Two' })
    ).toBeInTheDocument();
  });

  it('shows the first section content by default', () => {
    renderWithTheme(<AdminPanel sections={sections} />);
    expect(screen.getByText('First content')).toBeInTheDocument();
  });

  it('switches sections and notifies the callback', () => {
    const onSectionChange = vi.fn();
    renderWithTheme(
      <AdminPanel sections={sections} onSectionChange={onSectionChange} />
    );
    fireEvent.click(screen.getByRole('tab', { name: 'Section Two' }));
    expect(onSectionChange).toHaveBeenCalledWith('two');
    expect(screen.getByText('Second content')).toBeInTheDocument();
  });

  it('honors a custom title and description', () => {
    renderWithTheme(
      <AdminPanel
        sections={sections}
        title="Configuration"
        description="Custom description"
      />
    );
    expect(
      screen.getByRole('heading', { name: 'Configuration' })
    ).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
  });

  it('respects a controlled active section', () => {
    renderWithTheme(<AdminPanel sections={sections} activeSection="two" />);
    expect(screen.getByText('Second content')).toBeInTheDocument();
  });
});
