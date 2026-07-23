import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { Select, type SelectOption } from './Select';

const LOCATION_TYPES: SelectOption[] = [
  { value: 'cardiology', label: 'Cardiology' },
  { value: 'chiropractic', label: 'Chiropractic' },
  { value: 'clinic', label: 'Clinic' },
  { value: 'collection-site', label: 'Collection Site' },
  { value: 'corporate', label: 'Corporate Location' },
  { value: 'dermatology', label: 'Dermatology' },
  { value: 'family-care', label: 'Family Care Clinic' },
];

describe('Select typeahead', () => {
  it('jumps to and selects the option matching the typed characters', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderWithTheme(
      <Select
        aria-label="Location Type"
        options={LOCATION_TYPES}
        onValueChange={onValueChange}
      />
    );

    await user.tab();
    expect(screen.getByRole('combobox')).toHaveFocus();

    // Typing "der" should highlight "Dermatology"; Enter selects it.
    await user.keyboard('der');
    await user.keyboard('{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('dermatology');
  });

  it('lands on the first match then cycles when the same key repeats', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <Select aria-label="Location Type" options={LOCATION_TYPES} />
    );

    await user.click(screen.getByRole('combobox'));

    // Fresh keystroke lands on the first "c" match.
    await user.keyboard('c');
    expect(screen.getByRole('option', { name: 'Cardiology' })).toHaveAttribute(
      'data-highlighted',
      'true'
    );

    // Repeating the same key (continuous) cycles to the next matches.
    await user.keyboard('c');
    expect(
      screen.getByRole('option', { name: 'Chiropractic' })
    ).toHaveAttribute('data-highlighted', 'true');

    await user.keyboard('c');
    expect(screen.getByRole('option', { name: 'Clinic' })).toHaveAttribute(
      'data-highlighted',
      'true'
    );
  });

  it('does not hijack typing when searchable (search input handles it)', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    renderWithTheme(
      <Select
        aria-label="Location Type"
        searchable
        options={LOCATION_TYPES}
        onValueChange={onValueChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    const search = screen.getByRole('textbox', { name: 'Search options' });
    await user.type(search, 'family');

    // The list should be filtered to the single matching option.
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent('Family Care Clinic');
  });
});
