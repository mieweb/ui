import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as React from 'react';
import { InlineEdit, type InlineEditProps } from './InlineEdit';

function Harness(props: Partial<InlineEditProps>) {
  const [value, setValue] = React.useState(props.value ?? 'Acme');
  return (
    <InlineEdit
      label="Name"
      {...props}
      value={value}
      onSave={async (v) => {
        await props.onSave?.(v);
        setValue(v);
      }}
    />
  );
}

describe('InlineEdit', () => {
  it('saves on Enter and returns focus to the display button', async () => {
    const onSave = vi.fn();
    render(<Harness onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Name' }));
    const input = screen.getByRole('textbox', { name: 'Name' });
    expect(input).toHaveFocus();
    await userEvent.clear(input);
    await userEvent.type(input, 'Globex{Enter}');
    expect(onSave).toHaveBeenCalledWith('Globex');
    const display = await screen.findByRole('button', { name: 'Edit Name' });
    await waitFor(() => expect(display).toHaveTextContent('Globex'));
    expect(display).toHaveFocus();
  });

  it('cancels on Escape without saving', async () => {
    const onSave = vi.fn();
    render(<InlineEdit label="Name" value="Acme" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Name' }));
    await userEvent.type(screen.getByRole('textbox'), 'xyz{Escape}');
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Edit Name' })).toHaveFocus();
    expect(screen.getByText('Acme')).toBeInTheDocument();
  });

  it('blocks the save when validate returns a message', async () => {
    const onSave = vi.fn();
    render(
      <InlineEdit
        label="Email"
        type="email"
        value=""
        onSave={onSave}
        validate={(v) => (v.includes('@') ? undefined : 'Invalid email')}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit Email' }));
    await userEvent.type(screen.getByRole('textbox'), 'nope{Enter}');
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('restores the previous value and announces the error on rejection', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Server said no'));
    render(<InlineEdit label="Name" value="Acme" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Name' }));
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'Globex{Enter}');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Server said no'
    );
    expect(screen.getByRole('button', { name: 'Edit Name' })).toHaveTextContent(
      'Acme'
    );
  });

  it('shows a pending state while saving', async () => {
    let resolve!: () => void;
    const onSave = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<InlineEdit label="Name" value="Acme" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Name' }));
    await userEvent.type(screen.getByRole('textbox'), '!{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');
    expect(screen.getByRole('button', { name: 'Edit Name' })).toHaveAttribute(
      'aria-busy',
      'true'
    );
    resolve();
    await waitFor(() =>
      expect(screen.queryByRole('status')).not.toBeInTheDocument()
    );
  });

  it('saves on blur by default and cancels on blur when disabled', async () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <>
        <InlineEdit label="Name" value="Acme" onSave={onSave} />
        <button>outside</button>
      </>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit Name' }));
    await userEvent.type(screen.getByRole('textbox'), '1');
    await userEvent.click(screen.getByText('outside'));
    expect(onSave).toHaveBeenCalledWith('Acme1');

    onSave.mockClear();
    rerender(
      <>
        <InlineEdit
          label="Name"
          value="Acme"
          onSave={onSave}
          saveOnBlur={false}
        />
        <button>outside</button>
      </>
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit Name' }));
    await userEvent.type(screen.getByRole('textbox'), '2');
    await userEvent.click(screen.getByText('outside'));
    expect(onSave).not.toHaveBeenCalled();
  });

  it('uses Cmd/Ctrl+Enter to save a textarea', async () => {
    const onSave = vi.fn();
    render(
      <InlineEdit label="Notes" type="textarea" value="" onSave={onSave} />
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit Notes' }));
    const area = screen.getByRole('textbox');
    await userEvent.type(area, 'line{Enter}two');
    expect(onSave).not.toHaveBeenCalled();
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    expect(onSave).toHaveBeenCalledWith('line\ntwo');
  });

  it('renders select options and shows the option label', async () => {
    const onSave = vi.fn();
    render(
      <InlineEdit
        label="Stage"
        type="select"
        value="lead"
        options={[
          { value: 'lead', label: 'Lead' },
          { value: 'won', label: 'Won' },
        ]}
        onSave={onSave}
      />
    );
    expect(screen.getByText('Lead')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Edit Stage' }));
    await userEvent.selectOptions(screen.getByRole('combobox'), 'won');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith('won');
  });

  it('formats dates and renders read-only values without a button', () => {
    render(
      <InlineEdit
        label="Due"
        type="date"
        value="2026-03-04"
        readOnly
        onSave={vi.fn()}
      />
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('shows the placeholder for empty values and ignores clicks when disabled', async () => {
    render(
      <InlineEdit
        label="Phone"
        type="tel"
        value=""
        placeholder="Add phone"
        disabled
        onSave={vi.fn()}
      />
    );
    const display = screen.getByRole('button', { name: 'Edit Phone' });
    expect(display).toHaveTextContent('Add phone');
    expect(display).toBeDisabled();
  });

  it('leaves edit mode without saving when the value is unchanged', async () => {
    const onSave = vi.fn();
    render(<InlineEdit label="Name" value="Acme" onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit Name' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Edit Name' })).toHaveFocus();
  });
});
