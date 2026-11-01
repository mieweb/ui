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

  const WIKI = 'https://en.wikipedia.org/wiki/Function_(mathematics)';

  it('keeps balanced parentheses in a bare address, not the punctuation after', () => {
    render(<p>{linkifyCaption(`Background: ${WIKI}.`)}</p>);
    const link = screen.getByRole('link', { name: WIKI });
    expect(link).toHaveAttribute('href', WIKI);
    expect(link.parentElement).toHaveTextContent(`Background: ${WIKI}.`);
  });

  it('keeps balanced parentheses in a Markdown link, leaving no stray bracket', () => {
    render(<p>{linkifyCaption(`Read [functions](${WIKI}) first`)}</p>);
    expect(screen.getByRole('link', { name: 'functions' })).toHaveAttribute(
      'href',
      WIKI
    );
    expect(screen.getByText('functions').parentElement).toHaveTextContent(
      /^Read functions first$/
    );
  });

  it('leaves out the parenthesis that closes an aside around an address', () => {
    render(<p>{linkifyCaption('Shipped (see https://x.dev) today')}</p>);
    expect(screen.getByRole('link', { name: 'https://x.dev' })).toHaveAttribute(
      'href',
      'https://x.dev'
    );
    expect(screen.getByRole('link').parentElement).toHaveTextContent(
      /^Shipped \(see https:\/\/x\.dev\) today$/
    );
  });
});
