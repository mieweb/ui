/**
 * Side-effect module that sets up jQuery and its plugins (jQuery UI, etc.)
 * the same way wcdatavis/index.js does. Must be imported before creating
 * any Grid instances.
 */

// @ts-expect-error — jquery does not ship default-export types for this usage
import jQuery from 'jquery';

// Expose jQuery globally so plugins can install themselves on it.
// NOTE: This runs before dynamic imports below, which is intentional.
if (typeof window !== 'undefined') {
  (window as any).jQuery = jQuery;
  (window as any).$ = jQuery;
}
(globalThis as any).jQuery = jQuery;
(globalThis as any).$ = jQuery;
