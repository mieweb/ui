import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders with label correctly', () => {
    renderWithTheme(<Textarea label="Description" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  describe('floating label', () => {
    it('associates the floating label with the textarea', () => {
      renderWithTheme(<Textarea label="Description" labelVariant="floating" />);
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('applies peer and floating padding classes', () => {
      renderWithTheme(<Textarea label="Description" labelVariant="floating" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('peer');
      expect(textarea).toHaveClass('pt-6');
    });

    it('uses a space placeholder and ignores a user placeholder', () => {
      renderWithTheme(
        <Textarea
          label="Description"
          labelVariant="floating"
          placeholder="Enter a description..."
        />
      );
      expect(screen.getByRole('textbox')).toHaveAttribute('placeholder', ' ');
    });

    it('keeps the stacked placeholder when not floating', () => {
      renderWithTheme(
        <Textarea label="Description" placeholder="Enter a description..." />
      );
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'placeholder',
        'Enter a description...'
      );
    });

    it('falls back to stacked rendering when hideLabel is set', () => {
      renderWithTheme(
        <Textarea label="Notes" labelVariant="floating" hideLabel />
      );
      const label = screen.getByText('Notes');
      expect(label).toHaveClass('sr-only');
      expect(screen.getByRole('textbox')).not.toHaveClass('peer');
    });

    it('still renders error message below the textarea', () => {
      renderWithTheme(
        <Textarea label="Description" labelVariant="floating" error="Bad" />
      );
      expect(screen.getByText('Bad')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toHaveAttribute(
        'aria-invalid',
        'true'
      );
      expect(screen.getByText('Description')).toHaveClass('text-destructive');
    });
  });
});
