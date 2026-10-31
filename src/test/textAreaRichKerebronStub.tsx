/**
 * Test stand-in for the Kerebron-backed TextAreaRich surface.
 *
 * ProseMirror mounts asynchronously and resists jsdom input simulation, so
 * every unit suite sees this legacy-backed stand-in instead — substituted
 * globally by a vitest alias (see vitest.config.ts); suites may also mock it
 * explicitly:
 *
 *   vi.mock('../components/TextAreaRich/TextAreaRichKerebron', () =>
 *     import('../test/textAreaRichKerebronStub')
 *   );
 *
 * Both engines share the `TextAreaRichProps` contract, so field logic
 * (sanitization, findings provenance, macro wiring) is exercised for real;
 * the Kerebron engine itself is verified in the browser (Storybook).
 *
 * The Kerebron surface is strictly controlled — an edit that `onChange`
 * does not echo back into `value` reverts (RichEditor's `strictValue`) —
 * while the legacy engine only applies `value` when the prop changes. The
 * effect below emulates the strict contract so rejected-edit behaviour in
 * tests matches the runtime engine.
 */
import * as React from 'react';
import { TextAreaRichLegacy } from '../components/TextAreaRich/TextAreaRichLegacy';
import type { TextAreaRichProps } from '../components/TextAreaRich/TextAreaRich';

export const TextAreaRichKerebron = React.forwardRef<
  HTMLDivElement,
  TextAreaRichProps
>(function TextAreaRichKerebron(props, ref) {
  // The legacy surface forwards its ref to the contenteditable region.
  const editableRef = React.useRef<HTMLDivElement | null>(null);
  // Runs after every render: converge the editable to `value`, as the
  // strict Kerebron surface does. Accepted edits echo back the exact HTML
  // the editor emitted, so the common case is a no-op.
  React.useEffect(() => {
    const editable = editableRef.current;
    const html = props.value ?? '';
    if (editable && editable.innerHTML !== html) editable.innerHTML = html;
  });
  return (
    <TextAreaRichLegacy
      {...props}
      ref={(node: HTMLDivElement | null) => {
        editableRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
    />
  );
});
