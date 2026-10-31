/**
 * Minimal Web Speech API surface used for dictation. Mirrors the private
 * typings in `RichTextEditor` (the legacy engine keeps its own copy until it
 * is retired) — lib.dom omits these because browser support is uneven.
 */
export interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
export interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}
export interface SpeechRecognitionErrorEventLike {
  error: string;
}
export interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}
export type SpeechRecognitionCtor = new () => SpeechRecognitionLike;
interface SpeechWindow {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}

/** The browser's SpeechRecognition constructor, when dictation is available. */
export function getSpeechRecognition(): SpeechRecognitionCtor | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as SpeechWindow;
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}
