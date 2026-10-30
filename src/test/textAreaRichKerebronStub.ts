/**
 * Test stand-in for the Kerebron-backed TextAreaRich surface.
 *
 * ProseMirror mounts asynchronously and resists jsdom input simulation, so —
 * following the repo convention of mocking `@kerebron/*`-backed modules in
 * unit tests (see EncounterMdyEditor.test.tsx, RichEditor.test.tsx) — field
 * tests swap it for the legacy engine via:
 *
 *   vi.mock('../components/TextAreaRich/TextAreaRichKerebron', () =>
 *     import('../test/textAreaRichKerebronStub')
 *   );
 *
 * Both engines share the `TextAreaRichProps` contract, so field logic
 * (sanitization, findings provenance, macro wiring) is exercised for real;
 * the Kerebron engine itself is verified in the browser (Storybook).
 */
export { TextAreaRichLegacy as TextAreaRichKerebron } from '../components/TextAreaRich/TextAreaRichLegacy';
