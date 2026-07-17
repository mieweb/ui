/**
 * FillerWordsModal — select filler words (and long silences) to mark deleted.
 *
 * Ported from pulseclip's TranscriptViewer for @mieweb/ui. Pure UI: match
 * counts/durations come in via props (see useTranscriptEdits.fillerAnalysis);
 * the selection is reported through onApply.
 */

import * as React from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../Modal';
import { Button } from '../Button';
import { Input } from '../Input';
import { Checkbox } from '../Checkbox';
import { Select } from '../Select';
import { DEFAULT_FILLER_WORDS } from '../../hooks/useTranscriptEdits';
import type { SilenceThresholdCount } from '../../hooks/useTranscriptEdits';

export interface FillerWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Apply removal: selected filler words + optional silence threshold (seconds) */
  onApply: (fillerWords: string[], removeSilenceAboveSec: number | null) => void;
  /** Occurrence count per normalized word */
  matchingCounts: Map<string, number>;
  /** Total duration (ms) per filler word */
  fillerDurations: Map<string, number>;
  /** Count and total duration of silences at each threshold */
  silenceCounts: SilenceThresholdCount[];
  /** Current total edited duration in ms */
  currentDurationMs: number;
}

const SILENCE_THRESHOLD_OPTIONS = [0.3, 0.4, 0.5, 0.75, 1.0, 1.5, 2.0];

/** Format duration in seconds or m:ss */
function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 90) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Modal for selecting filler words to remove from the edited transcript */
export const FillerWordsModal: React.FC<FillerWordsModalProps> = ({
  isOpen,
  onClose,
  onApply,
  matchingCounts,
  fillerDurations,
  silenceCounts,
  currentDurationMs,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedFillers, setSelectedFillers] = React.useState<Set<string>>(
    new Set(DEFAULT_FILLER_WORDS)
  );
  const [customWord, setCustomWord] = React.useState('');
  const [removeSilence, setRemoveSilence] = React.useState(false);
  const [silenceThreshold, setSilenceThreshold] = React.useState(0.4);

  // Filter filler words based on search, then sort by count (matches first)
  const filteredFillers = DEFAULT_FILLER_WORDS.filter((word) =>
    word.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    const countA = matchingCounts.get(a) || 0;
    const countB = matchingCounts.get(b) || 0;
    if (countB !== countA) return countB - countA;
    return a.localeCompare(b);
  });

  // Custom words that have been added, sorted by count
  const customFillers = Array.from(selectedFillers)
    .filter((word) => !DEFAULT_FILLER_WORDS.includes(word))
    .filter((word) => word.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      const countA = matchingCounts.get(a) || 0;
      const countB = matchingCounts.get(b) || 0;
      if (countB !== countA) return countB - countA;
      return a.localeCompare(b);
    });

  const toggleFiller = (word: string) => {
    setSelectedFillers((prev) => {
      const next = new Set(prev);
      if (next.has(word)) {
        next.delete(word);
      } else {
        next.add(word);
      }
      return next;
    });
  };

  const handleAddCustom = () => {
    const trimmed = customWord.trim().toLowerCase();
    if (trimmed && !selectedFillers.has(trimmed)) {
      setSelectedFillers((prev) => new Set([...prev, trimmed]));
      setCustomWord('');
    }
  };

  // Count and duration of silences that would be removed at the current threshold
  const silenceData = removeSilence
    ? silenceCounts.find((s) => s.threshold === silenceThreshold) || { count: 0, durationMs: 0 }
    : { count: 0, durationMs: 0 };
  const silenceRemovalCount = silenceData.count;
  const silenceDurationMs = silenceData.durationMs;

  const handleApply = () => {
    onApply(Array.from(selectedFillers), removeSilence ? silenceThreshold : null);
    onClose();
  };

  const selectAll = () => {
    setSelectedFillers(new Set([...DEFAULT_FILLER_WORDS, ...customFillers]));
  };

  const selectNone = () => {
    setSelectedFillers(new Set());
  };

  // Total matches (filler words + silences)
  const fillerMatches = Array.from(selectedFillers).reduce(
    (sum, word) => sum + (matchingCounts.get(word) || 0),
    0
  );
  const totalMatches = fillerMatches + silenceRemovalCount;

  // Time saved from filler words + silences
  const fillerTimeSavedMs = Array.from(selectedFillers).reduce(
    (sum, word) => sum + (fillerDurations.get(word) || 0),
    0
  );
  const totalTimeSavedMs = fillerTimeSavedMs + silenceDurationMs;
  const newDurationMs = currentDurationMs - totalTimeSavedMs;

  const renderFillerItem = (word: string, isCustom: boolean) => {
    const count = matchingCounts.get(word) || 0;
    return (
      <label
        key={word}
        className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm transition-colors hover:bg-muted"
      >
        <Checkbox
          size="sm"
          checked={selectedFillers.has(word)}
          onChange={() => toggleFiller(word)}
          aria-label={`Remove "${word}"`}
        />
        <span className="min-w-0 flex-1 truncate text-foreground">{word}</span>
        {count > 0 && <span className="text-xs text-muted-foreground">({count})</span>}
        {isCustom && (
          <button
            type="button"
            className="rounded px-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={(e) => {
              e.preventDefault();
              setSelectedFillers((prev) => {
                const next = new Set(prev);
                next.delete(word);
                return next;
              });
            }}
            aria-label={`Remove ${word}`}
          >
            ×
          </button>
        )}
      </label>
    );
  };

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="lg"
    >
      <ModalHeader>
        <ModalTitle>Remove Filler Words</ModalTitle>
        <ModalClose aria-label="Close modal" />
      </ModalHeader>

      <ModalBody className="flex flex-col gap-3">
        <Input
          size="sm"
          type="text"
          placeholder="Search filler words..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search filler words"
        />

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={selectNone}>
            Select None
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <Checkbox
            size="sm"
            label="Remove silences greater than"
            checked={removeSilence}
            onChange={(e) => setRemoveSilence(e.target.checked)}
          />
          <div className="w-24">
            <Select
              size="sm"
              options={SILENCE_THRESHOLD_OPTIONS.map((t) => ({
                value: String(t),
                label: `${t}s`,
              }))}
              value={String(silenceThreshold)}
              onValueChange={(value) => setSilenceThreshold(parseFloat(value))}
              disabled={!removeSilence}
              aria-label="Silence threshold in seconds"
            />
          </div>
          {removeSilence && silenceRemovalCount > 0 && (
            <span className="text-xs text-muted-foreground">
              ({silenceRemovalCount} silences)
            </span>
          )}
        </div>

        <div className="grid max-h-56 grid-cols-2 gap-x-3 gap-y-0.5 overflow-y-auto rounded-lg border border-border p-2 sm:grid-cols-3">
          {filteredFillers.map((word) => renderFillerItem(word, false))}
          {customFillers.map((word) => renderFillerItem(word, true))}
        </div>

        <div className="flex items-center gap-2">
          <Input
            size="sm"
            type="text"
            placeholder="Add custom filler word..."
            value={customWord}
            onChange={(e) => setCustomWord(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            aria-label="Add custom filler word"
          />
          <Button variant="secondary" size="sm" onClick={handleAddCustom} disabled={!customWord.trim()}>
            Add
          </Button>
        </div>
      </ModalBody>

      <ModalFooter className="justify-between">
        <span className="text-sm text-muted-foreground">
          {totalMatches} items • saves {formatDuration(totalTimeSavedMs)} →{' '}
          {formatDuration(newDurationMs)}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleApply} disabled={totalMatches === 0}>
            Mark as Deleted ({totalMatches})
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

FillerWordsModal.displayName = 'FillerWordsModal';
