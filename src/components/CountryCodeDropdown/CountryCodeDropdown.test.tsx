import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { CountryCodeDropdown } from './CountryCodeDropdown';

describe('CountryCodeDropdown', () => {
  it('still defaults to United States (+1) when uncontrolled', () => {
    renderWithTheme(<CountryCodeDropdown />);
    const trigger = screen.getByRole('button', { name: 'Select country code' });
    expect(trigger).toHaveTextContent('+1');
    expect(trigger).not.toHaveTextContent('Select country…');
  });

  it('supports a controlled empty state with a placeholder', () => {
    renderWithTheme(<CountryCodeDropdown value="" placeholder="Code" />);
    expect(
      screen.getByRole('button', { name: 'Select country code' })
    ).toHaveTextContent('Code');
  });
});
