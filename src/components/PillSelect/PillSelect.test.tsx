import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { PillSelect } from './PillSelect';

const options = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
];

describe('PillSelect', () => {
  it('renders an accessible fallback when no label or options are provided', () => {
    renderWithTheme(<PillSelect options={[]} />);

    expect(screen.getByRole('button', { name: /no options/i })).toBeDisabled();
  });

  it('expands and selects an enabled option', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderWithTheme(
      <PillSelect
        options={options}
        defaultValue="small"
        label="Size"
        onValueChange={onValueChange}
      />
    );

    const trigger = screen.getByRole('button', { name: /size: small/i });

    await user.click(trigger);
    expect(trigger).toBeVisible();
    expect(
      screen.getByRole('listbox', { name: /size options/i })
    ).toBeVisible();

    await user.click(screen.getByRole('option', { name: /medium/i }));

    expect(onValueChange).toHaveBeenCalledWith('medium');
    expect(screen.getByRole('button', { name: /size: medium/i })).toBeVisible();
  });

  it('does not select disabled options', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderWithTheme(
      <PillSelect
        options={[options[0], { ...options[1], disabled: true }]}
        defaultValue="small"
        label="Size"
        onValueChange={onValueChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /size: small/i }));
    expect(screen.getByRole('option', { name: /medium/i })).toBeDisabled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('uses the controlled value from props', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderWithTheme(
      <PillSelect
        options={options}
        value="large"
        label="Size"
        onValueChange={onValueChange}
      />
    );

    expect(screen.getByRole('button', { name: /size: large/i })).toBeVisible();
    await user.click(screen.getByRole('button', { name: /size: large/i }));
    await user.click(screen.getByRole('option', { name: /small/i }));

    expect(onValueChange).toHaveBeenCalledWith('small');
  });

  it('closes expanded options with Escape', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <PillSelect options={options} defaultValue="small" label="Size" />
    );

    await user.click(screen.getByRole('button', { name: /size: small/i }));
    expect(
      screen.getByRole('listbox', { name: /size options/i })
    ).toBeVisible();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox', { name: /size options/i })).toBeNull();
    expect(screen.getByRole('button', { name: /size: small/i })).toBeVisible();
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /size: small/i })).toHaveFocus()
    );
  });

  it('renders options outside the trigger wrapper to avoid layout shift', async () => {
    const user = userEvent.setup();
    const { container } = renderWithTheme(
      <PillSelect options={options} defaultValue="small" label="Size" />
    );

    await user.click(screen.getByRole('button', { name: /size: small/i }));

    const listbox = screen.getByRole('listbox', { name: /size options/i });

    expect(container).not.toContainElement(listbox);
    expect(screen.getByRole('button', { name: /size: small/i })).toBeVisible();
  });

  it('does not scroll the page when moving focus on open', async () => {
    const user = userEvent.setup();
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');

    renderWithTheme(
      <PillSelect options={options} defaultValue="small" label="Size" />
    );

    await user.click(screen.getByRole('button', { name: /size: small/i }));

    expect(
      screen.getByRole('listbox', { name: /size options/i })
    ).toBeVisible();
    await waitFor(() =>
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true })
    );

    focusSpy.mockRestore();
  });
});
