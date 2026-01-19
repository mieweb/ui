/**
 * @mieweb/ui Tailwind CSS Preset
 *
 * This preset provides the default theme configuration for @mieweb/ui components.
 * Consumers can extend or override these values in their own tailwind.config.js
 *
 * Usage:
 * ```js
 * // tailwind.config.js
 * module.exports = {
 *   presets: [require('@mieweb/ui/tailwind-preset')],
 *   theme: {
 *     extend: {
 *       colors: {
 *         primary: {
 *           500: '#your-brand-color',
 *         },
 *       },
 *     },
 *   },
 * };
 * ```
 */
/**
 * Safelist of classes used by @mieweb/ui components.
 * These must be safelisted because Tailwind may not detect them when
 * components are imported from node_modules (especially with Tailwind CSS 4).
 */
declare const miewebUISafelist: string[];
interface MiewebUIPreset {
    darkMode: ['class', '[data-theme="dark"]'];
    safelist: string[];
    theme: {
        extend: Record<string, unknown>;
    };
}
declare const miewebUIPreset: MiewebUIPreset;

export { type MiewebUIPreset, miewebUIPreset as default, miewebUIPreset, miewebUISafelist };
