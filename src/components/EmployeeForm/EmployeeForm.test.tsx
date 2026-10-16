import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from '../../test/test-utils';
import { EmployeeForm } from './EmployeeForm';

const base = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  dob: '1990-01-01',
};

function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
}

describe('EmployeeForm address requirements', () => {
  it('blocks save and shows inline errors when the address is empty', async () => {
    const onSubmit = vi.fn();
    renderWithTheme(<EmployeeForm initialData={base} onSubmit={onSubmit} />);

    submit();

    await screen.findByText('Address line 1 is required');
    expect(screen.getByText('City is required')).toBeInTheDocument();
    expect(screen.getByText('State is required')).toBeInTheDocument();
    expect(screen.getByText('Postal code is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects a state that is not a 2-letter code', async () => {
    const onSubmit = vi.fn();
    renderWithTheme(
      <EmployeeForm
        initialData={{
          ...base,
          address: {
            street1: '1 Main St',
            city: 'Fort Wayne',
            state: 'Indiana',
            postalCode: '46802',
          },
        }}
        onSubmit={onSubmit}
      />
    );

    submit();

    await screen.findByText('Use the 2-letter state code');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a complete address', async () => {
    const onSubmit = vi.fn();
    const address = {
      street1: '1 Main St',
      city: 'Fort Wayne',
      state: 'IN',
      postalCode: '46802',
    };
    renderWithTheme(
      <EmployeeForm initialData={{ ...base, address }} onSubmit={onSubmit} />
    );

    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].address).toMatchObject(address);
  });

  it('allows an empty address when requireAddress is false', async () => {
    const onSubmit = vi.fn();
    renderWithTheme(
      <EmployeeForm
        initialData={base}
        requireAddress={false}
        onSubmit={onSubmit}
      />
    );

    submit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('City is required')).not.toBeInTheDocument();
  });
});
