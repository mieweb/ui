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
  // What's still to be said, by file: a newer message for a file replaces
  // its older one, and a file taken off takes its message with it. Kept
  // apart from the effect, so a progress-only re-render can't cancel it.
  const queued = React.useRef(
    new Map<string, { alert: boolean; text: string }>()
  );
  const timer = React.useRef<number | undefined>(undefined);
  // Forget the timer too, not just cancel it: under StrictMode the effects
  // re-run after this cleanup, and the queue must be scheduled again.
  React.useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      timer.current = undefined;
    },
    []
  );

  React.useEffect(() => {
    const seen = new Map<string, string>();
    let newPolite = false;
    let newAlert = false;
    for (const item of items) {
      const before = states.current.get(item.id);
      seen.set(item.id, item.state);
      if (before === item.state) continue;
      const name = item.file.name;
      let text = '';
      const alert = item.state === 'failed';
      if (item.state === 'uploading' && before !== 'processing') {
        text = labels.uploading(name);
      } else if (item.state === 'uploaded' && before !== undefined) {
        text = labels.uploaded(name);
      } else if (alert) {
        text = labels.failed(name);
      }
      if (!text) continue;
      queued.current.set(item.id, { alert, text });
      if (alert) newAlert = true;
      else newPolite = true;
    }
    for (const id of queued.current.keys()) {
      if (!seen.has(id)) queued.current.delete(id);
    }
    states.current = seen;
    const anyFailed = items.some((item) => item.state === 'failed');
    // Cleared first, then set: a live region only speaks when its text changes.
    if (newPolite || newAlert || !anyFailed) {
      setSaid((prev) => {
        const next = {
          polite: newPolite ? '' : prev.polite,
          alert: newAlert || !anyFailed ? '' : prev.alert,
        };
        return next.polite === prev.polite && next.alert === prev.alert
          ? prev
          : next;
      });
    }
    if (queued.current.size === 0) {
      window.clearTimeout(timer.current);
      timer.current = undefined;
      return;
    }
    if (timer.current !== undefined) return;
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      const messages = [...queued.current.values()];
      queued.current.clear();
      const say = (alert: boolean) =>
        messages
          .filter((message) => message.alert === alert)
          .map((message) => message.text)
          .join('. ');
      const polite = say(false);
      const alert = say(true);
      setSaid((prev) => ({
        polite: polite || prev.polite,
        alert: alert || prev.alert,
      }));
    }, 50);
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
