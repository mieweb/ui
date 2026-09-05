import * as React from 'react';
import {
  Title,
  Subtitle,
  Description,
  Primary,
  Controls,
  Stories,
} from '@storybook/addon-docs/blocks';
import { ComponentMetaBlock } from './blocks/ComponentMetaBlock';

/**
 * Default autodocs page = Storybook's stock layout plus the "In production"
 * strip (`parameters.meta`) between the description and the primary story.
 */
export function DocsPage() {
  return (
    <>
      <Title />
      <Subtitle />
      <Description />
      <ComponentMetaBlock />
      <Primary />
      <Controls />
      <Stories />
    </>
  );
}
