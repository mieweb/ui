import { describe, expect, it, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { renderWithTheme } from '../../test/test-utils';
import { FileDocument, type FileDocumentProps } from './FileDocument';

const plainRenderer: FileDocumentProps['renderMarkdown'] = (markdown) => (
  <div data-testid="rendered">{markdown}</div>
);

function renderDocument(props: Partial<FileDocumentProps> = {}) {
  return renderWithTheme(
    <FileDocument
      path="notes/plan.md"
      content="# Plan"
      onSave={() => {}}
      renderMarkdown={plainRenderer}
      {...props}
    />
  );
}

const modeButton = (name: 'View' | 'Edit') =>
  screen.getByRole('button', { name });
const editor = () =>
  screen.getByRole('textbox', { name: 'Contents of notes/plan.md' });

describe('FileDocument', () => {
  it('opens in View and keeps the draft across View and Edit', () => {
    renderDocument();
    expect(screen.getByTestId('rendered')).toHaveTextContent('# Plan');
    expect(modeButton('View')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('group', { name: 'Display mode' })).toBeVisible();

    fireEvent.click(modeButton('Edit'));
    fireEvent.change(editor(), { target: { value: '# Plan v2' } });
    fireEvent.click(modeButton('View'));

    expect(screen.getByTestId('rendered')).toHaveTextContent('# Plan v2');
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes');

    fireEvent.click(modeButton('Edit'));
    expect(editor()).toHaveValue('# Plan v2');
  });

  it('saves the draft and returns to View', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderDocument({ onSave, defaultMode: 'edit' });
    fireEvent.change(editor(), { target: { value: '# Saved' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.getByTestId('rendered')).toBeVisible());
    expect(onSave).toHaveBeenCalledWith('# Saved');
  });

  it('locks the editor while a save is pending', async () => {
    let finishSave = () => {};
    const onSave = () =>
      new Promise<void>((resolve) => {
        finishSave = resolve;
      });
    renderDocument({ onSave, defaultMode: 'edit' });
    fireEvent.change(editor(), { target: { value: '# Saving' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(editor()).toHaveAttribute('readonly');
    finishSave();
    await waitFor(() => expect(screen.getByTestId('rendered')).toBeVisible());
  });

  it('stays in Edit and shows an error when saving fails', async () => {
    renderDocument({
      defaultMode: 'edit',
      onSave: () => Promise.reject(new Error('offline')),
    });
    fireEvent.change(editor(), { target: { value: '# Draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The file could not be saved.'
    );
    expect(editor()).toHaveValue('# Draft');
  });

  it('returns to Edit when saving from the View preview fails', async () => {
    renderDocument({
      defaultMode: 'edit',
      onSave: () => Promise.reject(new Error('offline')),
    });
    fireEvent.change(editor(), { target: { value: '# Draft' } });
    fireEvent.click(modeButton('View'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('alert')).toBeVisible();
    expect(modeButton('Edit')).toHaveAttribute('aria-pressed', 'true');
    expect(editor()).toHaveValue('# Draft');
  });

  it('asks before Cancel discards an edited draft', async () => {
    const confirmDiscard = vi
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    const onCancel = vi.fn();
    renderDocument({ defaultMode: 'edit', confirmDiscard, onCancel });
    fireEvent.change(editor(), { target: { value: '# Draft' } });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(confirmDiscard).toHaveBeenCalledTimes(1));
    expect(editor()).toHaveValue('# Draft');

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.getByTestId('rendered')).toHaveTextContent('# Plan')
    );
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('restores the latest content when Cancel is confirmed after a reload', async () => {
    let confirm = (_ok: boolean) => {};
    const confirmDiscard = () =>
      new Promise<boolean>((resolve) => {
        confirm = resolve;
      });
    const props = {
      path: 'notes/plan.md',
      onSave: () => {},
      renderMarkdown: plainRenderer,
      defaultMode: 'edit' as const,
      confirmDiscard,
    };
    const { rerender } = renderWithTheme(
      <FileDocument {...props} content="# Plan" />
    );
    fireEvent.change(editor(), { target: { value: '# Draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    rerender(<FileDocument {...props} content="# From server" />);
    confirm(true);

    await waitFor(() =>
      expect(screen.getByTestId('rendered')).toHaveTextContent('# From server')
    );
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('cancels a clean draft without asking', async () => {
    const confirmDiscard = vi.fn();
    renderDocument({ defaultMode: 'edit', confirmDiscard });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.getByTestId('rendered')).toBeVisible());
    expect(confirmDiscard).not.toHaveBeenCalled();
  });

  it('follows reloaded content until the draft is edited', () => {
    const { rerender } = renderDocument({ defaultMode: 'edit' });
    const reload = (content: string) =>
      rerender(
        <FileDocument
          path="notes/plan.md"
          content={content}
          onSave={() => {}}
          renderMarkdown={plainRenderer}
          defaultMode="edit"
        />
      );

    reload('# From server');
    expect(editor()).toHaveValue('# From server');

    fireEvent.change(editor(), { target: { value: '# Mine' } });
    reload('# Newer from server');
    expect(editor()).toHaveValue('# Mine');
  });

  it('does not submit an enclosing form from Save or Cancel', async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const onSave = vi.fn();
    renderWithTheme(
      <form onSubmit={onSubmit}>
        <FileDocument
          path="notes/plan.md"
          content="# Plan"
          onSave={onSave}
          renderMarkdown={plainRenderer}
          defaultMode="edit"
        />
      </form>
    );
    fireEvent.change(editor(), { target: { value: '# Draft' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(onSave).toHaveBeenCalled());
    fireEvent.click(modeButton('Edit'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('supports a controlled draft and reports dirty changes', () => {
    const onDirtyChange = vi.fn();
    function Host() {
      const [draft, setDraft] = React.useState('# Plan');
      return (
        <FileDocument
          path="notes/plan.md"
          content="# Plan"
          draft={draft}
          onDraftChange={setDraft}
          onDirtyChange={onDirtyChange}
          onSave={() => {}}
          renderMarkdown={plainRenderer}
          defaultMode="edit"
        />
      );
    }
    renderWithTheme(<Host />);

    fireEvent.change(editor(), { target: { value: '# Plan!' } });
    expect(editor()).toHaveValue('# Plan!');
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);

    fireEvent.change(editor(), { target: { value: '# Plan' } });
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });
});
