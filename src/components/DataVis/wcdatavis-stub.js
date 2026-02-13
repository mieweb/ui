/**
 * Stub module for when wcdatavis is not installed (CI, fresh checkouts).
 *
 * The Storybook Vite config aliases 'wcdatavis' to this file when the real
 * library isn't detected at node_modules/wcdatavis/src. Each class throws
 * on construction so DataVis.tsx catches the error and displays a graceful
 * "not installed" message instead of rendering a blank grid.
 */

const STUB_MSG =
  'wcdatavis is not installed. Install @mieweb/wcdatavis to use the DataVis component.';

class Source {
  constructor() {
    throw new Error(STUB_MSG);
  }
}
class ComputedView {
  constructor() {
    throw new Error(STUB_MSG);
  }
}
class Grid {
  constructor() {
    throw new Error(STUB_MSG);
  }
}
class Graph {
  constructor() {
    throw new Error(STUB_MSG);
  }
}
class Prefs {
  constructor() {
    throw new Error(STUB_MSG);
  }
}

export { Source, ComputedView, ComputedView as View, Grid, Graph, Prefs };
