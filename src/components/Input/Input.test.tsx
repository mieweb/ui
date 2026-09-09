import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { Input } from './Input';

describe('Input', () => {
  it('renders with label correctly', () => {
    renderWithTheme(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('shows required indicator when required', () => {
    renderWithTheme(<Input label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    renderWithTheme(<Input label="Email" onChange={handleChange} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test@example.com');

    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test@example.com');
  });

  it('displays error message', () => {
    renderWithTheme(<Input label="Email" error="Invalid email address" />);
    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });

  it('shows helper text', () => {
    renderWithTheme(
      <Input label="Email" helperText="We'll never share your email" />
    );
    expect(
      screen.getByText("We'll never share your email")
    ).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = renderWithTheme(<Input label="Test" size="sm" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-8');

    rerender(<Input label="Test" size="md" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-10');

    rerender(<Input label="Test" size="lg" />);
    expect(screen.getByRole('textbox')).toHaveClass('h-12');
  });

  it('supports different input types', () => {
    const { rerender } = renderWithTheme(
      <Input label="Password" type="password" />
    );
    expect(screen.getByLabelText('Password')).toHaveAttribute(
      'type',
      'password'
    );

    rerender(<Input label="Email" type="email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
  });

  it('handles disabled state', () => {
    renderWithTheme(<Input label="Email" disabled />);
    const input = screen.getByRole('textbox');

    expect(input).toBeDisabled();
    expect(input.closest('div')).toHaveClass('opacity-50');
  });

  describe('floating label', () => {
    it('associates the floating label with the input', () => {
      renderWithTheme(<Input label="Account number" labelVariant="floating" />);
      expect(screen.getByLabelText('Account number')).toBeInTheDocument();
    });

    it('applies peer and floating height classes', () => {
      renderWithTheme(<Input label="Account number" labelVariant="floating" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('peer');
      expect(input).toHaveClass('h-14');
    });

    it('uses a space placeholder and ignores a user placeholder', () => {
      renderWithTheme(
        <Input
          label="Account number"
          labelVariant="floating"
          placeholder="12345678"
        />
      );
      expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', ' ');
    });

    it('keeps the stacked placeholder when not floating', () => {
      renderWithTheme(<Input label="Email" placeholder="you@example.com" />);
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'placeholder',
        'you@example.com'
      );
    });

    it('shows required indicator inside the floating label', () => {
      renderWithTheme(
        <Input label="Sort code" labelVariant="floating" required />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    it('falls back to stacked rendering when hideLabel is set', () => {
      renderWithTheme(
        <Input label="Search" labelVariant="floating" hideLabel />
      );
      const label = screen.getByText('Search');
      expect(label).toHaveClass('sr-only');
      expect(screen.getByRole('textbox')).not.toHaveClass('peer');
    });

    it('still renders error message below the input', () => {
      renderWithTheme(
        <Input label="Account number" labelVariant="floating" error="Bad" />
      );
      expect(screen.getByText('Bad')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      expect(screen.getByText('Account number')).toHaveClass(
        'text-destructive'
      );
    });
  });

  describe('accessibility', () => {
    it('associates label with input via id', () => {
      renderWithTheme(<Input label="Email" />);
      const input = screen.getByRole('textbox');
      const label = screen.getByText('Email');

      expect(input).toHaveAttribute('id');
      expect(label).toHaveAttribute('for', input.getAttribute('id'));
    });

    it('adds aria-describedby for helper text', () => {
      renderWithTheme(<Input label="Email" helperText="Helper text" />);
      const input = screen.getByRole('textbox');

      expect(input).toHaveAttribute('aria-describedby');
    });

    it('adds aria-invalid when error exists', () => {
      renderWithTheme(<Input label="Email" error="Error message" />);
      const input = screen.getByRole('textbox');

      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
