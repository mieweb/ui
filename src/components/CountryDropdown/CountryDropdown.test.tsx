import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { CountryDropdown } from './CountryDropdown';

describe('CountryDropdown', () => {
  it('shows the placeholder and no selection by default', async () => {
    const user = userEvent.setup();
    renderWithTheme(<CountryDropdown />);
    const trigger = screen.getByRole('button', { name: 'Select country' });
    expect(trigger).toHaveTextContent('Select country…');
    expect(trigger).not.toHaveTextContent('United States');

    await user.click(trigger);
    expect(screen.queryByRole('option', { selected: true })).toBeNull();
  });

  it('treats an empty controlled value as no selection', () => {
    renderWithTheme(<CountryDropdown value="" placeholder="Pick one" />);
    expect(
      screen.getByRole('button', { name: 'Select country' })
    ).toHaveTextContent('Pick one');
  });

  it('renders an unknown code as empty before and after the list loads', async () => {
    const user = userEvent.setup();
    renderWithTheme(<CountryDropdown value="ZZ" />);
    const trigger = screen.getByRole('button', { name: 'Select country' });
    // Pre-open fallback branch (list not built yet)
    expect(trigger).toHaveTextContent('Select country…');
    expect(trigger).not.toHaveTextContent('ZZ');

    // Loaded-list branch: opening builds the full country list
    await user.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(trigger).toHaveTextContent('Select country…');
    expect(trigger).not.toHaveTextContent('ZZ');
  });

  it('starts with defaultValue selected when uncontrolled', () => {
    renderWithTheme(<CountryDropdown defaultValue="US" />);
    expect(
      screen.getByRole('button', { name: 'Select country' })
    ).toHaveTextContent('United States');
  });

  it('shows the picked country when uncontrolled', async () => {
    const user = userEvent.setup();
    renderWithTheme(<CountryDropdown />);
    const trigger = screen.getByRole('button', { name: 'Select country' });

    await user.click(trigger);
    await user.type(screen.getByLabelText('Search countries'), 'Canada');
    await user.click(screen.getByRole('option', { name: /Canada/ }));
    expect(trigger).toHaveTextContent('Canada');
  });

  it('shows the country name (not the dial code) on the trigger', () => {
    renderWithTheme(<CountryDropdown value="GB" />);
    const trigger = screen.getByRole('button', { name: 'Select country' });
    expect(trigger).toHaveTextContent('United Kingdom');
    expect(trigger).not.toHaveTextContent('+44');
  });

  it('lists countries without dial codes and fires onChange', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithTheme(<CountryDropdown onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Select country' }));
    const listbox = screen.getByRole('listbox');
    expect(
      listbox.querySelector('[data-slot="country-dropdown-option-dialcode"]')
    ).toBeNull();

    await user.type(screen.getByLabelText('Search countries'), 'Germany');
    await user.click(screen.getByRole('option', { name: /Germany/ }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'DE', name: 'Germany' })
    );
  });

  it('applies id to the trigger for label association', () => {
    renderWithTheme(
      <>
        <label htmlFor="country-select">Country</label>
        <CountryDropdown id="country-select" />
      </>
    );
    expect(screen.getByLabelText('Country')).toHaveAttribute(
      'data-slot',
      'country-dropdown-trigger'
    );
  });

  it('does not match dial codes when searching', async () => {
    const user = userEvent.setup();
    renderWithTheme(<CountryDropdown />);

    await user.click(screen.getByRole('button', { name: 'Select country' }));
    await user.type(screen.getByLabelText('Search countries'), '+44');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('No countries found')).toBeInTheDocument();
  });
});
