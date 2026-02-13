/**
 * Type declarations for @mieweb/wcdatavis
 *
 * This is an ambient module declaration for the optional peer dependency.
 * It provides basic type information so TypeScript doesn't error on import.
 * The actual types should come from the @mieweb/wcdatavis package when installed.
 */
declare module '@mieweb/wcdatavis' {
  export class Source {
    constructor(config: Record<string, unknown>);
    destroy?(): void;
  }

  export class ComputedView {
    constructor(source: Source, options?: Record<string, unknown>);
    destroy?(): void;
  }

  export class Grid {
    constructor(
      config: {
        id: string;
        computedView: ComputedView;
        [key: string]: unknown;
      },
      options?: Record<string, unknown>
    );
    destroy?(): void;
  }

  /** Legacy global namespace export pattern */
  const MIE: {
    WC_DataVis: {
      Source: typeof Source;
      ComputedView: typeof ComputedView;
      Grid: typeof Grid;
    };
  };

  export default MIE;
}

declare module '@mieweb/wcdatavis/wcdatavis.css' {
  const content: string;
  export default content;
}

declare module '@mieweb/wcdatavis/index.js' {
  export { Source, ComputedView, Grid } from '@mieweb/wcdatavis';
}

/**
 * Type declarations for wcdatavis (unscoped, v2.x / local dev)
 */
declare module 'wcdatavis' {
  export class Source {
    constructor(config: Record<string, unknown>);
    destroy?(): void;
  }

  /** v2.x exports ComputedView as "View" */
  export class View {
    constructor(source: Source, options?: Record<string, unknown>);
    destroy?(): void;
  }

  export { View as ComputedView };

  export class Grid {
    constructor(
      config: { id: string; computedView: View; [key: string]: unknown },
      options?: Record<string, unknown>
    );
    destroy?(): void;
  }

  export class Graph {
    constructor(
      config: Record<string, unknown>,
      options?: Record<string, unknown>
    );
    destroy?(): void;
  }
}

declare module 'wcdatavis/dist/wcdatavis.css' {
  const content: string;
  export default content;
}

declare module 'wcdatavis/dist/wcdatavis.css?url' {
  const url: string;
  export default url;
}
