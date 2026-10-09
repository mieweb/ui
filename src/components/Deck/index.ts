export { Deck, type DeckProps } from './Deck';
export { defaultDeckLabels, type DeckLabels } from './labels';
export { slideRenderers } from './registry';
export { SlideFrame, slideAnchor, type SlideFrameProps } from './SlideFrame';
export { useDeck, useTone, type DeckContextValue } from './DeckContext';
export { Graphic } from './graphics';
export {
  Bullet,
  Card as SlideCard,
  CountUp,
  DeckIcon,
  Eyebrow as SlideEyebrow,
  HighlightFigure,
  IconChip,
  SlideHeader,
  SlideTitle,
  SourceLink,
  Subtitle as SlideSubtitle,
  reveal,
} from './primitives';
export {
  TONES as slideTones,
  accent as slideAccent,
  toneOf,
  type AccentSpec,
  type ToneSpec,
} from './tones';
export type * from './types';
