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
 * changes required.
 *
 * Override safety, by consumer setup:
 * - Tailwind 4: utilities live in `@layer utilities`. The structural rules
 *   below join that same layer, so conflicts resolve by specificity — and
 *   every selector is wrapped in `:where()` (zero specificity), so real
 *   utilities (`hidden`, `gap-0`, ...) always win. (A new layer name can't
 *   be used: layers declared later outrank `utilities`.)
 * - Tailwind 3 / no Tailwind: consumer CSS is unlayered, and unlayered
 *   always beats layered, so the structural rules stay a pure fallback.
 */

const STYLE_ID = 'mieweb-ui-button-critical';

const CRITICAL_CSS = [
  '@layer utilities{',
  // Structure: keep icon + label on one line (matches the base utilities
  // inline-flex items-center justify-center gap-2 min-w-0 whitespace-nowrap).
  `:where(button[data-slot='button']){display:inline-flex;flex-wrap:nowrap;align-items:center;justify-content:center;gap:0.5rem;min-width:0;white-space:nowrap;}`,
  // Icons and the loading spinner never shrink (matches shrink-0).
  `:where(button[data-slot='button']) > :where([data-slot='button-icon'],svg){flex-shrink:0;}`,
  // Label truncates instead of wrapping/overflowing (matches truncate).
  `:where(button[data-slot='button']) > :where([data-slot='button-label']){min-width:0;overflow:hidden;text-overflow:ellipsis;}`,
  '}',
  // Icons passed as children land inside the label span; Tailwind preflight
  // makes SVGs display:block, which forces line breaks inside the inline
  // label. Restore inline flow. This rule is deliberately UNLAYERED at
  // specificity (0,1,1): it must beat Tailwind 3's unlayered preflight
  // `svg{display:block}` (0,0,1) — layering it would neuter the fix for
  // exactly the broken-TW3 apps it exists for. It matches the specificity
  // of the [&_svg]:inline-block utility used on the label. Known tradeoff:
  // display utilities on an SVG inside the label slot won't win; consumers
  // should conditionally render icons instead.
  `button[data-slot='button'] [data-slot='button-label'] svg{display:inline-block;vertical-align:middle;}`,
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
