import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';
import { Checkbox, CheckboxGroup } from './Checkbox';

function renderGroup(
  props: Partial<React.ComponentProps<typeof CheckboxGroup>> = {}
) {
  return renderWithTheme(
    <CheckboxGroup label="Preferences" {...props}>
      <Checkbox label="Email" />
      <Checkbox label="SMS" />
    </CheckboxGroup>
  );
}

describe('CheckboxGroup', () => {
  it('renders a group named by its legend', () => {
    renderGroup();
    expect(
      screen.getByRole('group', { name: 'Preferences' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  describe('floating label', () => {
    it('keeps the accessible group name via a visually hidden legend', () => {
      renderGroup({ labelVariant: 'floating' });
      expect(
        screen.getByRole('group', { name: 'Preferences' })
      ).toBeInTheDocument();
      const legend = screen.getByText('Preferences', { selector: 'legend' });
      expect(legend).toHaveClass('sr-only');
    });

    it('renders the bordered field with the fixed floating label', () => {
      const { container } = renderGroup({ labelVariant: 'floating' });
      const field = container.querySelector(
        '[data-slot="checkbox-group-field"]'
      );
      expect(field).toHaveClass('min-h-14');
      const floatingLabel = container.querySelector(
        '[data-slot="checkbox-group-floating-label"]'
      );
      expect(floatingLabel).toHaveTextContent('Preferences');
      expect(floatingLabel).toHaveAttribute('aria-hidden', 'true');
    });

    it('tints the field border and label on error', () => {
      const { container } = renderGroup({
        labelVariant: 'floating',
        error: 'Select at least one',
      });
      expect(
        container.querySelector('[data-slot="checkbox-group-field"]')
      ).toHaveClass('border-destructive');
      expect(
        container.querySelector('[data-slot="checkbox-group-floating-label"]')
      ).toHaveClass('text-destructive');
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Select at least one'
      );
    });

    it('ignores labelVariant when there is no label', () => {
      const { container } = renderWithTheme(
        <CheckboxGroup labelVariant="floating">
          <Checkbox label="Lone option" />
        </CheckboxGroup>
      );
      expect(
        container.querySelector('[data-slot="checkbox-group-field"]')
      ).not.toBeInTheDocument();
    });

    it('keeps the stacked legend visible by default', () => {
      renderGroup();
      const legend = screen.getByText('Preferences', { selector: 'legend' });
      expect(legend).not.toHaveClass('sr-only');
    });
  });
});
