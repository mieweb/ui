import { describe, it, expect } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { RadioGroup, Radio } from './Radio';

function renderGroup(
  props: Partial<React.ComponentProps<typeof RadioGroup>> = {}
) {
  return renderWithTheme(
    <RadioGroup name="contact" label="Contact method" {...props}>
      <Radio value="email" label="Email" />
      <Radio value="phone" label="Phone" />
    </RadioGroup>
  );
}

describe('RadioGroup', () => {
  it('renders a radiogroup named by its legend', () => {
    renderGroup();
    expect(
      screen.getByRole('radiogroup', { name: 'Contact method' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('selects a radio on click', () => {
    renderGroup();
    const email = screen.getByLabelText('Email');
    fireEvent.click(email);
    expect(email).toBeChecked();
  });

  describe('floating label', () => {
    it('keeps the accessible group name via a visually hidden legend', () => {
      renderGroup({ labelVariant: 'floating' });
      expect(
        screen.getByRole('radiogroup', { name: 'Contact method' })
      ).toBeInTheDocument();
      const legend = screen.getByText('Contact method', {
        selector: 'legend',
      });
      expect(legend).toHaveClass('sr-only');
    });

    it('renders the bordered field with the fixed floating label', () => {
      const { container } = renderGroup({ labelVariant: 'floating' });
      const field = container.querySelector('[data-slot="radio-group-field"]');
      expect(field).toHaveClass('min-h-14');
      const floatingLabel = container.querySelector(
        '[data-slot="radio-group-floating-label"]'
      );
      expect(floatingLabel).toHaveTextContent('Contact method');
      expect(floatingLabel).toHaveAttribute('aria-hidden', 'true');
    });

    it('matches size metrics to the floating input heights', () => {
      const { container } = renderGroup({
        labelVariant: 'floating',
        size: 'lg',
      });
      expect(
        container.querySelector('[data-slot="radio-group-field"]')
      ).toHaveClass('min-h-16');
    });

    it('tints the field border and label on error', () => {
      const { container } = renderGroup({
        labelVariant: 'floating',
        error: 'Pick one',
      });
      expect(
        container.querySelector('[data-slot="radio-group-field"]')
      ).toHaveClass('border-destructive');
      expect(
        container.querySelector('[data-slot="radio-group-floating-label"]')
      ).toHaveClass('text-destructive');
      expect(screen.getByRole('alert')).toHaveTextContent('Pick one');
    });

    it('ignores labelVariant when there is no label', () => {
      const { container } = renderWithTheme(
        <RadioGroup name="bare" labelVariant="floating">
          <Radio value="a" label="A" />
        </RadioGroup>
      );
      expect(
        container.querySelector('[data-slot="radio-group-field"]')
      ).not.toBeInTheDocument();
    });

    it('keeps the stacked legend visible by default', () => {
      renderGroup();
      const legend = screen.getByText('Contact method', {
        selector: 'legend',
      });
      expect(legend).not.toHaveClass('sr-only');
    });
  });
});
