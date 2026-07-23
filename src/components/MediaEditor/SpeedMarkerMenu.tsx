/**
 * SpeedMarkerMenu — context-menu popup for setting per-word speed markers.
 *
 * Ported from pulseclip's TranscriptViewer for @mieweb/ui. Hand-built (plain
 * elements + tokens): a positioned context menu has no @mieweb/ui primitive.
 */

import * as React from 'react';
import type { PlaybackSpeed, SpeedMarker } from '../TranscriptView/transcript';
import { PLAYBACK_SPEEDS } from '../TranscriptView/transcript';

export interface SpeedMarkerMenuProps {
  isOpen: boolean;
  /** Viewport coordinates for the menu (already clamped by the caller) */
  position: { x: number; y: number } | null;
  /** The edited-word index the menu applies to */
  wordIndex: number | null;
  /** Existing marker at that word, if any */
  currentMarker: SpeedMarker | undefined;
  defaultSpeed: PlaybackSpeed;
  onSetSpeed: (speed: PlaybackSpeed) => void;
  onRemoveMarker: () => void;
  onClose: () => void;
}

/** Popup menu for setting speed markers on a word */
export const SpeedMarkerMenu: React.FC<SpeedMarkerMenuProps> = ({
  isOpen,
  position,
  currentMarker,
  defaultSpeed,
  onSetSpeed,
  onRemoveMarker,
  onClose,
}) => {
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close on escape or click outside
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !position) return null;

  return (
    <div
      ref={menuRef}
      className="border-border bg-card text-card-foreground fixed z-50 min-w-36 overflow-hidden rounded-lg border shadow-lg"
      style={{ left: position.x, top: position.y }}
      role="menu"
      aria-label="Set speed marker"
    >
      <div className="border-border text-muted-foreground border-b px-3 py-1.5 text-xs font-semibold">
        Set Speed Marker
      </div>
      <div className="flex flex-col p-1">
        {PLAYBACK_SPEEDS.map((speed) => {
          const isActive = currentMarker?.speed === speed;
          const isDefault = speed === defaultSpeed && !currentMarker;
          return (
            <button
              key={speed}
              type="button"
              className={`focus-visible:ring-ring flex items-center justify-between gap-2 rounded-md px-2.5 py-1 text-start text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                isActive
                  ? 'bg-primary-600 font-medium text-white'
                  : 'text-foreground hover:bg-muted'
              }`}
              onClick={() => {
                onSetSpeed(speed);
                onClose();
              }}
              role="menuitem"
            >
              {speed}x
              {isDefault && (
                <span className="text-muted-foreground text-xs">default</span>
              )}
            </button>
          );
        })}
      </div>
      {currentMarker && (
        <button
          type="button"
          className="border-border text-destructive hover:bg-destructive/10 focus-visible:ring-ring w-full border-t px-2.5 py-1.5 text-start text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
          onClick={() => {
            onRemoveMarker();
            onClose();
          }}
          role="menuitem"
        >
          Remove Marker
        </button>
      )}
    </div>
  );
};

SpeedMarkerMenu.displayName = 'SpeedMarkerMenu';
