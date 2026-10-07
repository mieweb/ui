import { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { act, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { AlertDialog } from './AlertDialog';
import { ConfirmDialogProvider, useConfirm } from './ConfirmDialogProvider';

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

  it('exposes role="alertdialog" labelled by the title and description', () => {
    renderWithTheme(
      <AlertDialog
        open
        onOpenChange={vi.fn()}
        title="Delete case?"
        description="This cannot be undone."
      />
    );
    const dialog = screen.getByRole('alertdialog', { name: 'Delete case?' });
    expect(dialog).toHaveAccessibleDescription('This cannot be undone.');
  });

  it.each(['destructive', 'warning', 'success', 'info'] as const)(
    'renders an icon for the %s variant',
    (variant) => {
      renderWithTheme(
        <AlertDialog open onOpenChange={vi.fn()} title="T" variant={variant} />
      );
      expect(
        document.querySelector('[data-slot="alert-dialog-icon"]')
      ).toBeInTheDocument();
    }
  );

  it('renders no icon for the default variant', () => {
    renderWithTheme(<AlertDialog open onOpenChange={vi.fn()} title="T" />);
    expect(
      document.querySelector('[data-slot="alert-dialog-icon"]')
    ).not.toBeInTheDocument();
  });

  it('uses labels for default strings', () => {
    renderWithTheme(
      <AlertDialog
        open
        onOpenChange={vi.fn()}
        title="T"
        labels={{ cancel: 'Annuler', action: 'Continuer' }}
      />
    );
    expect(screen.getByRole('button', { name: 'Annuler' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continuer' })
    ).toBeInTheDocument();
  });

  describe('focus', () => {
    it.each(['destructive', 'warning'] as const)(
      'focuses Cancel first for %s',
      (variant) => {
        renderWithTheme(
          <AlertDialog
            open
            onOpenChange={vi.fn()}
            title="T"
            variant={variant}
          />
        );
        expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
      }
    );

    it.each(['default', 'success', 'info'] as const)(
      'focuses the action first for %s',
      (variant) => {
        renderWithTheme(
          <AlertDialog
            open
            onOpenChange={vi.fn()}
            title="T"
            variant={variant}
          />
        );
        expect(screen.getByRole('button', { name: 'Continue' })).toHaveFocus();
      }
    );

    it('returns focus to the opener on close', () => {
      function Harness() {
        const [open, setOpen] = useState(false);
        return (
          <>
            <button onClick={() => setOpen(true)}>Open</button>
            <AlertDialog
              open={open}
              onOpenChange={setOpen}
              title="T"
              variant="destructive"
            />
          </>
        );
      }
      renderWithTheme(<Harness />);
      const opener = screen.getByRole('button', { name: 'Open' });
      opener.focus();
      fireEvent.click(opener);
      expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus();
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(opener).toHaveFocus();
    });
  });

  describe('async onAction', () => {
    function deferred() {
      let resolve!: () => void;
      let reject!: (e: Error) => void;
      const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
      });
      return { promise, resolve, reject };
    }

    it('shows a busy state and closes when the promise resolves', async () => {
      const { promise, resolve } = deferred();
      const onOpenChange = vi.fn();
      renderWithTheme(
        <AlertDialog
          open
          onOpenChange={onOpenChange}
          title="T"
          onAction={() => promise}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      const busy = screen.getByRole('button', { name: 'Working…' });
      expect(busy).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
      await act(async () => resolve());
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('stays open when onAction throws synchronously', () => {
      const onOpenChange = vi.fn();
      renderWithTheme(
        <AlertDialog
          open
          onOpenChange={onOpenChange}
          title="T"
          onAction={() => {
            throw new Error('nope');
          }}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    });

    it('stays open and re-enables when the promise rejects', async () => {
      const { promise, reject } = deferred();
      const onOpenChange = vi.fn();
      renderWithTheme(
        <AlertDialog
          open
          onOpenChange={onOpenChange}
          title="T"
          onAction={() => promise}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      await act(async () => reject(new Error('nope')));
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeEnabled();
    });

    it('ignores a stale async action after the dialog closes and reopens', async () => {
      const { promise, resolve } = deferred();
      const onOpenChange = vi.fn();
      const dialog = (open: boolean) => (
        <AlertDialog
          open={open}
          onOpenChange={onOpenChange}
          title="T"
          onAction={() => promise}
        />
      );
      const { rerender } = renderWithTheme(dialog(true));
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      // The parent closes the dialog while the action is pending, then
      // reuses the instance for another prompt.
      rerender(dialog(false));
      rerender(dialog(true));
      onOpenChange.mockClear();
      await act(async () => resolve());
      // The stale continuation must not close or un-busy the new dialog.
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Continue' })).toBeEnabled();
    });

    it('does not close on a synchronous onAction', () => {
      const onOpenChange = vi.fn();
      renderWithTheme(
        <AlertDialog
          open
          onOpenChange={onOpenChange}
          title="T"
          onAction={() => undefined}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });
});

describe('useConfirm', () => {
  function Harness({ onResult }: { onResult: (v: unknown) => void }) {
    const { confirm, alert } = useConfirm();
    return (
      <>
        <button
          onClick={async () =>
            onResult(await confirm({ title: 'Sure?', variant: 'destructive' }))
          }
        >
          Ask
        </button>
        <button onClick={async () => onResult(await alert({ title: 'Saved' }))}>
          Tell
        </button>
      </>
    );
  }

  function renderHarness() {
    const onResult = vi.fn();
    renderWithTheme(
      <ConfirmDialogProvider>
        <Harness onResult={onResult} />
      </ConfirmDialogProvider>
    );
    return onResult;
  }

  it('throws outside a provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderWithTheme(<Harness onResult={vi.fn()} />)).toThrow(
      /ConfirmDialogProvider/
    );
    spy.mockRestore();
  });

  it('resolves true when confirmed', async () => {
    const onResult = renderHarness();
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
    expect(screen.getByRole('alertdialog', { name: 'Sure?' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(true));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('resolves false when cancelled', async () => {
    const onResult = renderHarness();
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
  });

  it('alert hides Cancel and resolves on OK', async () => {
    const onResult = renderHarness();
    fireEvent.click(screen.getByRole('button', { name: 'Tell' }));
    expect(
      screen.queryByRole('button', { name: 'Cancel' })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(undefined));
  });

  it('settles a pending confirm as cancelled when the provider unmounts', async () => {
    const onResult = vi.fn();
    const { unmount } = renderWithTheme(
      <ConfirmDialogProvider>
        <Harness onResult={onResult} />
      </ConfirmDialogProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ask' }));
    unmount();
    await waitFor(() => expect(onResult).toHaveBeenCalledWith(false));
  });
});
