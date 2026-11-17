'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
} from 'react';
import {
  Download,
  Forward,
  LockKeyhole,
  Paperclip,
  Reply,
  ReplyAll,
  Save,
  Send,
  X,
} from 'lucide-react';
import { DateTime } from 'luxon';
import type {
  DocumentAttachment,
  Mailbox,
  MimeDocument,
} from '@kerebron/documents';
import type { AssetLoad } from '@kerebron/editor';

import { cn } from '../../utils/cn';
import { useDirection } from '../../hooks/useDirection';
import { Button } from '../Button';
import { Input } from '../Input';
import { RichEditor } from '../RichEditor';
import { createEmailPreview, referencedAttachments } from './emailPreview';
import type {
  ArtifactCompositionAction,
  ArtifactBodyViewBinding,
  ArtifactEditorController,
  ArtifactMessageHeader,
  ArtifactPreviewLease,
  ArtifactSerializationPurpose,
  SerializedArtifactDocument,
} from './types';

function BorrowedBodySurface({
  controller,
  valueType,
  readOnly,
  assetLoad,
  label,
  uploadError,
  onReady,
  onError,
}: {
  controller: ArtifactEditorController;
  valueType: string;
  readOnly: boolean;
  assetLoad?: AssetLoad;
  label: string;
  uploadError: string;
  onReady: () => void;
  onError: (reason: unknown) => void;
}) {
  const [binding, setBinding] = useState<ArtifactBodyViewBinding | null>(null);
  const [connected, setConnected] = useState(false);
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    const view = controller.body.createBinding();
    setBinding(view);
    return () => {
      active.current = false;
      view.dispose();
    };
  }, [controller]);
  if (!binding) return null;
  return (
    <RichEditor
      value=""
      valueType={valueType}
      aria-label={label}
      readOnly={readOnly || !connected}
      assetLoad={assetLoad}
      omitExtensions={['history']}
      editorKits={binding.editorKits}
      mediaUpload={{
        uploadHandler: async () => {
          throw new Error(uploadError);
        },
      }}
      onReady={(editor) => {
        void Promise.resolve()
          .then(() => binding.connect(editor))
          .then(
            () => {
              if (active.current) {
                setConnected(true);
                onReady();
              }
            },
            (error) => {
              if (active.current) onError(error);
            }
          );
      }}
      onError={onError}
    />
  );
}

export interface ArtifactEditorLabels {
  from: string;
  to: string;
  cc: string;
  bcc: string;
  subject: string;
  date: string;
  noSubject: string;
  document: string;
  body: string;
  messagePreview: string;
  attachments: string;
  attachFiles: string;
  download: string;
  removeAttachment: string;
  reply: string;
  replyAll: string;
  forward: string;
  saveDraft: string;
  saveDocument: string;
  send: string;
  exportSource: string;
  saved: string;
  sent: string;
  exported: string;
  attached: string;
  unsaved: string;
  unchanged: string;
  loadingEditor: string;
  loadingMedia: string;
  locked: string;
  lockedTitle: string;
  unsupportedEdit: string;
  externalMediaBlocked: string;
  attachmentHelp: string;
  inlinePasteUnavailable: string;
  actionFailed: string;
}

const defaultLabels: ArtifactEditorLabels = {
  from: 'From',
  to: 'To',
  cc: 'Cc',
  bcc: 'Bcc',
  subject: 'Subject',
  date: 'Date',
  noSubject: '(No subject)',
  document: 'MDY document',
  body: 'Document body',
  messagePreview: 'Email message body',
  attachments: 'Attachments',
  attachFiles: 'Attach files',
  download: 'Download',
  removeAttachment: 'Remove attachment',
  reply: 'Reply',
  replyAll: 'Reply all',
  forward: 'Forward',
  saveDraft: 'Save draft',
  saveDocument: 'Save document',
  send: 'Send',
  exportSource: 'Export source',
  saved: 'Saved',
  sent: 'Message prepared for sending',
  exported: 'Source exported',
  attached: 'Files attached',
  unsaved: 'Unsaved changes',
  unchanged: 'No unsaved changes',
  loadingEditor: 'Preparing editor…',
  loadingMedia: 'Opening protected media…',
  locked:
    'Protected storage is locked. Unlock it through the host application to continue.',
  lockedTitle: 'Protected document',
  unsupportedEdit:
    'This message is preserved for viewing and source export. Its protected or unsupported content cannot be edited in place.',
  externalMediaBlocked:
    'Outside images, media, and links stay inactive in this preview.',
  attachmentHelp:
    'Use Attach files for protected attachments. Inline media stays as a reference in the editor; previews are available in message display and the attachment list.',
  inlinePasteUnavailable: 'Use Attach files to add protected attachments.',
  actionFailed: 'The operation could not be completed.',
};

export interface ArtifactDocumentEditorProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  'onError'
> {
  /** Authorized, host-owned canonical document and protected storage integration. */
  controller: ArtifactEditorController;
  /** Receive a complete editable MIME draft or an MDY document after serialization. */
  onSaveDraft?: (output: SerializedArtifactDocument) => void | Promise<void>;
  /** Delivery bytes omit Bcc headers; the separate envelope includes its recipients. */
  onSend?: (output: SerializedArtifactDocument) => void | Promise<void>;
  /** Receive preserved original bytes (when unchanged) or the current source export. */
  onExportSource?: (output: SerializedArtifactDocument) => void | Promise<void>;
  /** Called when storage, editor, codec, or host callbacks fail. */
  onError?: (error: unknown) => void;
  /** Override all component-owned English labels. Kerebron owns its toolbar labels. */
  labels?: Partial<ArtifactEditorLabels>;
  /** Kerebron WASM grammar loader, if the host serves assets elsewhere. */
  assetLoad?: AssetLoad;
}

function mailboxText(mailboxes: readonly Mailbox[]): string {
  // Presentation only. The codec/controller parses and serializes address syntax.
  return mailboxes
    .map(({ address, name }) => (name ? `${name} <${address}>` : address))
    .join(', ');
}

function dateText(value: string): string {
  const date = DateTime.fromRFC2822(value);
  const parsed = date.isValid ? date : DateTime.fromISO(value);
  return parsed.isValid ? parsed.toLocaleString(DateTime.DATETIME_MED) : value;
}

function HeaderInput({
  label,
  value,
  disabled,
  dir,
  onEdit,
  onCommit,
}: {
  label: string;
  value: string;
  disabled: boolean;
  dir?: 'ltr';
  onEdit: (value: string) => void;
  onCommit: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setDraft(value);
  }, [value]);
  return (
    <Input
      label={label}
      value={draft}
      disabled={disabled}
      size="sm"
      dir={dir}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(event) => {
        setDraft(event.target.value);
        onEdit(event.target.value);
      }}
      onBlur={() => {
        focused.current = false;
        onCommit();
      }}
    />
  );
}

function MessageHeaders({
  message,
  labels,
}: {
  message: MimeDocument;
  labels: ArtifactEditorLabels;
}) {
  const rows = [
    [labels.from, mailboxText(message.from)],
    [labels.to, mailboxText(message.to)],
    ...(message.cc.length ? [[labels.cc, mailboxText(message.cc)]] : []),
    ...(message.date ? [[labels.date, dateText(message.date)]] : []),
  ];
  return (
    <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground font-medium">{label}</dt>
          <dd className="min-w-0 break-words">
            {/* Mailbox punctuation and formatted dates are LTR text islands. */}
            <bdi dir="ltr">{value}</bdi>
          </dd>
        </div>
      ))}
    </dl>
  );
}

function EmailBodyPreview({
  html,
  text,
  attachments,
  controller,
  labels,
  direction,
  onError,
}: {
  html?: string;
  text?: string;
  attachments: readonly DocumentAttachment[];
  controller: ArtifactEditorController;
  labels: ArtifactEditorLabels;
  direction: 'ltr' | 'rtl';
  onError: (error: unknown) => void;
}) {
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(Boolean(html));
  const attachmentsKey = attachments
    .map((part) => `${part.id}:${part.ref}`)
    .join('|');

  useEffect(() => {
    let disposed = false;
    const leases: ArtifactPreviewLease[] = [];
    setPreview('');
    if (!html) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const prepare = async () => {
      const urls = new Map<string, string>();
      for (const part of referencedAttachments(html, attachments)) {
        try {
          const lease = await controller.openAttachment(part.id);
          if (disposed) {
            lease.release();
            return;
          }
          leases.push(lease);
          urls.set(part.id, lease.url);
        } catch (error) {
          if (!disposed) onError(error);
        }
      }
      if (!disposed) {
        setPreview(createEmailPreview(html, attachments, urls, direction));
        setLoading(false);
      }
    };
    void prepare().catch((error) => {
      if (!disposed) {
        setLoading(false);
        onError(error);
      }
    });
    return () => {
      disposed = true;
      leases.forEach((lease) => lease.release());
    };
    // The immutable attachment IDs/revisions describe preview dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [html, attachmentsKey, controller, direction, onError]);

  if (!html) {
    return (
      <div className="min-h-32 p-4 break-words whitespace-pre-wrap">{text}</div>
    );
  }
  return (
    <div data-slot="artifact-document-preview">
      {loading && (
        <p role="status" className="text-muted-foreground px-4 py-2 text-sm">
          {labels.loadingMedia}
        </p>
      )}
      {preview && (
        <iframe
          title={labels.messagePreview}
          srcDoc={preview}
          // Same origin lets partitioned blob URLs load (including WebKit).
          // Scripts stay sandboxed: never combine this with allow-scripts.
          sandbox="allow-same-origin"
          referrerPolicy="no-referrer"
          className="h-96 w-full border-0"
        />
      )}
      <p className="text-muted-foreground border-border border-t px-4 py-2 text-xs">
        {labels.externalMediaBlocked}
      </p>
    </div>
  );
}

/** MIME message view/composer and preferred MDY surface over a borrowed session. */
export const ArtifactDocumentEditor = forwardRef<
  HTMLDivElement,
  ArtifactDocumentEditorProps
>(function ArtifactDocumentEditor(
  {
    controller,
    onSaveDraft,
    onSend,
    onExportSource,
    onError,
    labels: labelOverrides,
    assetLoad,
    className,
    ...rest
  },
  forwardedRef
) {
  const localRef = useRef<HTMLDivElement>(null);
  const direction = useDirection(localRef);
  const subscribe = useCallback(
    (listener: () => void) => controller.subscribe(listener),
    [controller]
  );
  const getSnapshot = useCallback(() => controller.getSnapshot(), [controller]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const labels = { ...defaultLabels, ...labelOverrides };
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(false);
  const [bodyReady, setBodyReady] = useState(false);
  const running = useRef(false);
  const edits = useRef(new Map<ArtifactMessageHeader, string>());
  const downloads = useRef(new Set<ArtifactPreviewLease>());
  const downloadEpoch = useRef(0);
  const liveBody = useRef<{
    controller: ArtifactEditorController;
    version: number;
    locked: boolean;
  } | null>(null);
  liveBody.current = {
    controller,
    version: snapshot.bodyVersion,
    locked: snapshot.locked,
  };
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const message =
    snapshot.document.format === 'mime' ? snapshot.document : null;
  const composing = snapshot.mode === 'compose';
  const busy = pending || Boolean(snapshot.pending);
  const readOnly = Boolean(message?.readOnly);
  const blocked = busy || snapshot.locked || readOnly;
  const errorCallback = useRef(onError);
  errorCallback.current = onError;
  const failureText = useRef(labels.actionFailed);
  failureText.current = labels.actionFailed;

  const reportError = useCallback((reason: unknown) => {
    setError(reason instanceof Error ? reason.message : failureText.current);
    errorCallback.current?.(reason);
  }, []);

  useEffect(() => {
    liveBody.current = {
      controller,
      version: snapshot.bodyVersion,
      locked: snapshot.locked,
    };
    setBodyReady(false);
    edits.current.clear();
    setError('');
    setStatus('');
  }, [controller, snapshot.bodyVersion, snapshot.locked]);

  useEffect(() => {
    const leases = downloads.current;
    return () => {
      downloadEpoch.current += 1;
      liveBody.current = null;
      leases.forEach((lease) => lease.release());
      leases.clear();
    };
  }, [controller, snapshot.locked]);

  const commitHeader = (name: ArtifactMessageHeader) => {
    const value = edits.current.get(name);
    if (value === undefined) return;
    controller.setHeader(name, value);
    edits.current.delete(name);
  };
  const commitHeaders = () => {
    for (const name of [...edits.current.keys()]) commitHeader(name);
  };
  const run = async (operation: () => Promise<void>) => {
    if (running.current || snapshot.locked) return;
    running.current = true;
    setPending(true);
    setError('');
    setStatus('');
    try {
      commitHeaders();
      await operation();
    } catch (reason) {
      reportError(reason);
    } finally {
      running.current = false;
      setPending(false);
    }
  };
  const compose = (action: ArtifactCompositionAction) =>
    run(() => controller.compose(action));
  const serialize = (
    purpose: ArtifactSerializationPurpose,
    callback:
      | ((output: SerializedArtifactDocument) => void | Promise<void>)
      | undefined,
    success: string
  ) =>
    run(async () => {
      const epoch = downloadEpoch.current;
      const active = () =>
        liveBody.current?.controller === controller &&
        liveBody.current.version === snapshot.bodyVersion &&
        !liveBody.current.locked &&
        epoch === downloadEpoch.current &&
        !controller.getSnapshot().locked;
      const output = await controller.serialize(purpose);
      if (!active()) return;
      await callback?.(output);
      if (active()) setStatus(success);
    });

  const download = (part: DocumentAttachment) =>
    run(async () => {
      const epoch = downloadEpoch.current;
      const lease = await controller.openAttachment(part.id);
      if (controller.getSnapshot().locked || epoch !== downloadEpoch.current) {
        lease.release();
        return;
      }
      downloads.current.add(lease);
      const link = document.createElement('a');
      link.href = lease.url;
      link.download = part.filename;
      link.rel = 'noopener noreferrer';
      link.click();
      setTimeout(() => {
        if (downloads.current.delete(lease)) lease.release();
      }, 1000);
    });

  return (
    <div
      {...rest}
      ref={(node) => {
        localRef.current = node;
        if (typeof forwardedRef === 'function') forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      data-slot="artifact-document-editor"
      className={cn(
        'border-border bg-background text-foreground overflow-hidden rounded-xl border text-start',
        className
      )}
      aria-busy={busy || undefined}
    >
      <div
        data-slot="artifact-document-header"
        className="border-border space-y-3 border-b p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id={`${id}-title`}
            className="min-w-0 text-lg font-semibold break-words"
          >
            {snapshot.locked
              ? labels.lockedTitle
              : message
                ? message.subject || labels.noSubject
                : labels.document}
          </h2>
          <span className="bg-muted text-muted-foreground rounded px-2 py-1 text-xs font-medium">
            {snapshot.document.format.toUpperCase()}
          </span>
        </div>
        {!snapshot.locked &&
          message &&
          (composing ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {(['from', 'to', 'cc', 'bcc', 'subject'] as const).map((name) => (
                <HeaderInput
                  key={`${snapshot.bodyVersion}-${name}`}
                  label={labels[name]}
                  dir={name === 'subject' ? undefined : 'ltr'}
                  value={
                    name === 'subject'
                      ? message.subject
                      : mailboxText(message[name])
                  }
                  disabled={blocked}
                  onEdit={(value) => edits.current.set(name, value)}
                  onCommit={() => {
                    try {
                      commitHeader(name);
                    } catch (reason) {
                      reportError(reason);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <MessageHeaders message={message} labels={labels} />
          ))}
      </div>

      {snapshot.locked ? (
        <div role="status" className="flex items-center gap-2 p-6 text-sm">
          <LockKeyhole className="h-5 w-5 shrink-0" aria-hidden="true" />
          {labels.locked}
        </div>
      ) : (
        <>
          <div
            data-slot="artifact-document-actions"
            className="border-border flex flex-wrap gap-2 border-b p-3"
          >
            {message && !composing && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void compose('reply')}
                  leftIcon={
                    <Reply
                      className="h-4 w-4 rtl:-scale-x-100"
                      aria-hidden="true"
                    />
                  }
                >
                  {labels.reply}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void compose('replyAll')}
                  leftIcon={
                    <ReplyAll
                      className="h-4 w-4 rtl:-scale-x-100"
                      aria-hidden="true"
                    />
                  }
                >
                  {labels.replyAll}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => void compose('forward')}
                  leftIcon={
                    <Forward
                      className="h-4 w-4 rtl:-scale-x-100"
                      aria-hidden="true"
                    />
                  }
                >
                  {labels.forward}
                </Button>
              </>
            )}
            {composing && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={blocked || !bodyReady}
                  onClick={() => inputRef.current?.click()}
                  leftIcon={
                    <Paperclip className="h-4 w-4" aria-hidden="true" />
                  }
                >
                  {labels.attachFiles}
                </Button>
                {onSaveDraft && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={blocked || !bodyReady}
                    onClick={() =>
                      void serialize('draft', onSaveDraft, labels.saved)
                    }
                    leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
                  >
                    {message ? labels.saveDraft : labels.saveDocument}
                  </Button>
                )}
                {message && onSend && (
                  <Button
                    size="sm"
                    disabled={blocked || !bodyReady}
                    onClick={() =>
                      void serialize('delivery', onSend, labels.sent)
                    }
                    leftIcon={
                      <Send
                        className="h-4 w-4 rtl:-scale-x-100"
                        aria-hidden="true"
                      />
                    }
                  >
                    {labels.send}
                  </Button>
                )}
              </>
            )}
            {onExportSource && (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy || (composing && !bodyReady)}
                onClick={() =>
                  void serialize('source', onExportSource, labels.exported)
                }
                leftIcon={<Download className="h-4 w-4" aria-hidden="true" />}
              >
                {labels.exportSource}
              </Button>
            )}
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              aria-label={labels.attachFiles}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = '';
                if (files.length)
                  void run(async () => {
                    await controller.attachFiles(files);
                    setStatus(labels.attached);
                  });
              }}
            />
          </div>

          {readOnly && (
            <p role="note" className="bg-muted px-4 py-3 text-sm">
              {labels.unsupportedEdit}
            </p>
          )}
          {message && !composing ? (
            <EmailBodyPreview
              html={message.body.html}
              text={message.body.text}
              attachments={snapshot.attachments}
              controller={controller}
              labels={labels}
              direction={direction}
              onError={reportError}
            />
          ) : (
            <div data-slot="artifact-document-body" className="p-3">
              {!bodyReady && (
                <p role="status" className="text-muted-foreground mb-2 text-sm">
                  {labels.loadingEditor}
                </p>
              )}
              <BorrowedBodySurface
                key={`${snapshot.reference.artipodId}:${snapshot.reference.artifactId}:${snapshot.bodyVersion}`}
                valueType={message ? 'text/html' : 'text/x-markdown'}
                label={labels.body}
                readOnly={blocked}
                assetLoad={assetLoad}
                controller={controller}
                uploadError={labels.inlinePasteUnavailable}
                onReady={() => {
                  if (
                    liveBody.current?.controller === controller &&
                    liveBody.current.version === snapshot.bodyVersion &&
                    !liveBody.current.locked
                  )
                    setBodyReady(true);
                }}
                onError={reportError}
              />
              <p className="text-muted-foreground mt-2 text-xs">
                {labels.attachmentHelp}
              </p>
            </div>
          )}

          {snapshot.attachments.length > 0 && (
            <section
              aria-labelledby={`${id}-attachments`}
              className="border-border space-y-2 border-t p-4"
              data-slot="artifact-document-attachments"
            >
              <h3 id={`${id}-attachments`} className="text-sm font-semibold">
                {labels.attachments} ({snapshot.attachments.length})
              </h3>
              <ul className="space-y-2">
                {snapshot.attachments.map((part) => (
                  <li
                    key={part.id}
                    className="border-border flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <Paperclip
                      className="text-muted-foreground h-4 w-4 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 break-words">
                      {part.filename}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {new Intl.NumberFormat().format(part.size)} B
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => void download(part)}
                      aria-label={`${labels.download}: ${part.filename}`}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </Button>
                    {composing && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={blocked}
                        onClick={() => {
                          try {
                            controller.removeAttachment(part.id);
                          } catch (reason) {
                            reportError(reason);
                          }
                        }}
                        aria-label={`${labels.removeAttachment}: ${part.filename}`}
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <div
        data-slot="artifact-document-status"
        className="border-border text-muted-foreground border-t px-4 py-2 text-xs"
      >
        {!snapshot.locked && error && (
          <p role="alert" className="text-destructive mb-1">
            {error}
          </p>
        )}
        <p role="status" aria-live="polite">
          {snapshot.locked
            ? labels.lockedTitle
            : busy
              ? snapshot.pending || labels.loadingEditor
              : status || (snapshot.dirty ? labels.unsaved : labels.unchanged)}
        </p>
        {!snapshot.locked &&
          snapshot.document.diagnostics.map((diagnostic, index) => (
            <p key={`${diagnostic.code}-${index}`} className="mt-1">
              {diagnostic.message}
            </p>
          ))}
      </div>
    </div>
  );
});
