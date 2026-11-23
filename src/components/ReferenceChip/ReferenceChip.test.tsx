import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReferenceChip } from './ReferenceChip';
import { referencesIn, type ReferenceTrigger } from './references';

const trigger = (kind: string, prefix: string): ReferenceTrigger => ({
  kind,
  char: kind === 'person' ? '@' : '#',
  label: kind,
  search: () => [],
  toHref: (id) => `${prefix}${id}`,
  fromHref: (href) =>
    href.startsWith(prefix) ? href.slice(prefix.length) : null,
});
const triggers = [
  trigger('person', '/people/'),
  trigger('ticket', '/tickets/'),
];

describe('referencesIn', () => {
  it('reads the links triggers claim, in order and each once', () => {
    const text =
      'Ask [@Ann Lee](/people/u-ann) about [TH-12: Fix login](/tickets/t-12), ' +
      'then [@Ann Lee](/people/u-ann) again. [Docs](https://example.com)';
    expect(referencesIn(text, triggers)).toEqual([
      { kind: 'person', id: 'u-ann', label: '@Ann Lee', href: '/people/u-ann' },
      {
        kind: 'ticket',
        id: 't-12',
        label: 'TH-12: Fix login',
        href: '/tickets/t-12',
      },
    ]);
  });

  it('skips links quoted in code and images', () => {
    const text =
      '`[@Ann](/people/u-ann)`\n```\n[x](/tickets/t-1)\n```\n![shot](/tickets/t-2)';
    expect(referencesIn(text, triggers)).toEqual([]);
  });

  it('skips links in indented code, multiline code spans and unclosed fences', () => {
    const text =
      'Intro\n\n    [a](/tickets/t-1)\n\n`span\n[b](/tickets/t-2)`\n\n' +
      '![[c](/tickets/t-3)](/img.png)\n\n```\n[d](/tickets/t-4)\n';
    expect(referencesIn(text, triggers)).toEqual([]);
  });

  it('reads links with a title or parentheses in the destination', () => {
    const text = '[@Ann](/people/u-ann "Person") and [TH](/tickets/issue(12))';
    expect(referencesIn(text, triggers)).toEqual([
      { kind: 'person', id: 'u-ann', label: '@Ann', href: '/people/u-ann' },
      {
        kind: 'ticket',
        id: 'issue(12)',
        label: 'TH',
        href: '/tickets/issue(12)',
      },
    ]);
  });

  it('reads links inside lists and tables', () => {
    const text =
      '- [@Ann](/people/u-ann)\n\n| A |\n| - |\n| [TH](/tickets/t-9) |';
    expect(referencesIn(text, triggers).map((r) => r.id)).toEqual([
      'u-ann',
      't-9',
    ]);
  });

  it('reads reference-style links resolved from their definitions', () => {
    const text =
      'Ask [@Ann][ann] about [TH-12]\n\n[ann]: /people/u-ann\n[TH-12]: /tickets/t-12';
    expect(referencesIn(text, triggers)).toEqual([
      { kind: 'person', id: 'u-ann', label: '@Ann', href: '/people/u-ann' },
      { kind: 'ticket', id: 't-12', label: 'TH-12', href: '/tickets/t-12' },
    ]);
  });

  it('unescapes Markdown in the label', () => {
    expect(
      referencesIn('[TH-1: Fix \\[beta\\] form](/tickets/t-1)', triggers)[0]
        .label
    ).toBe('TH-1: Fix [beta] form');
  });

  it('unescapes punctuation and drops emphasis marks in the label', () => {
    expect(
      referencesIn('[TH-1: Fix \\*beta\\* **now**](/tickets/t-1)', triggers)[0]
        .label
    ).toBe('TH-1: Fix *beta* now');
  });

  it('keeps code-span contents literal in the label', () => {
    expect(
      referencesIn('[TH-2: Rename `a\\*b`](/tickets/t-2)', triggers)[0].label
    ).toBe('TH-2: Rename a\\*b');
  });
});

describe('ReferenceChip', () => {
  it('is a link named by its label when it has an href', () => {
    render(
      <ReferenceChip label="@Ann Lee" href="/people/u-ann" kind="person" />
    );
    const link = screen.getByRole('link', { name: '@Ann Lee' });
    expect(link).toHaveAttribute('href', '/people/u-ann');
    expect(link).toHaveAttribute('data-reference-kind', 'person');
  });

  it('is plain text without an href', () => {
    render(<ReferenceChip label="TH-12: Fix login" />);
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('TH-12: Fix login')).toBeInTheDocument();
  });
});
