import { describe, expect, it } from 'vitest';
import type { NodeSpec } from 'prosemirror-model';

import { createEditorKits } from './editorKits';

type ExtensionLike = {
  name?: unknown;
  requires?: unknown;
  getNodeSpec?: () => NodeSpec;
};

/** Mirrors fixShortcodeRoundTrip's walk: the node nests in `requires`. */
function findShortcode(extensions: unknown[]): ExtensionLike | undefined {
  for (const item of extensions) {
    if (!item || typeof item !== 'object') continue;
    const extension = item as ExtensionLike;
    if (
      extension.name === 'shortcode_inline' &&
      typeof extension.getNodeSpec === 'function'
    ) {
      return extension;
    }
    if (Array.isArray(extension.requires)) {
      const nested = findShortcode(extension.requires);
      if (nested) return nested;
    }
  }
  return undefined;
}

describe('fixShortcodeRoundTrip', () => {
  // The stock node drops the {{braces}} in toDOM, corrupting merge tags on
  // save (mieweb/ui#695). The kit must ship the fixed spec — this is what
  // reaches npm consumers, unlike a workspace-level package patch.
  it('round-trips {{merge_tokens}} through the DOM spec', async () => {
    const { kits } = await createEditorKits();
    const shortcode = findShortcode(kits[0].getExtensions());
    expect(shortcode).toBeDefined();

    const spec = shortcode!.getNodeSpec!();

    const toDOM = spec.toDOM as (node: {
      attrs: Record<string, unknown>;
    }) => unknown;
    expect(toDOM({ attrs: { content: 'first_name' } })).toEqual([
      'span',
      { class: 'kb-shortcode-inline' },
      '{{first_name}}',
    ]);
    expect(toDOM({ attrs: { content: '' } })).toEqual([
      'span',
      { class: 'kb-shortcode-inline' },
      '',
    ]);

    // Parsing the serialized span strips the braces back off, so the
    // `content` attr stays brace-less (the input rule and the markdown
    // serializer both rely on that).
    const [rule] = spec.parseDOM as Array<{
      tag: string;
      getAttrs: (dom: HTMLElement) => unknown;
    }>;
    expect(rule.tag).toBe('span.kb-shortcode-inline');
    const span = document.createElement('span');
    span.className = 'kb-shortcode-inline';
    span.textContent = '{{first_name}}';
    expect(rule.getAttrs(span)).toEqual({ content: 'first_name' });
  });
});
