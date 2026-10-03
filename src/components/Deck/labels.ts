/** Every string the deck chrome renders, for translation. */
export interface DeckLabels {
  /** `aria-roledescription` of the deck region. */
  presentation?: string;
  /** `aria-roledescription` of each slide. */
  slide?: string;
  slideNavigation?: string;
  goToSlide?: (n: number, title: string) => string;
  outline?: string;
  openOutline?: string;
  closeOutline?: string;
  print?: string;
  enterFullscreen?: string;
  exitFullscreen?: string;
  previous?: string;
  next?: string;
  navigateHint?: string;
  fullscreenHint?: string;
  helpHint?: string;
  copy?: string;
  copied?: string;
  statusNow?: string;
  statusNext?: string;
  statusLater?: string;
  watchVideo?: string;
  lines?: string;
  bars?: string;
  more?: (n: number) => string;
  less?: string;
}

export const defaultDeckLabels: Required<DeckLabels> = {
  presentation: 'slide presentation',
  slide: 'slide',
  slideNavigation: 'Slide navigation',
  goToSlide: (n, title) => `Go to slide ${n}${title ? `: ${title}` : ''}`,
  outline: 'Slides',
  openOutline: 'Open slide outline',
  closeOutline: 'Close outline',
  print: 'Print or save as PDF',
  enterFullscreen: 'Enter fullscreen',
  exitFullscreen: 'Exit fullscreen',
  previous: 'Previous slide',
  next: 'Next slide',
  navigateHint: 'Navigate',
  fullscreenHint: 'Fullscreen',
  helpHint: 'Help',
  copy: 'Copy link',
  copied: 'Copied',
  statusNow: 'Now',
  statusNext: 'Next',
  statusLater: 'Later',
  watchVideo: 'Watch the video',
  lines: 'Lines',
  bars: 'Bars',
  more: (n) => `Show ${n} more`,
  less: 'Show less',
};
