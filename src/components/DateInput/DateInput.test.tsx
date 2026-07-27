import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { DateInput } from './DateInput';

describe('DateInput', () => {
  it('shows only calendar years within its date bounds', async () => {
    const user = userEvent.setup();

    renderWithTheme(
      <DateInput
        label="Service date"
        minDate="07/19/2001"
        maxDate="07/19/2025"
        showCalendar
      />
    );

    await user.click(screen.getByRole('button', { name: 'Open calendar' }));

    const years = Array.from(
      screen.getByLabelText('Select year').querySelectorAll('option')
    ).map((option) => option.textContent);

    expect(years).toEqual(
      Array.from({ length: 25 }, (_, index) => String(2001 + index))
    );
  });
});
