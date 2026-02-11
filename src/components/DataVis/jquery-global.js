/**
 * Sets jQuery as a global. Must be imported before jQuery UI
 * and other jQuery plugins that check for window.jQuery.
 */
import jQuery from 'jquery';
window.jQuery = jQuery;
window.$ = jQuery;

/**
 * Suppress benign wcdatavis warnings that pollute the console.
 * This MUST run before wcdatavis modules load because log.warn is
 * bound via Function.prototype.bind(console.warn) at import time.
 */
const _origConsoleWarn = console.warn;
const _wcdvSuppressed = [
  'Unable to validate column configuration without data',
  'Providing a name for this',
];
console.warn = function (...args) {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (_wcdvSuppressed.some((p) => msg.includes(p))) {
    return;
  }
  return _origConsoleWarn.apply(this, args);
};
