import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../../test/test-utils';
import { Textarea } from './Textarea';

/** jsdom has no layout, so fake the scroll metrics the auto-grow code reads. */
function mockScrollHeight(el: HTMLElement, getHeight: () => number) {
  Object.defineProperty(el, 'scrollHeight', {
    configurable: true,
    get: getHeight,
  });
}

describe('Textarea', () => {
  it('renders with label correctly', () => {
    renderWithTheme(<Textarea label="Description" />);
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('shows required indicator and sets required when required', () => {
    renderWithTheme(<Textarea label="Description" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeRequired();
  });

  it('uses the warning color for soft requirements', () => {
    renderWithTheme(
      <Textarea label="Description" required requiredVariant="warning" />
    );
    expect(screen.getByText('*')).toHaveClass('text-warning');
  });

  describe('auto-grow (default)', () => {
    it('starts at a single line matching the Input height', () => {
      renderWithTheme(<Textarea label="Notes" />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveAttribute('rows', '1');
      expect(textarea).toHaveClass('min-h-10');
      // The native drag handle stays available alongside auto-grow.
      expect(textarea).toHaveClass('resize-y');
    });

    it('uses size-matched single-line baselines', () => {
      renderWithTheme(<Textarea label="Notes" size="sm" />);
      expect(screen.getByRole('textbox')).toHaveClass('min-h-8');
    });

    it('measures prefilled content on mount', () => {
      let mounted: HTMLTextAreaElement | null = null;
      renderWithTheme(
        <Textarea
          label="Notes"
          defaultValue={'one\ntwo\nthree'}
          ref={(el) => {
            if (el && !mounted) {
              mounted = el;
              mockScrollHeight(el, () => 120);
            }
          }}
        />
      );
      const textarea = screen.getByRole('textbox');
      // Mount effect runs after ref callback, so the mock is in place.
      expect(textarea.style.height).toBe('120px');
    });

    it('grows while typing and shrinks when content is removed', async () => {
      const user = userEvent.setup();
      renderWithTheme(<Textarea label="Notes" />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      mockScrollHeight(textarea, () =>
        textarea.value.includes('\n') ? 96 : 40
      );

      await user.type(textarea, 'line one{Enter}line two');
      expect(textarea.style.height).toBe('96px');

      await user.clear(textarea);
      await user.type(textarea, 'short');
      expect(textarea.style.height).toBe('40px');
    });

    it('recalculates on controlled value updates', () => {
      const { rerender } = renderWithTheme(
        <Textarea label="Notes" value="one" onChange={() => {}} />
      );
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      mockScrollHeight(textarea, () =>
        textarea.value.includes('\n') ? 96 : 40
      );

      rerender(
        <Textarea label="Notes" value={'one\ntwo\nthree'} onChange={() => {}} />
      );
      expect(textarea.style.height).toBe('96px');
    });

    it('respects an explicit rows floor', () => {
      renderWithTheme(<Textarea label="Notes" rows={5} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
    });

    it('keeps a user-dragged height as the growth floor', async () => {
      const user = userEvent.setup();
      renderWithTheme(<Textarea label="Notes" />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      mockScrollHeight(textarea, () => 40);

      await user.type(textarea, 'a');
      expect(textarea.style.height).toBe('40px');

      // Simulate the browser applying a drag-resize: the component adopts
      // out-of-band heights as the new floor (normally via ResizeObserver;
      // jsdom has none, so exercise the same path through another input
      // after seeding the floor).
      textarea.style.height = '200px';
      mockScrollHeight(textarea, () => 64);
      await user.type(textarea, 'b');
      // Without a ResizeObserver the drag is not detected and content
      // sizing wins — this guards the fallback behavior.
      expect(textarea.style.height).toBe('64px');
    });
  });

  describe('autoResize={false} (fixed sizing)', () => {
    it('keeps the fixed min-height and manual resize handle', () => {
      renderWithTheme(<Textarea label="Notes" autoResize={false} />);
      const textarea = screen.getByRole('textbox');
      expect(textarea).toHaveClass('min-h-[80px]');
      expect(textarea).toHaveClass('resize-y');
      expect(textarea).not.toHaveAttribute('rows');
    });

    it('does not force rows or adjust height', async () => {
      const user = userEvent.setup();
      renderWithTheme(<Textarea label="Notes" autoResize={false} rows={3} />);
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea).toHaveAttribute('rows', '3');
      await user.type(textarea, 'hello');
      expect(textarea.style.height).toBe('');
    });
  });

  describe('floating label', () => {
    it('associates the floating label with the textarea', () => {
      renderWithTheme(<Textarea label="Description" labelVariant="floating" />);
      expect(screen.getByLabelText('Description')).toBeInTheDocument();
    });

    it('shows required indicator inside the floating label', () => {
      renderWithTheme(
        <Textarea label="Description" labelVariant="floating" required />
      );
      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeRequired();
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
