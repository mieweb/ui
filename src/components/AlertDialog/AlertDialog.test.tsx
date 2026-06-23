import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { AlertDialog } from './AlertDialog';

describe('AlertDialog', () => {
  it('does not render when closed', () => {
    renderWithTheme(
      <AlertDialog open={false} onOpenChange={vi.fn()} title="Delete?" />
    );
    expect(screen.queryByText('Delete?')).not.toBeInTheDocument();
  });

  it('renders the title and description when open', () => {
    renderWithTheme(
      <AlertDialog
        open
        onOpenChange={vi.fn()}
        title="Delete case?"
        description="This cannot be undone."
      />
    );
    expect(screen.getByText('Delete case?')).toBeInTheDocument();
    expect(screen.getByText('This cannot be undone.')).toBeInTheDocument();
  });

  it('calls onAction when the action button is clicked', () => {
    const onAction = vi.fn();
    renderWithTheme(
      <AlertDialog
        open
        onOpenChange={vi.fn()}
        title="Confirm"
        actionLabel="Continue"
        onAction={onAction}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel and closes when cancel is clicked', () => {
    const onCancel = vi.fn();
    const onOpenChange = vi.fn();
    renderWithTheme(
      <AlertDialog
        open
        onOpenChange={onOpenChange}
        title="Confirm"
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('hides the cancel button when hideCancel is set', () => {
    renderWithTheme(
      <AlertDialog open onOpenChange={vi.fn()} title="Confirm" hideCancel />
    );
    expect(
      screen.queryByRole('button', { name: /cancel/i })
    ).not.toBeInTheDocument();
  });

  it('disables the action button when actionDisabled is set', () => {
    renderWithTheme(
      <AlertDialog
        open
        onOpenChange={vi.fn()}
        title="Confirm"
        actionLabel="Continue"
        actionDisabled
      />
    );
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });
});
