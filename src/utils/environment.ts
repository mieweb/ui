/**
 * Environment detection utilities for handling special rendering contexts
 * like Storybook, testing environments, etc.
 */

/**
 * Check if we're in Storybook docs mode (multiple stories rendered inline).
 * In docs mode, we need to disable certain behaviors like scroll locking
 * and focus trapping that would interfere with the documentation page.
 *
 * @returns true if running in Storybook docs mode
 */
export function isStorybookDocsMode(): boolean {
  if (typeof window === 'undefined') return false;
  // Storybook docs mode renders in an iframe with viewMode=docs in the URL
  return window.location.search.includes('viewMode=docs');
}
