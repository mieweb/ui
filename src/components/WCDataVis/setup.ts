import jQuery from 'jquery';

type JQueryGlobals = typeof globalThis & {
  jQuery?: typeof jQuery;
  $?: typeof jQuery;
};

const globalJQuery = globalThis as JQueryGlobals;

if (typeof window !== 'undefined') {
  window.jQuery = jQuery;
  window.$ = jQuery;
}
globalJQuery.jQuery = jQuery;
globalJQuery.$ = jQuery;
