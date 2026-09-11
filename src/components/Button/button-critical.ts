/**
 * Self-healing structural CSS for Button.
 *
 * Button layout relies on Tailwind utilities (`inline-flex`,
 * `whitespace-nowrap`, ...). Consumer apps with a stale safelist copy or a
 * missing `@source` line never generate those classes, so the button falls
 * back to `inline-block` and the icon stacks above the label.
 *
 * Injecting these rules from the component guarantees every consumer gets
 * correct button structure just by upgrading the library — no app-side
 * changes required. Every selector is wrapped in `:where()` (zero
 * specificity), so when the Tailwind utilities ARE generated, or a consumer
 * overrides layout via `className`, those always win.
 */

const STYLE_ID = 'mieweb-ui-button-critical';

const CRITICAL_CSS = [
  // Structure: keep icon + label on one line (matches the base utilities
  // inline-flex items-center justify-center gap-2 whitespace-nowrap).
  `:where(button[data-slot='button']){display:inline-flex;flex-wrap:nowrap;align-items:center;justify-content:center;gap:0.5rem;white-space:nowrap;}`,
  // Icons and the loading spinner never shrink (matches shrink-0).
  `:where(button[data-slot='button']) > :where([data-slot='button-icon'],svg){flex-shrink:0;}`,
  // Label truncates instead of wrapping/overflowing (matches truncate).
  `:where(button[data-slot='button']) > :where([data-slot='button-label']){min-width:0;overflow:hidden;text-overflow:ellipsis;}`,
].join('');

/** Injects the critical Button styles once per document. SSR-safe. */
export function injectButtonCriticalStyles(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CRITICAL_CSS;
  document.head.appendChild(style);
}
