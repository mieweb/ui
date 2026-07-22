/**
 * WordEditorModal — edit a word's text or split a silence into segments.
 *
 * Ported from pulseclip's TranscriptViewer for @mieweb/ui. For silences,
 * space-separated durations (e.g. "1 1 4 1") split the silence; the
 * remainder becomes the final segment.
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
import type { EditableWord } from '../TranscriptView/transcript';

export interface WordEditorModalProps {
  isOpen: boolean;
  editableWord: EditableWord | null;
  onClose: () => void;
  /** Save a new text for the word */
  onSave: (newText: string) => void;
  /** Split a silence into segments with the given durations (seconds) */
  onSplitSilence: (durations: number[]) => void;
  /** Toggle the word's deleted state */
  onDelete: () => void;
}

interface SilenceSplitResult {
  durations: number[];
  remainder: number;
  error?: string;
}

/**
 * Modal for editing a word or splitting a silence.
 * For silences, enter space-separated durations (e.g., "1 1 4 1") to split.
 */
export const WordEditorModal: React.FC<WordEditorModalProps> = ({
  isOpen,
  editableWord,
  onClose,
  onSave,
  onSplitSilence,
  onDelete,
}) => {
  const [inputValue, setInputValue] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isSilence = editableWord?.word.wordType === 'silence';
  const durationMs = editableWord
    ? editableWord.word.endMs - editableWord.word.startMs
    : 0;
  const durationSec = durationMs / 1000;

  // Reset input when the modal opens
  React.useEffect(() => {
    if (isOpen && editableWord) {
      if (isSilence) {
        setInputValue('');
      } else {
        setInputValue(editableWord.word.text);
      }
      setError(null);
      // Focus input after a short delay so it wins over the modal's focus trap
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, editableWord, isSilence]);

  // Parse silence split input (pure function, no side effects)
  const parseSilenceSplit = (input: string): SilenceSplitResult | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;

    const parts = trimmed.split(/\s+/);
    const durations: number[] = [];
    let total = 0;

    for (const part of parts) {
      const num = parseFloat(part);
      if (isNaN(num) || num <= 0) {
        return {
          durations: [],
          remainder: 0,
          error: `Invalid number: "${part}"`,
        };
      }
      durations.push(num);
      total += num;
    }

    if (total >= durationSec) {
      return {
        durations: [],
        remainder: 0,
        error: `Total (${total.toFixed(1)}s) exceeds silence duration (${durationSec.toFixed(1)}s)`,
      };
    }

    const remainder = durationSec - total;
    return { durations, remainder };
  };

  const handleApply = () => {
    if (isSilence) {
      const parsed = parseSilenceSplit(inputValue);
      if (parsed?.error) {
        setError(parsed.error);
        return;
      }
      if (parsed && parsed.durations.length > 0) {
        // Add the remainder as the final segment
        const allDurations = [...parsed.durations, parsed.remainder];
        onSplitSilence(allDurations);
        onClose();
      }
    } else {
      const trimmed = inputValue.trim();
      if (trimmed && trimmed !== editableWord?.word.text) {
        onSave(trimmed);
      }
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApply();
    }
  };

  // Preview for silence splitting
  const preview = isSilence ? parseSilenceSplit(inputValue) : null;

  const applyDisabled = isSilence
    ? !inputValue.trim() ||
      !!preview?.error ||
      !preview ||
      preview.durations.length === 0
    : !inputValue.trim();

  return (
    <Modal
      open={isOpen && editableWord !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="md"
    >
      <ModalHeader>
        <ModalTitle>{isSilence ? 'Split Silence' : 'Edit Word'}</ModalTitle>
        <ModalClose aria-label="Close editor" />
      </ModalHeader>

      <ModalBody className="flex flex-col gap-2">
        {isSilence ? (
          <>
            <p className="text-foreground m-0 text-sm">
              Silence duration:{' '}
              <strong className="font-semibold">
                {durationSec.toFixed(1)}s
              </strong>
            </p>
            <p className="text-muted-foreground m-0 text-xs">
              Enter space-separated durations to split (e.g., &quot;1 1 4
              1&quot;)
            </p>
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                setError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="1 2 3..."
              aria-label="Split durations"
            />
            {error && (
              <p className="text-destructive m-0 text-sm" role="alert">
                {error}
              </p>
            )}
            {preview &&
              !preview.error &&
              preview.durations.length > 0 &&
              !error && (
                <p className="text-muted-foreground m-0 text-sm">
                  Preview:{' '}
                  {[...preview.durations, preview.remainder]
                    .map((d) => `[${d.toFixed(1)}s]`)
                    .join(' ')}
                </p>
              )}
            {preview?.error && !error && (
              <p className="text-destructive m-0 text-sm" role="alert">
                {preview.error}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-foreground m-0 text-sm">Edit the word text:</p>
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Word text"
            />
          </>
        )}
      </ModalBody>

      <ModalFooter className="justify-between">
        <Button
          variant={editableWord?.deleted ? 'secondary' : 'danger'}
          size="sm"
          onClick={onDelete}
        >
          {editableWord?.deleted ? 'Restore' : 'Delete'}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            disabled={applyDisabled}
          >
            {isSilence ? 'Split' : 'Save'}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
};

WordEditorModal.displayName = 'WordEditorModal';
