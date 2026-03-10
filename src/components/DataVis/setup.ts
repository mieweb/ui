/**
 * Side-effect module that sets up jQuery and its plugins (jQuery UI, etc.)
 * the same way wcdatavis/index.js does. Must be imported before creating
 * any Grid instances.
 */

// Minimal local typing shim so TypeScript recognizes the 'jquery' module.
declare module 'jquery' {
  const jQuery: any;
  export default jQuery;
}
import jQuery from 'jquery';

// Expose jQuery globally so plugins can install themselves on it.
// NOTE: This runs before dynamic imports below, which is intentional.
if (typeof window !== 'undefined') {
  (window as any).jQuery = jQuery;
  (window as any).$ = jQuery;
}
(globalThis as any).jQuery = jQuery;
(globalThis as any).$ = jQuery;
