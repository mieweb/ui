import * as React from 'react';
import {
  generateAttachmentId,
  getFileType,
} from '../Messaging/AttachmentPicker';
import type { AttachmentType } from '../Messaging/types';

/**
 * Where a staged file stands. `pending`: staged with no upload function (the
 * host uploads at send). `uploading` until the last byte, then `processing`
 * until the host's upload resolves (a server converting a video); `uploaded`
 * with its result, or `failed` with an error.
 */
export type AttachmentUploadState =
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'uploaded'
  | 'failed';

/** What an upload function gets: abort on `signal`, report 0–1 with `onProgress`. */
export interface AttachmentUploadContext {
  signal: AbortSignal;
  onProgress: (fraction: number) => void;
}

/** Sends one file and resolves to whatever the host needs at send (e.g. a media id). */
export type UploadAttachment<R> = (
  file: File,
  context: AttachmentUploadContext
) => Promise<R>;

/** Undoes a finished upload the user took off before sending. */
export type DiscardAttachment<R> = (
  result: R,
  file: File
) => void | Promise<void>;

/** A staged file. `progress` is 0–1. */
export interface AttachmentUpload<R = unknown> {
  id: string;
  file: File;
  type: AttachmentType;
  previewUrl?: string;
  state: AttachmentUploadState;
  progress: number;
  error?: string;
  result?: R;
}

/** A finished upload: the file and what the host's upload resolved to. */
export interface UploadedAttachment<R = unknown> {
  file: File;
  result: R;
}

export interface UseAttachmentUploadsOptions<R> {
  /** Uploads each file as soon as it's added. Without it, files stay `pending`. */
  upload?: UploadAttachment<R>;
  /** Called for a finished upload removed (or left behind on unmount) before it was sent. */
  discard?: DiscardAttachment<R>;
  /**
   * Leave uploads in flight running when the component unmounts, instead of
   * aborting them: for an upload that lands where it's going by itself (a
   * server that attaches it on arrival), with nothing left for a send to do.
   * @default false
   */
  keepUploadingOnUnmount?: boolean;
}

export interface AttachmentUploads<R> {
  items: AttachmentUpload<R>[];
  /** The list as of now, ahead of the next render (two adds in one batch). */
  current: () => AttachmentUpload<R>[];
  /** Stages files and starts uploading them. Returns what was staged. */
  add: (files: File[]) => AttachmentUpload<R>[];
  /** Stages files that were uploaded already, without uploading them again. */
  restore: (uploads: UploadedAttachment<R>[]) => void;
  /** Takes a file off: aborts it while uploading, discards it once uploaded. */
  remove: (id: string) => void;
  /** Uploads a failed file again. */
  retry: (id: string) => void;
  /** Resolves once nothing is uploading, with what finished and what failed. */
  settle: () => Promise<{
    uploaded: AttachmentUpload<R>[];
    failed: AttachmentUpload<R>[];
  }>;
  /** Empties the list without discarding anything: the files are being sent. */
  take: () => AttachmentUpload<R>[];
  /** Empties the list, aborting and discarding as `remove` does. */
  clear: () => void;
}

const isBusy = (item: AttachmentUpload<unknown>) =>
  item.state === 'uploading' || item.state === 'processing';

const revoke = (item: AttachmentUpload<unknown>) => {
  if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
};

function stage<R>(file: File, fields: Partial<AttachmentUpload<R>>) {
  const type = getFileType(file.type);
  return {
    id: generateAttachmentId(),
    file,
    type,
    previewUrl:
      type === 'image' || type === 'video'
        ? URL.createObjectURL(file)
        : undefined,
    state: 'pending' as AttachmentUploadState,
    progress: 0,
    ...fields,
  } satisfies AttachmentUpload<R>;
}

/**
 * The files staged in a composer, each uploaded as soon as it's added when
 * an `upload` function is given: progress per file, abort on remove, discard
 * of a finished one taken off, retry, and `settle` for a send that waits for
 * the rest. Uploads start in `add` (a user action), never in an effect, so
 * StrictMode can't start one twice. On unmount, uploads in flight are
 * aborted and finished ones discarded: nothing was sent with them.
 */
export function useAttachmentUploads<R = unknown>({
  upload,
  discard,
  keepUploadingOnUnmount = false,
}: UseAttachmentUploadsOptions<R> = {}): AttachmentUploads<R> {
  const [items, setItems] = React.useState<AttachmentUpload<R>[]>([]);
  // The list as of now, for reads between renders (two adds in one batch).
  const itemsRef = React.useRef(items);
  const controllers = React.useRef(new Map<string, AbortController>());
  const inFlight = React.useRef(new Map<string, Promise<void>>());
  const mounted = React.useRef(false);
  // The latest callbacks, so an upload started earlier calls the current ones.
  const uploadRef = React.useRef(upload);
  const discardRef = React.useRef(discard);
  const keepRef = React.useRef(keepUploadingOnUnmount);
  uploadRef.current = upload;
  discardRef.current = discard;
  keepRef.current = keepUploadingOnUnmount;

  const commit = React.useCallback((next: AttachmentUpload<R>[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  const patch = React.useCallback(
    (id: string, fields: Partial<AttachmentUpload<R>>) => {
      if (!itemsRef.current.some((item) => item.id === id)) return;
      commit(
        itemsRef.current.map((item) =>
          item.id === id ? { ...item, ...fields } : item
        )
      );
    },
    [commit]
  );

  /** Undo a finished upload, best effort: the user already took it off. */
  const discardFinished = React.useCallback((result: R, file: File) => {
    if (!discardRef.current) return;
    void Promise.resolve()
      .then(() => discardRef.current?.(result, file))
      .catch(() => {});
  }, []);

  const discardResult = React.useCallback(
    (item: AttachmentUpload<R>) => {
      if (item.state === 'uploaded')
        discardFinished(item.result as R, item.file);
    },
    [discardFinished]
  );

  const start = React.useCallback(
    (item: AttachmentUpload<R>) => {
      const send = uploadRef.current;
      if (!send) return;
      const controller = new AbortController();
      controllers.current.set(item.id, controller);
      let shownPercent = -1;
      const onProgress = (fraction: number) => {
        if (controller.signal.aborted) return;
        const clamped = Math.min(1, Math.max(0, fraction));
        // One update per whole percent, so a fast upload doesn't re-render per chunk.
        const percent = Math.floor(clamped * 100);
        if (percent === shownPercent) return;
        shownPercent = percent;
        patch(item.id, {
          progress: clamped,
          state: clamped >= 1 ? 'processing' : 'uploading',
        });
      };
      // Called now, not a tick later, so the upload begins with the add.
      let sending: Promise<R>;
      try {
        sending = Promise.resolve(
          send(item.file, { signal: controller.signal, onProgress })
        );
      } catch (error) {
        sending = Promise.reject(error);
      }
      const done = sending
        .then(
          (result) => {
            if (controller.signal.aborted) return;
            if (!mounted.current) {
              // Finished after the composer went away: nothing will send it,
              // unless it lands where it's going by itself.
              if (!keepRef.current) discardFinished(result, item.file);
              return;
            }
            patch(item.id, { state: 'uploaded', progress: 1, result });
          },
          (error: unknown) => {
            if (controller.signal.aborted) return;
            patch(item.id, {
              state: 'failed',
              error:
                error instanceof Error && error.message
                  ? error.message
                  : 'Upload failed',
            });
          }
        )
        .finally(() => {
          if (controllers.current.get(item.id) === controller) {
            controllers.current.delete(item.id);
            inFlight.current.delete(item.id);
          }
        });
      // Settles on an abort too, so a removed upload stops holding up
      // `settle` even if the host's upload ignores its signal.
      const aborted = new Promise<void>((resolve) =>
        controller.signal.addEventListener('abort', () => resolve(), {
          once: true,
        })
      );
      inFlight.current.set(item.id, Promise.race([done, aborted]));
    },
    [patch, discardFinished]
  );

  const add = React.useCallback(
    (files: File[]) => {
      const staged = files.map((file) =>
        stage<R>(file, uploadRef.current ? { state: 'uploading' } : {})
      );
      if (staged.length === 0) return staged;
      commit([...itemsRef.current, ...staged]);
      staged.forEach(start);
      return staged;
    },
    [commit, start]
  );

  const restore = React.useCallback(
    (uploads: UploadedAttachment<R>[]) => {
      if (uploads.length === 0) return;
      commit([
        ...itemsRef.current,
        ...uploads.map(({ file, result }) =>
          stage<R>(file, { state: 'uploaded', progress: 1, result })
        ),
      ]);
    },
    [commit]
  );

  /** Drops items, aborting the busy ones and discarding the finished ones (unless `keep`). */
  const drop = React.useCallback(
    (ids: Set<string>, keep: boolean) => {
      const dropped = itemsRef.current.filter((item) => ids.has(item.id));
      for (const item of dropped) {
        controllers.current.get(item.id)?.abort();
        controllers.current.delete(item.id);
        inFlight.current.delete(item.id);
        revoke(item);
        if (!keep) discardResult(item);
      }
      commit(itemsRef.current.filter((item) => !ids.has(item.id)));
      return dropped;
    },
    [commit, discardResult]
  );

  const remove = React.useCallback(
    (id: string) => {
      drop(new Set([id]), false);
    },
    [drop]
  );

  const retry = React.useCallback(
    (id: string) => {
      const item = itemsRef.current.find((other) => other.id === id);
      if (!item || item.state !== 'failed' || !uploadRef.current) return;
      const fresh = { ...item, state: 'uploading' as const, progress: 0 };
      delete fresh.error;
      commit(
        itemsRef.current.map((other) => (other.id === id ? fresh : other))
      );
      start(fresh);
    },
    [commit, start]
  );

  const settle = React.useCallback(async () => {
    // Uploads retried while waiting join the wait.
    while (inFlight.current.size > 0) {
      await Promise.allSettled([...inFlight.current.values()]);
    }
    return {
      uploaded: itemsRef.current.filter((item) => item.state === 'uploaded'),
      failed: itemsRef.current.filter((item) => item.state === 'failed'),
    };
  }, []);

  const take = React.useCallback(
    () => drop(new Set(itemsRef.current.map((item) => item.id)), true),
    [drop]
  );

  const clear = React.useCallback(() => {
    drop(new Set(itemsRef.current.map((item) => item.id)), false);
  }, [drop]);

  React.useEffect(() => {
    mounted.current = true;
    const controllersAtMount = controllers.current;
    const inFlightAtMount = inFlight.current;
    return () => {
      mounted.current = false;
      for (const item of itemsRef.current) {
        revoke(item);
        if (keepRef.current) continue;
        controllersAtMount.get(item.id)?.abort();
        discardResult(item);
      }
      controllersAtMount.clear();
      inFlightAtMount.clear();
      // The list goes with them, on screen too: effects that run again
      // without a real unmount (Fast Refresh, a hidden <Activity>) must not
      // keep tiles whose previews and uploads are gone.
      itemsRef.current = [];
      setItems([]);
    };
  }, [discardResult]);

  const current = React.useCallback(() => itemsRef.current, []);

  return React.useMemo(
    () => ({
      items,
      current,
      add,
      restore,
      remove,
      retry,
      settle,
      take,
      clear,
    }),
    [items, current, add, restore, remove, retry, settle, take, clear]
  );
}

/** Whether any staged file is still uploading or being processed. */
export const hasBusyUpload = (items: AttachmentUpload<unknown>[]) =>
  items.some(isBusy);
