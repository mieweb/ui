declare module 'datavis/wcdatavis-lib/src/source.js' {
  export interface SourceSpec {
    type: string;
    url?: string;
    [key: string]: unknown;
  }

  export class Source {
    constructor(spec: SourceSpec, ...extraArgs: unknown[]);
  }
}

declare module 'datavis/wcdatavis-lib/src/computed_view.js' {
  import type { Source } from 'datavis/wcdatavis-lib/src/source.js';

  export interface ComputedViewOptions {
    [key: string]: unknown;
  }

  export class ComputedView {
    constructor(source: Source, opts?: ComputedViewOptions);
  }
}
