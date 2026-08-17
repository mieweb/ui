import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { CountryDropdown } from './CountryDropdown';

describe('CountryDropdown', () => {
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
