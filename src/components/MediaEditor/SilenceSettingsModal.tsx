/**
 * SilenceSettingsModal — configure silence detection thresholds.
 *
 * Ported from pulseclip's TranscriptViewer for @mieweb/ui. The paragraph
 * break threshold is clamped to be >= the minimum silence duration.
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
import { Slider } from '../Slider';

export interface SilenceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Current minimum silence duration (ms) */
  minSilenceMs: number;
  /** Current paragraph break threshold (ms) */
  nlSilenceMs: number;
  /** Apply new thresholds (both in ms) */
  onApply: (minSilenceMs: number, nlSilenceMs: number) => void;
}

/** Modal for configuring silence detection settings */
export const SilenceSettingsModal: React.FC<SilenceSettingsModalProps> = ({
  isOpen,
  onClose,
  minSilenceMs,
  nlSilenceMs,
  onApply,
}) => {
  const [threshold, setThreshold] = React.useState(minSilenceMs / 1000);
  const [nlThreshold, setNlThreshold] = React.useState(nlSilenceMs / 1000);

  // Reset when the modal opens
  React.useEffect(() => {
    if (isOpen) {
      setThreshold(minSilenceMs / 1000);
      setNlThreshold(nlSilenceMs / 1000);
    }
  }, [isOpen, minSilenceMs, nlSilenceMs]);

  const handleApply = () => {
    // Ensure nlThreshold is always >= threshold
    const finalNlThreshold = Math.max(nlThreshold, threshold);
    onApply(Math.round(threshold * 1000), Math.round(finalNlThreshold * 1000));
    onClose();
  };

  // Auto-adjust newline threshold if it would be less than the min threshold
  const handleThresholdChange = (value: number) => {
    setThreshold(value);
    if (nlThreshold < value) {
      setNlThreshold(value);
    }
  };

  const formatSeconds = (v: number) => `${v.toFixed(1)}s`;

  return (
    <Modal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      size="md"
    >
      <ModalHeader>
        <ModalTitle>Silence Settings</ModalTitle>
        <ModalClose aria-label="Close modal" />
      </ModalHeader>

      <ModalBody className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Slider
            label="Minimum silence duration"
            min={0.1}
            max={2}
            step={0.1}
            value={threshold}
            onValueChange={handleThresholdChange}
            showValue
            formatValue={formatSeconds}
            aria-label="Minimum silence duration"
          />
          <p className="text-muted-foreground m-0 text-xs">
            Gaps shorter than this will not be shown as silences.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <Slider
            label="Paragraph break threshold"
            min={threshold}
            max={5}
            step={0.1}
            value={nlThreshold}
            onValueChange={setNlThreshold}
            showValue
            formatValue={formatSeconds}
            aria-label="Paragraph break threshold"
          />
          <p className="text-muted-foreground m-0 text-xs">
            Silences longer than this will create paragraph breaks.
          </p>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="sm" onClick={handleApply}>
          Apply
        </Button>
      </ModalFooter>
    </Modal>
  );
};

SilenceSettingsModal.displayName = 'SilenceSettingsModal';
