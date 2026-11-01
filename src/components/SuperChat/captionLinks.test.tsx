import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { linkifyCaption } from './captionLinks';

describe('linkifyCaption', () => {
  it('leaves text with no links as the same string', () => {
    expect(linkifyCaption('Standup notes from the board.')).toBe(
      'Standup notes from the board.'
    );
  });

  it('links a bare address, keeping trailing punctuation out', () => {
    render(<p>{linkifyCaption('Review it: https://example.dev/pr/749.')}</p>);
    const link = screen.getByRole('link', {
      name: 'https://example.dev/pr/749',
    });
    expect(link).toHaveAttribute('href', 'https://example.dev/pr/749');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link.parentElement).toHaveTextContent(
      'Review it: https://example.dev/pr/749.'
    );
  });

  it('links a Markdown link by its label, and nothing that is not http(s)', () => {
    render(
      <p>
        {linkifyCaption(
          'See [the spec](https://example.dev/spec) and javascript:alert(1)'
        )}
      </p>
    );
    expect(screen.getByRole('link', { name: 'the spec' })).toHaveAttribute(
      'href',
      'https://example.dev/spec'
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });
});
