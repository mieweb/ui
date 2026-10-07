import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { TagEditor, type TagEditorProps } from './TagEditor';

function Harness(props: Partial<TagEditorProps>) {
  const [tags, setTags] = React.useState(props.value ?? ['vip']);
  return (
    <TagEditor
      label="Tags"
      {...props}
      value={tags}
      onChange={(next) => {
        props.onChange?.(next);
        setTags(next);
      }}
    />
  );
}

describe('TagEditor', () => {
  it('adds on Enter and on comma', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const input = screen.getByRole('combobox', { name: 'Tags' });
    await userEvent.type(input, 'renewal{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['vip', 'renewal']);
    await userEvent.type(input, 'pilot,');
    expect(onChange).toHaveBeenLastCalledWith(['vip', 'renewal', 'pilot']);
    expect(input).toHaveValue('');
  });

  it('removes the last tag with Backspace and a tag with its button', async () => {
    render(<Harness value={['a', 'b', 'c']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Remove b' }));
    expect(screen.queryByText('b')).not.toBeInTheDocument();
    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.keyboard('{Backspace}');
    expect(screen.queryByText('c')).not.toBeInTheDocument();
    expect(screen.getByText('a')).toBeInTheDocument();
  });

  it('rejects case-insensitive duplicates', async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    await userEvent.type(screen.getByRole('combobox'), 'VIP{Enter}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '"VIP" is already added'
    );
  });

  it('enforces maxTags and validate', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TagEditor value={['a']} maxTags={1} onChange={onChange} />
    );
    // At the limit the input is read-only, so a paste-style add must still be blocked
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('combobox')).toHaveAttribute('readonly');

    rerender(
      <TagEditor
        value={[]}
        onChange={onChange}
        validate={(t) => (t.length > 3 ? 'Too long' : undefined)}
      />
    );
    await userEvent.type(screen.getByRole('combobox'), 'toolong{Enter}');
    expect(screen.getByRole('alert')).toHaveTextContent('Too long');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('selects a suggestion with the keyboard', async () => {
    const onChange = vi.fn();
    render(
      <Harness
        value={[]}
        onChange={onChange}
        suggestions={['Enterprise', 'Expansion', 'Churn risk']}
      />
    );
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'ex');
    const list = screen.getByRole('listbox');
    expect(list).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(1);
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['Expansion']);
  });

  it('closes suggestions on Escape and picks one with the mouse', async () => {
    const onChange = vi.fn();
    render(
      <Harness value={[]} onChange={onChange} suggestions={['Alpha', 'Beta']} />
    );
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option')).toHaveLength(2);
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.click(screen.getByRole('option', { name: 'Beta' }));
    expect(onChange).toHaveBeenLastCalledWith(['Beta']);
  });

  it('ignores edits while a save is pending', async () => {
    let resolve!: () => void;
    const onChange = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(
      <TagEditor
        label="Tags"
        value={['vip', 'renewal']}
        suggestions={['pilot', 'beta']}
        onChange={onChange}
      />
    );
    const input = screen.getByRole('combobox', { name: 'Tags' });
    await userEvent.type(input, 'new{Enter}');
    expect(onChange).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Backspace}');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    resolve();
    await waitFor(() =>
      expect(input.closest('[aria-busy]')).not.toBeInTheDocument()
    );
  });

  it('shows pending and an error when onChange rejects', async () => {
    let reject!: (e: Error) => void;
    const onChange = vi.fn(() => new Promise<void>((_, r) => (reject = r)));
    render(<TagEditor value={[]} onChange={onChange} />);
    await userEvent.type(screen.getByRole('combobox'), 'x{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');
    reject(new Error('nope'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Could not save tags')
    );
  });

  it('commits the draft on blur and hides controls when readOnly', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <>
        <TagEditor value={[]} onChange={onChange} />
        <button>outside</button>
      </>
    );
    await userEvent.type(screen.getByRole('combobox'), 'draft');
    await userEvent.click(screen.getByText('outside'));
    expect(onChange).toHaveBeenCalledWith(['draft']);

    rerender(<TagEditor value={['x']} onChange={onChange} readOnly />);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
