declare module 'wcdatavis/src/source.js' {
  export interface SourceSpec {
    type: string;
    url?: string;
    [key: string]: unknown;
  }

  export class Source {
    constructor(spec: SourceSpec, ...extraArgs: unknown[]);
  }
}

declare module 'wcdatavis/src/computed_view.js' {
  import type { Source } from 'wcdatavis/src/source.js';

  export interface ComputedViewOptions {
    [key: string]: unknown;
  }

  export class ComputedView {
    constructor(source: Source, opts?: ComputedViewOptions);
  }
}

declare module 'wcdatavis/src/grid.js' {
  import type { ComputedView } from 'wcdatavis/src/computed_view.js';

  export interface GridTableDefinition {
    columns?: Array<string | Record<string, unknown>>;
    features?: Record<string, unknown>;
    [key: string]: unknown;
  }

  export interface GridDefinition {
    id: string;
    computedView: ComputedView;
    table?: GridTableDefinition;
    [key: string]: unknown;
  }

  export interface GridOptions {
    title?: string;
    showControls?: boolean;
    [key: string]: unknown;
  }

  export class Grid {
    constructor(definition: GridDefinition, opts?: GridOptions);
  }
}

declare module 'wcdatavis/index.js' {
  export { Source } from 'wcdatavis/src/source.js';
  export { ComputedView } from 'wcdatavis/src/computed_view.js';
  export { Grid } from 'wcdatavis/src/grid.js';
}