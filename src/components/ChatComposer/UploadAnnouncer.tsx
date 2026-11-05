import * as React from 'react';
import type { AttachmentUpload } from './useAttachmentUploads';

/** What UploadAnnouncer says. */
export interface UploadAnnouncerLabels {
  uploading: (name: string) => string;
  uploaded: (name: string) => string;
  failed: (name: string) => string;
}

export interface UploadAnnouncerProps {
  /** The files being uploaded (useAttachmentUploads `items`). */
  items: AttachmentUpload<unknown>[];
  labels: UploadAnnouncerLabels;
}

/**
 * Says how a set of uploads is going, for screen readers: a start and a
 * finish politely, a failure as an alert — never each percent. Several files
 * changing at once are said together; the same words again (a retry, a second
 * failure) are said again; a failure's alert clears once nothing has failed.
 * Renders two visually hidden live regions; put it beside the tiles.
 */
export function UploadAnnouncer({ items, labels }: UploadAnnouncerProps) {
  const [said, setSaid] = React.useState({ polite: '', alert: '' });
  const states = React.useRef(new Map<string, string>());

  React.useEffect(() => {
    const seen = new Map<string, string>();
    const polite: string[] = [];
    const alert: string[] = [];
    for (const item of items) {
      const before = states.current.get(item.id);
      seen.set(item.id, item.state);
      if (before === item.state) continue;
      const name = item.file.name;
      if (item.state === 'uploading' && before !== 'processing') {
        polite.push(labels.uploading(name));
      } else if (item.state === 'uploaded' && before !== undefined) {
        polite.push(labels.uploaded(name));
      } else if (item.state === 'failed') {
        alert.push(labels.failed(name));
      }
    }
    states.current = seen;
    const anyFailed = items.some((item) => item.state === 'failed');
    if (!polite.length && !alert.length) {
      if (!anyFailed)
        setSaid((prev) => (prev.alert ? { ...prev, alert: '' } : prev));
      return;
    }
    // Cleared first, then set: a live region only speaks when its text changes.
    setSaid((prev) => ({
      polite: polite.length ? '' : prev.polite,
      alert: alert.length || !anyFailed ? '' : prev.alert,
    }));
    const timer = window.setTimeout(
      () =>
        setSaid((prev) => ({
          polite: polite.length ? polite.join('. ') : prev.polite,
          alert: alert.length ? alert.join('. ') : prev.alert,
        })),
      50
    );
    return () => window.clearTimeout(timer);
  }, [items, labels]);

  return (
    <>
      <span role="status" className="sr-only">
        {said.polite}
      </span>
      <span role="alert" className="sr-only">
        {said.alert}
      </span>
    </>
  );
}
