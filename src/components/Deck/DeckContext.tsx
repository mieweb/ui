import * as React from 'react';
import type { TemplateIconRegistry } from '../../templates/icons';
import type { TemplateComponents } from '../../templates/types';
import type { DeckLabels } from './labels';
import type { Slide, SlideRendererProps } from './types';
import { TONES, type ToneSpec } from './tones';

export interface DeckContextValue {
  slides: Slide[];
  activeSlide: number;
  goTo: (index: number) => void;
  labels: Required<DeckLabels>;
  components?: TemplateComponents;
  icons?: TemplateIconRegistry;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each site graphic owns its props
  graphics?: Record<string, React.ComponentType<any>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- each site slide owns its props
  renderers?: Record<string, React.ComponentType<SlideRendererProps<any>>>;
  locale?: string;
}

const DeckContext = React.createContext<DeckContextValue | null>(null);

export const DeckProvider = DeckContext.Provider;

export function useDeck(): DeckContextValue {
  const ctx = React.useContext(DeckContext);
  if (!ctx) throw new Error('Slide renderers must be rendered inside <Deck>.');
  return ctx;
}

/** The tone of the slide being rendered, so primitives pick matching text colours. */
export const ToneContext = React.createContext<ToneSpec>(TONES.brand);

export const useTone = () => React.useContext(ToneContext);
