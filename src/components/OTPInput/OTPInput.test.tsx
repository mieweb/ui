import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { renderWithTheme } from '../../test/test-utils';
import { OTPInput } from './OTPInput';

function Harness({
  onComplete,
  length,
  initial = '',
}: {
  onComplete?: (value: string) => void;
  length?: number;
  initial?: string;
}) {
  const [value, setValue] = useState(initial);
  return (
    <OTPInput
      label="Verification code"
      value={value}
      onChange={setValue}
      onComplete={onComplete}
      length={length}
    />
  );
}

describe('OTPInput', () => {
  it('renders one cell per length', () => {
    renderWithTheme(<Harness length={4} />);
    expect(screen.getAllByRole('textbox')).toHaveLength(4);
  });

  it('defaults to six cells', () => {
    renderWithTheme(<Harness />);
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
  });

  it('types digits, advances focus, and fires onComplete', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    renderWithTheme(<Harness length={4} onComplete={onComplete} />);

    const cells = screen.getAllByRole('textbox');
    cells[0].focus();
    await user.keyboard('1234');

    expect(cells[0]).toHaveValue('1');
    expect(cells[3]).toHaveValue('4');
    expect(onComplete).toHaveBeenCalledWith('1234');
  });

  it('ignores non-numeric characters by default', async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness length={4} />);

    const cells = screen.getAllByRole('textbox');
    cells[0].focus();
    await user.keyboard('a5');

    expect(cells[0]).toHaveValue('5');
  });

  it('moves to the previous cell on backspace when empty', async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness length={4} initial="12" />);

    const cells = screen.getAllByRole('textbox');
    cells[2].focus();
    await user.keyboard('{Backspace}');

    expect(cells[1]).toHaveValue('');
    expect(cells[1]).toHaveFocus();
  });

  it('fills cells from a pasted code', async () => {
    const onComplete = vi.fn();
    renderWithTheme(<Harness length={6} onComplete={onComplete} />);

    const cells = screen.getAllByRole('textbox');
    cells[0].focus();
    fireEvent.paste(cells[0], {
      clipboardData: { getData: () => '654321' },
    });

    expect(cells[5]).toHaveValue('1');
    expect(onComplete).toHaveBeenCalledWith('654321');
  });

  it('exposes an accessible group and error alert', () => {
    renderWithTheme(
      <OTPInput
        label="Verification code"
        value="0000"
        onChange={() => {}}
        error="Invalid code"
      />
    );

    expect(
      screen.getByRole('group', { name: /verification code/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid code');
  });
});
