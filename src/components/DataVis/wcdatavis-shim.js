/**
 * Shim for wcdatavis that:
 * 1. Works around the broken `Perspective` export in upstream index.js
 * 2. Exposes jQuery as a global (needed by jQuery UI's UMD wrapper)
 * 3. Loads jQuery UI + other jQuery plugins as side-effects so that
 *    $.fn.dialog, $.fn.sortable, etc. are available when Grid initializes
 *
 * The wcdatavis ESM source files only `import jQuery from 'jquery'` and assume
 * jQuery UI is already loaded globally (via <script> tag). In a Vite/bundler
 * context we need to explicitly import jQuery, set it as a global, then
 * import the side-effect plugins.
 */

// 1. Import jQuery and expose it as a global (required by jQuery UI UMD)
//    This MUST be a separate module so it executes before jquery-ui evaluates.
//    ES module imports execute their module bodies in depth-first declaration order.
import './jquery-global.js';

// 2. Side-effect imports: extend $.fn with jQuery UI widgets + plugins
import 'jquery-ui/dist/jquery-ui.js';
import 'jquery-contextmenu';
import 'sumoselect';
import 'flatpickr';

// 3. Now import wcdatavis source files (they use the extended jQuery)
import { Source } from 'wcdatavis/src/source.js';
import { ComputedView } from 'wcdatavis/src/computed_view.js';
import { Grid } from 'wcdatavis/src/grid.js';
import { Graph } from 'wcdatavis/src/graph.js';
import { Prefs } from 'wcdatavis/src/prefs.js';

export {
  Source,
  ComputedView as View,
  ComputedView,
  Prefs,
  Grid,
  Graph,
};
