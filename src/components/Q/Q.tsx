import type * as React from 'react';
import {
  AgentConfigGenerator,
  type AgentConfigGeneratorProps,
  type QConfig,
  type QSchema,
} from '@mieweb/q';
import { cn } from '../../utils/cn';

export type { QConfig, QSchema };

export interface QProps extends AgentConfigGeneratorProps {
  /** Additional class name for the Q container. */
  className?: string;
  /** Inline styles for the Q container. */
  style?: React.CSSProperties;
}

/**
 * Q is the agent config generator form surface.
 *
 * It wraps the published @mieweb/q form generator so it can be consumed through
 * @mieweb/ui/q while keeping Q's heavier dependencies out of the main UI entry.
 */
export function Q({ className, style, ...props }: QProps) {
  return (
    <div
      data-slot="q"
      className={cn('h-full min-h-0 w-full', className)}
      style={style}
    >
      <AgentConfigGenerator {...props} />
    </div>
  );
}
