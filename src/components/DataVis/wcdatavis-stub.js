/**
 * Stub module for when wcdatavis is not installed (CI, fresh checkouts).
 *
 * The Storybook Vite config aliases 'wcdatavis' to this file when the real
 * library isn't detected at node_modules/wcdatavis/src. DataVis.tsx will
 * receive these empty classes from its dynamic import(), fail the class
 * resolution check, and display a graceful error state.
 */

class Source {}
class ComputedView {}
class Grid {}
class Graph {}
class Prefs {}

export { Source, ComputedView, ComputedView as View, Grid, Graph, Prefs };
