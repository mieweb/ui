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

  it.each([
    ['double quotes', '"Rollout plan"'],
    ['single quotes', "'Rollout plan'"],
    ['parentheses', '(Rollout plan)'],
  ])(
    'links a Markdown link with a title in %s by its label, the title out of the address',
    (_, title) => {
      render(
        <p>
          {linkifyCaption(
            `Read [the rollout plan](https://example.org/rollout ${title}) today`
          )}
        </p>
      );
      const link = screen.getByRole('link', { name: 'the rollout plan' });
      expect(link).toHaveAttribute('href', 'https://example.org/rollout');
      expect(link.parentElement).toHaveTextContent(
        /^Read the rollout plan today$/
      );
    }
  );

  it('links an autolink without its angle brackets, and never takes a ">" into an address', () => {
    render(
      <p>
        {linkifyCaption(
          'Launch: <https://example.org/launch> or https://example.org/b>c'
        )}
      </p>
    );
    const launch = screen.getByRole('link', {
      name: 'https://example.org/launch',
    });
    expect(launch).toHaveAttribute('href', 'https://example.org/launch');
    expect(launch.parentElement).toHaveTextContent(
      /^Launch: https:\/\/example\.org\/launch or https:\/\/example\.org\/b>c$/
    );
    expect(
      screen.getByRole('link', { name: 'https://example.org/b' })
    ).toHaveAttribute('href', 'https://example.org/b');
  });

  it('keeps the backticks around an address set as code out of its link', () => {
    render(<p>{linkifyCaption('Open `https://example.org/launch` today')}</p>);
    const link = screen.getByRole('link', {
      name: 'https://example.org/launch',
    });
    expect(link).toHaveAttribute('href', 'https://example.org/launch');
    expect(link.parentElement).toHaveTextContent(
      /^Open `https:\/\/example\.org\/launch` today$/
    );
  });

  it('links http(s) in any case', () => {
    render(
      <p>
        {linkifyCaption(
          'See [Plan](HTTPS://example.org/plan) and Http://example.org/notes'
        )}
      </p>
    );
    expect(screen.getByRole('link', { name: 'Plan' })).toHaveAttribute(
      'href',
      'HTTPS://example.org/plan'
    );
    expect(
      screen.getByRole('link', { name: 'Http://example.org/notes' })
    ).toHaveAttribute('href', 'Http://example.org/notes');
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

  it('links only the inner label after an unmatched "[", as CommonMark does', () => {
    render(<p>{linkifyCaption('Notes [draft [plan](https://x.dev/plan)')}</p>);
    expect(screen.getByRole('link', { name: 'plan' })).toHaveAttribute(
      'href',
      'https://x.dev/plan'
    );
    expect(screen.getByRole('link').parentElement).toHaveTextContent(
      /^Notes \[draft plan$/
    );
  });

  it.each([
    ['unmatched "["', '['.repeat(100_000)],
    ['"[" before text', '[a'.repeat(50_000)],
  ])('reads a composer-length caption of %s in linear time', (_, caption) => {
    const start = performance.now();
    expect(linkifyCaption(caption)).toBe(caption);
    // Linear takes about 1 ms. Quadratic took 3–6 s.
    expect(performance.now() - start).toBeLessThan(500);
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
