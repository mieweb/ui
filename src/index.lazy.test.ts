import { describe, it, expect, vi } from 'vitest';

// The main entry must not load the Kerebron editor on import: it would land in
// the startup code of every app that imports anything from `@mieweb/ui`.
// Components in this entry reach the surface through
// TextAreaRich/TextAreaRichKerebronLazy, and the editors themselves live in
// the `@mieweb/ui/kerebron` entry.
const loads = vi.hoisted(() => ({ surface: 0, editor: 0 }));
vi.mock('./components/TextAreaRich/TextAreaRichKerebron', async (original) => {
  loads.surface += 1;
  return original();
});
vi.mock('@kerebron/editor', async (original) => {
  loads.editor += 1;
  return original();
});

describe('the main entry', () => {
  it('loads no Kerebron code on import', async () => {
    await import('./index');
    expect(loads).toEqual({ surface: 0, editor: 0 });
  }, 60_000); // Transforming the whole entry takes seconds, more under coverage.
});
