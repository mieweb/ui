import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { FloatingWindow, MinimizedWindow } from './FloatingWindow';

describe('FloatingWindow', () => {
  const baseProps = {
    open: true,
    title: 'Encounter Note',
    onClose: vi.fn(),
  };

  it('renders the title and children when open', () => {
    renderWithTheme(
      <FloatingWindow {...baseProps}>
        <p>Body content</p>
      </FloatingWindow>
    );
    expect(screen.getByText('Encounter Note')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = renderWithTheme(
      <FloatingWindow {...baseProps} open={false}>
        <p>Body content</p>
      </FloatingWindow>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when minimized', () => {
    const { container } = renderWithTheme(
      <FloatingWindow {...baseProps} minimized>
        <p>Body content</p>
      </FloatingWindow>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('calls onClose when the close control is clicked', () => {
    const onClose = vi.fn();
    renderWithTheme(
      <FloatingWindow {...baseProps} onClose={onClose}>
        <p>Body</p>
      </FloatingWindow>
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows minimize and pop-out controls only when handlers are provided', () => {
    const { rerender } = renderWithTheme(
      <FloatingWindow {...baseProps}>
        <p>Body</p>
      </FloatingWindow>
    );
    expect(
      screen.queryByRole('button', { name: /minimize/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /open in new window/i })
    ).not.toBeInTheDocument();

    rerender(
      <FloatingWindow
        {...baseProps}
        onMinimize={vi.fn()}
        onPopOut={vi.fn()}
      >
        <p>Body</p>
      </FloatingWindow>
    );
    expect(
      screen.getByRole('button', { name: /minimize/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /open in new window/i })
    ).toBeInTheDocument();
  });

  it('renders footer content', () => {
    renderWithTheme(
      <FloatingWindow {...baseProps} footer={<button>Save Note</button>}>
        <p>Body</p>
      </FloatingWindow>
    );
    expect(
      screen.getByRole('button', { name: 'Save Note' })
    ).toBeInTheDocument();
  });

  it('exposes the dialog role with an accessible name from a string title', () => {
    renderWithTheme(
      <FloatingWindow {...baseProps}>
        <p>Body</p>
      </FloatingWindow>
    );
    expect(
      screen.getByRole('dialog', { name: 'Encounter Note' })
    ).toBeInTheDocument();
  });
});

describe('MinimizedWindow', () => {
  it('calls onRestore and onClose', () => {
    const onRestore = vi.fn();
    const onClose = vi.fn();
    renderWithTheme(
      <MinimizedWindow
        title="Encounter Note"
        onRestore={onRestore}
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /encounter note/i }));
    expect(onRestore).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
