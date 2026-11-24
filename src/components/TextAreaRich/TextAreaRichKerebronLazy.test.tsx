import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import * as React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithTheme } from '../../test/test-utils';

// The surface's chunk fails to load, as after a dropped connection or a
// deploy that replaced the chunk names.
vi.mock('./TextAreaRichKerebron', () => {
  throw new Error('Failed to fetch dynamically imported module');
});

const { Textarea } = await import('../Textarea');
const { EmailEditor } = await import('../EmailEditor/EmailEditor');
const { createEmailBlock } = await import('../EmailEditor/types');

// React reports the error the boundary caught; that is expected here.
let consoleError: ReturnType<typeof vi.spyOn>;
beforeAll(() => {
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => consoleError.mockRestore());

describe('a Kerebron surface that fails to load', () => {
  it('leaves a Textarea usable as plain text, and the app mounted', async () => {
    const onChange = vi.fn();
    const ref = React.createRef<HTMLTextAreaElement>();
    renderWithTheme(
      <form aria-label="Visit">
        <Textarea
          ref={ref}
          label="Notes"
          name="notes"
          defaultValue="first line"
          onChange={onChange}
        />
        <button type="submit">Save</button>
      </form>
    );

    const field = await screen.findByRole('textbox', { name: 'Notes' });
    expect(field.tagName).toBe('TEXTAREA');
    expect(field).toHaveValue('first line');
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();

    fireEvent.change(field, { target: { value: 'first line\nsecond' } });
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        target: expect.objectContaining({ value: 'first line\nsecond' }),
      })
    );
    // The mirror still carries the value for form posts and the ref.
    expect(ref.current?.value).toBe('first line\nsecond');
    expect(ref.current?.name).toBe('notes');

    ref.current?.focus();
    expect(field).toHaveFocus();
  });

  it('tells the user when an email text block cannot be edited', async () => {
    renderWithTheme(
      <EmailEditor
        value={{ version: '1.0', blocks: [createEmailBlock('text')] }}
        onChange={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Select Text' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The text editor could not load. Reload the page to edit this block.'
    );
  });
});
