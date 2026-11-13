'use client';

import * as React from 'react';
import { Save } from 'lucide-react';
import { EsheetRenderer, type EsheetRendererHandle } from '@esheet/renderer';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Select } from '../Select';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import type { RichEditorHandle } from '../RichEditor';
import {
  MessagesProvider,
  useMessages,
  type ComponentMessages,
} from '../../utils/messages';
import {
  EsheetNarrativeMediaContext,
  registerEsheetNarrativeFieldType,
} from '../../esheet-fields/EsheetNarrativeField';
import {
  EsheetSectionContext,
  registerEsheetSectionFieldType,
} from '../../esheet-fields/EsheetSectionField';
import { DocumentExportView } from './DocumentExportView';
import { DocumentMdyView } from './DocumentMdyView';
import {
  createRichTextEsheetFormDefinition,
  getRichTextEsheetSectionFieldId,
  type RichTextEsheetDefinition,
  type RichTextEsheetMode,
  type RichTextEsheetParty,
  type RichTextEsheetResponses,
  type RichTextEsheetSnapshot,
} from './definition';
import {
  getRichTextEsheetDocumentBody,
  getRichTextEsheetMdyFields,
  getRichTextEsheetMdyParties,
  getRichTextEsheetRetiredMdyFields,
  parseRichTextEsheetMdy,
  renderRichTextEsheetMdy,
  richTextEsheetDocumentResponse,
  RICHTEXT_ESHEET_DOCUMENT_FIELD_ID,
  updateRichTextEsheetDocumentBody,
} from './mdy';
import {
  useDocumentMediaCapture,
  type DocumentMediaCaptureOptions,
} from './mediaCapture';
import { createRichTextEsheetSnapshot } from './model';

const DocumentMdyEditor = React.lazy(() =>
  import('./DocumentMdyEditor').then((module) => ({
    default: module.DocumentMdyEditor,
  }))
);

class DocumentEditorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface RichTextEsheetProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'onSubmit' | 'title'
> {
  /** Document sections and their memory aids. Optional when initialMdy carries one. */
  definition?: RichTextEsheetDefinition;
  /**
   * People or systems the document references — for example a patient and a
   * provider on a letter, or a reporter and a system on a support ticket.
   * Shown in the header, docked as insertable macros beside every narrative
   * section, and retained in the exported document's front matter.
   */
  parties?: RichTextEsheetParty[];
  /** Translate built-in labels and messages. */
  messages?: ComponentMessages;
  /** Loaded once per definition.id. Change the id to open another document. */
  initialResponses?: RichTextEsheetResponses;
  /** Portable MDY draft, loaded once per document id. Takes precedence over initialResponses. */
  initialMdy?: string;
  /** Initial surface; all modes share the same draft. */
  defaultMode?: RichTextEsheetMode;
  /** Every edit returns the same native eSheet responses. */
  onChange?: (document: RichTextEsheetSnapshot) => void;
  /** Host-owned persistence. Reject to keep the draft and show the failure. */
  onSubmit?: (document: RichTextEsheetSnapshot) => void | Promise<void>;
  /**
   * Lets every narrative section dock the capture ribbon (camera, screen,
   * document scan) in eSheet mode; each field's bar starts hidden behind the
   * block (+) menu's "Show capture bar". Requires `uploadHandler`: captures
   * must reference uploaded URLs, never embedded base64 bytes.
   */
  mediaCapture?: DocumentMediaCaptureOptions;
  readOnly?: boolean;
}

export interface RichTextEsheetHandle {
  getSnapshot: () => RichTextEsheetSnapshot;
  focusSection: (sectionId: string) => void;
  setMode: (mode: RichTextEsheetMode) => Promise<void>;
}

/**
 * A guided rich text document backed by a native eSheet: letters, support
 * tickets, any templated prose where an eSheet acts as the memory aid. Each
 * section is a narrative field with docked finding macros; parties (patient,
 * provider, reporter…) become insertable macros. The eSheet, RichEdit, View
 * and Export modes all share the same native draft. For clinical visit
 * documentation use EncounterVisit, which layers coded clinical sections on
 * the same foundations.
 */
export const RichTextEsheet = React.forwardRef<
  RichTextEsheetHandle,
  RichTextEsheetProps
>(function RichTextEsheet(
  { definition, parties, initialMdy, messages, ...props },
  ref
) {
  const parsed = React.useMemo(
    () =>
      initialMdy === undefined ? null : parseRichTextEsheetMdy(initialMdy),
    [initialMdy]
  );
  const loadErrors =
    parsed?.diagnostics.filter(
      (diagnostic) =>
        diagnostic.severity === 'error' && diagnostic.code !== 'dangling-link'
    ) ?? [];
  if (loadErrors.length > 0) {
    throw new Error(
      `Unable to load document MDY: ${loadErrors.map((diagnostic) => diagnostic.message).join(' ')}`
    );
  }
  const documentDefinition = definition ?? parsed?.definition;
  if (!documentDefinition) {
    throw new Error('Supply a definition to open this document.');
  }
  if (parsed?.definition && parsed.definition.id !== documentDefinition.id) {
    throw new Error(
      'The MDY document id does not match the supplied definition.'
    );
  }
  // A native eSheet MDY without richTextEsheet front matter still names its
  // form; foreign responses must not seed a session under another definition.
  if (parsed?.form && parsed.form.id !== documentDefinition.id) {
    throw new Error('The MDY form id does not match the supplied definition.');
  }
  const documentParties =
    parties ?? getRichTextEsheetMdyParties(parsed?.frontMatter ?? null);
  return (
    <MessagesProvider messages={messages}>
      <RichTextEsheetSession
        key={documentDefinition.id}
        {...props}
        initialMdy={initialMdy}
        definition={documentDefinition}
        parties={documentParties}
        ref={ref}
      />
    </MessagesProvider>
  );
});

function ensureFields(): void {
  registerEsheetSectionFieldType();
  registerEsheetNarrativeFieldType();
}

let esheetDefaultsSettled = false;

const RichTextEsheetSession = React.forwardRef<
  RichTextEsheetHandle,
  Omit<RichTextEsheetProps, 'messages'> & {
    definition: RichTextEsheetDefinition;
  }
>(function RichTextEsheetSession(
  {
    definition,
    parties,
    initialResponses,
    initialMdy,
    defaultMode = 'esheet',
    onChange,
    onSubmit,
    mediaCapture,
    readOnly = false,
    className,
    ...props
  },
  ref
) {
  ensureFields();
  // eSheet registers its stock field components once, inside the first
  // EsheetRenderer render — after ensureFields() in our render body —
  // clobbering the section override. The settling pass below re-asserts the
  // override pre-paint and remounts the renderer, so the plain section chrome
  // wins the first paint no matter when eSheet runs its default registration.
  const [fieldsSettled, setFieldsSettled] = React.useState(
    () => esheetDefaultsSettled
  );
  React.useLayoutEffect(() => {
    if (!esheetDefaultsSettled) {
      esheetDefaultsSettled = true;
      ensureFields();
    }
    setFieldsSettled(true);
  }, []);
  const m = useMessages();
  const media = useDocumentMediaCapture(mediaCapture);
  // Capture is an occasional attachment, not every section's primary input:
  // each field's bar starts hidden and the block (+) menu reveals it.
  const narrativeMedia = React.useMemo(
    () =>
      media.value ? { ...media.value, defaultCaptureBarVisible: false } : null,
    [media.value]
  );
  // Content identity prevents a host's inline config object from resetting answers.
  const configJson = JSON.stringify({ definition, parties });
  const stable = React.useMemo(
    () =>
      JSON.parse(configJson) as {
        definition: RichTextEsheetDefinition;
        parties?: RichTextEsheetParty[];
      },
    [configJson]
  );
  const form = React.useMemo(
    () => createRichTextEsheetFormDefinition(stable.definition, stable.parties),
    [stable]
  );
  const [initialSeed] = React.useState(() => {
    if (initialMdy === undefined) return initialResponses ?? {};
    const document = parseRichTextEsheetMdy(initialMdy);
    return {
      ...(document.response ?? {}),
      [RICHTEXT_ESHEET_DOCUMENT_FIELD_ID]:
        richTextEsheetDocumentResponse(initialMdy),
    };
  });
  const [snapshot, setSnapshot] = React.useState(() =>
    createRichTextEsheetSnapshot(stable.definition, initialSeed, stable.parties)
  );
  const [mode, setModeState] = React.useState<RichTextEsheetMode>(defaultMode);
  const [modePending, setModePending] = React.useState(false);
  const [pendingSection, setPendingSection] = React.useState<string | null>(
    null
  );
  const [resolverField, setResolverField] = React.useState<string | null>(null);
  const resolverTrap = React.useRef<HTMLDivElement>(null);
  const richEditor = React.useRef<RichEditorHandle>(null);
  const [showErrors, setShowErrors] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const submissionPending = React.useRef(false);
  const [saveMessage, setSaveMessage] = React.useState('');
  const renderer = React.useRef<EsheetRendererHandle>(null);
  const root = React.useRef<HTMLDivElement>(null);
  const unsubscribe = React.useRef<(() => void) | null>(null);
  const responses = React.useRef(initialSeed);
  const latest = React.useRef({
    stable,
    onChange,
    onSubmit,
    readOnly,
    saving,
    mode,
    m,
  });
  latest.current = { stable, onChange, onSubmit, readOnly, saving, mode, m };
  // Preserve answers when section configuration changes within this document.
  const rendererInput = React.useMemo(
    () => ({ definition: form, responses: responses.current }),
    [form]
  );
  // Until the user authors the document, RichEdit shows a generated skeleton.
  // Key it to the configuration, not the live snapshot: the always-mounted
  // editor reloads the whole document whenever `body` changes, which must not
  // happen for every keystroke in an eSheet field — answer-only updates reach
  // the editor through its `fields` projection refresh instead. A config
  // change still regenerates, so a mount-time seed never commits a stale body
  // missing newly added links on the first flush.
  const generatedBody = React.useMemo(
    () =>
      parseRichTextEsheetMdy(
        createRichTextEsheetSnapshot(
          stable.definition,
          responses.current,
          stable.parties
        ).mdy
      ).body,
    [stable]
  );
  const richBody =
    getRichTextEsheetDocumentBody(snapshot.responses) ?? generatedBody;

  const currentSnapshot = React.useCallback(() => {
    const { stable } = latest.current;
    return createRichTextEsheetSnapshot(
      stable.definition,
      renderer.current?.getRawResponse() ?? responses.current,
      stable.parties
    );
  }, []);

  const writeBody = React.useCallback((body: string) => {
    if (latest.current.readOnly || latest.current.saving) return;
    const store = renderer.current?.getFormStore();
    if (!store) return;
    const current = store.getState().responses;
    if (current[RICHTEXT_ESHEET_DOCUMENT_FIELD_ID]?.answer === body) return;
    const next = updateRichTextEsheetDocumentBody(current, body, {
      _ai: false,
    });
    store
      .getState()
      .setResponse(
        RICHTEXT_ESHEET_DOCUMENT_FIELD_ID,
        next[RICHTEXT_ESHEET_DOCUMENT_FIELD_ID]
      );
  }, []);

  const flushEditor = React.useCallback(async () => {
    // The editor stays mounted across modes but only authors the document
    // while rich mode is active; skip flushing its synced copy otherwise.
    if (
      richEditor.current &&
      latest.current.mode === 'rich' &&
      !latest.current.readOnly &&
      !latest.current.saving
    ) {
      const before =
        renderer.current?.getRawResponse()[RICHTEXT_ESHEET_DOCUMENT_FIELD_ID];
      const body = await richEditor.current.getContent();
      const after =
        renderer.current?.getRawResponse()[RICHTEXT_ESHEET_DOCUMENT_FIELD_ID];
      // A newer body commit owns the document if it arrived while Kerebron
      // was serializing. Native section writes do not change this key.
      if (after !== before && after?.answer !== before?.answer) return;
      writeBody(body);
    }
  }, [writeBody]);

  const setMode = React.useCallback(
    async (next: RichTextEsheetMode, sectionId?: string) => {
      if (!['esheet', 'rich', 'view', 'export'].includes(next)) return;
      setModePending(true);
      try {
        if (richEditor.current && latest.current.mode === 'rich')
          await flushEditor();
        setResolverField(null);
        if (sectionId !== undefined) setPendingSection(sectionId);
        setModeState(next);
      } catch (error) {
        setSaveMessage(
          error instanceof Error
            ? error.message
            : latest.current.m(
                'Unable to read the editor. Your draft is still here.'
              )
        );
      } finally {
        setModePending(false);
      }
    },
    [flushEditor]
  );

  const focusSection = React.useCallback(
    (sectionId: string) => {
      if (
        !latest.current.stable.definition.sections.some(
          (section) => section.id === sectionId
        )
      )
        return;
      void setMode('esheet', sectionId);
    },
    [setMode]
  );

  React.useLayoutEffect(() => {
    if (mode !== 'esheet' || pendingSection === null) return;
    // Compare attributes directly: ids can contain punctuation, so no CSS escaping is needed.
    const fieldId = getRichTextEsheetSectionFieldId(pendingSection);
    const section = Array.from(
      root.current?.querySelectorAll<HTMLElement>('[data-field-id]') ?? []
    ).find((element) => element.dataset.fieldId === fieldId);
    setPendingSection(null);
    if (!section) return;
    section.tabIndex = -1;
    // Sticky chrome above the form: the narrative toolbar.
    const chromeHeight = Array.from(
      root.current?.querySelectorAll<HTMLElement>(
        '.encounter-mdy-editor .kb-custom-menu'
      ) ?? []
    ).reduce(
      (total, element) => total + element.getBoundingClientRect().height,
      0
    );
    section.style.scrollMarginTop = `${chromeHeight + 8}px`;
    section.focus({ preventScroll: true });
    section.scrollIntoView?.({ block: 'start', behavior: 'auto' });
  }, [mode, pendingSection]);

  React.useImperativeHandle(
    ref,
    () => ({ getSnapshot: currentSnapshot, focusSection, setMode }),
    [currentSnapshot, focusSection, setMode]
  );

  const closeResolver = React.useCallback(() => {
    setResolverField(null);
  }, []);
  const lastResolverField = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (lastResolverField.current && !resolverField && mode === 'rich')
      richEditor.current?.focus();
    lastResolverField.current = resolverField;
  }, [resolverField, mode]);
  const activateResolver = React.useCallback(
    async (id: string) => {
      setModePending(true);
      try {
        await flushEditor();
        setResolverField(id);
      } catch (error) {
        setSaveMessage(
          error instanceof Error
            ? error.message
            : latest.current.m('Unable to read the editor.')
        );
      } finally {
        setModePending(false);
      }
    },
    [flushEditor]
  );
  // Nested modals portal to document.body, over the resolver: the capture
  // confirmation (alertdialog, ignores Escape by design) and the annotation
  // editor (dialog, refuses dismissal while saving). While one is open it
  // owns Escape and focus; acting on the resolver underneath would desync
  // Modal's scroll lock and strand the nested dialog over a hidden editor.
  const nestedDialog = React.useCallback(
    () =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="dialog"], [role="alertdialog"]'
        )
      ).find((dialog) => !resolverTrap.current?.contains(dialog)) ?? null,
    []
  );
  useEscapeKey(
    React.useCallback(() => {
      if (nestedDialog()) return;
      closeResolver();
    }, [closeResolver, nestedDialog]),
    resolverField !== null
  );

  React.useEffect(() => {
    const container = resolverTrap.current;
    if (!resolverField || !container) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex]:not([tabindex="-1"])'
        )
      ).filter(
        (element) =>
          element.getClientRects().length > 0 &&
          !element.closest('[hidden], [inert]')
      );
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        container.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          document.activeElement === container)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    // Dropdown portals its menus (and submenus) to document.body, so a Move
    // menu opened from resolver content lives outside the container. Follow
    // the aria-controls chain back to the trigger to keep those menus inside
    // the trap's focus scope for keyboard users.
    const inScope = (target: Element): boolean => {
      if (container.contains(target)) return true;
      // Nested modals (capture confirmation, annotation editor) portal to
      // document.body; they own focus while open — never yank it back.
      const dialog = target.closest('[role="alertdialog"], [role="dialog"]');
      if (dialog && !container.contains(dialog)) return true;
      const portal = target.closest<HTMLElement>(
        '[data-slot="dropdown-menu"], [data-slot="dropdown-submenu"]'
      );
      const menuId =
        portal?.getAttribute('role') === 'menu'
          ? portal.id
          : portal?.querySelector('[role="menu"]')?.id;
      if (!menuId) return false;
      const trigger = Array.from(
        document.querySelectorAll<HTMLElement>('[aria-controls]')
      ).find((element) => element.getAttribute('aria-controls') === menuId);
      return trigger ? inScope(trigger) : false;
    };
    const trapFocus = (event: FocusEvent) => {
      if (event.target instanceof Element && !inScope(event.target))
        (focusable()[0] ?? container).focus();
    };
    container.addEventListener('keydown', trapTab);
    document.addEventListener('focusin', trapFocus);
    return () => {
      container.removeEventListener('keydown', trapTab);
      document.removeEventListener('focusin', trapFocus);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, [resolverField]);

  const mdyFields = getRichTextEsheetMdyFields(snapshot);
  // A same-id definition can drop sections after the document was authored.
  // View/Export normalize those retired links through the engine's create
  // pass; the live editor needs the same projections so RichEdit shows
  // “Field no longer configured” too — protected, with prose/caret/undo
  // intact — instead of the stale, editable answer.
  const retiredMdyFields = React.useMemo(
    () => getRichTextEsheetRetiredMdyFields(snapshot),
    [snapshot]
  );
  const editorFields = [...mdyFields, ...retiredMdyFields];
  const resolvedField = mdyFields.find((field) => field.id === resolverField);
  const resolvedNativeFieldId = resolvedField?.fieldId;
  const resolvedSectionId = resolvedField?.sectionId;
  React.useEffect(() => {
    const sections = root.current?.querySelectorAll<HTMLElement>(
      '.section-field-preview'
    );
    sections?.forEach((element) => {
      const wrapper = element.closest<HTMLElement>('[data-field-id]');
      const focused =
        resolvedSectionId &&
        wrapper?.dataset.fieldId ===
          getRichTextEsheetSectionFieldId(resolvedSectionId);
      element.toggleAttribute('data-encounter-focus', Boolean(focused));
      wrapper?.toggleAttribute('data-encounter-focus', Boolean(focused));
    });
    if (!resolvedNativeFieldId) return;
    const wrapper = Array.from(
      root.current?.querySelectorAll<HTMLElement>('[data-field-id]') ?? []
    ).find((element) => element.dataset.fieldId === resolvedNativeFieldId);
    wrapper
      ?.querySelector<HTMLElement>('input, select, [role="textbox"], button')
      ?.focus();
  }, [resolvedNativeFieldId, resolvedSectionId]);

  const handleReady = React.useCallback(() => {
    const store = renderer.current?.getFormStore();
    if (!store) return;
    unsubscribe.current?.();
    const publish = () => {
      responses.current = store.getState().responses;
      const next = currentSnapshot();
      setSnapshot(next);
      latest.current.onChange?.(next);
    };
    unsubscribe.current = store.subscribe((state, previous) => {
      if (state.responses !== previous.responses) {
        setSaveMessage('');
        publish();
      }
    });
    publish();
  }, [currentSnapshot]);

  // Detach before eSheet's passive initialization effect reloads a changed
  // definition; hosts should see the complete restored draft, not intermediate seeds.
  React.useLayoutEffect(() => {
    unsubscribe.current?.();
    unsubscribe.current = null;
  }, [rendererInput]);
  React.useEffect(() => () => unsubscribe.current?.(), []);

  const submit = async () => {
    if (
      !latest.current.onSubmit ||
      latest.current.readOnly ||
      latest.current.saving ||
      submissionPending.current
    )
      return;
    submissionPending.current = true;
    try {
      try {
        if (richEditor.current && latest.current.mode === 'rich')
          await flushEditor();
      } catch (error) {
        setSaveMessage(
          error instanceof Error
            ? error.message
            : latest.current.m('Unable to read the editor.')
        );
        return;
      }
      // The flush awaited the editor; the host may have revoked submission,
      // switched to read-only or started another save in the meantime.
      if (
        !latest.current.onSubmit ||
        latest.current.readOnly ||
        latest.current.saving
      )
        return;
      const next = currentSnapshot();
      setShowErrors(true);
      if (next.errors.length > 0) {
        setSnapshot(next);
        setSaveMessage(m('Resolve the highlighted sections before saving.'));
        focusSection(next.errors[0].sectionId);
        return;
      }
      latest.current.saving = true;
      renderer.current?.getFormStore().getState().setReadOnly(true);
      setSaving(true);
      setSaveMessage('');
      try {
        await latest.current.onSubmit(next);
        setSaveMessage(latest.current.m('Document saved.'));
      } catch (error) {
        setSaveMessage(
          error instanceof Error
            ? error.message
            : latest.current.m(
                'Unable to save this document. Your draft is still here.'
              )
        );
      } finally {
        latest.current.saving = false;
        renderer.current
          ?.getFormStore()
          .getState()
          .setReadOnly(latest.current.readOnly);
        setSaving(false);
      }
    } finally {
      submissionPending.current = false;
    }
  };

  const componentId = React.useId();
  const resolverTitleId = `${componentId}-resolver-title`;

  return (
    <div
      {...props}
      ref={root}
      data-slot="richtext-esheet"
      className={cn(
        'richtext-esheet bg-background text-foreground min-w-0',
        className
      )}
    >
      <header
        inert={resolverField !== null}
        className="flex flex-wrap items-start justify-between gap-2 px-2 pt-3 pb-2 sm:px-3"
      >
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">
            {m(stable.definition.title)}
          </h2>
          {stable.parties && stable.parties.length > 0 && (
            <dl className="mt-1 space-y-0.5 text-sm">
              {stable.parties.map((party, index) => (
                <div key={index} className="flex flex-wrap gap-x-1.5">
                  <dt className="text-muted-foreground">{m(party.role)}</dt>
                  <dd dir="auto" className="break-words">
                    {party.name}
                    {party.detail && (
                      <span className="text-muted-foreground">
                        {' '}
                        ({party.detail})
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          <bdi>
            {m('{count} of {total} sections documented', {
              count: snapshot.documentedSections.length,
              total: stable.definition.sections.length,
            })}
          </bdi>
        </p>
      </header>

      <div
        data-slot="richtext-esheet-document"
        className="min-w-0 px-2 pt-2 pb-4 sm:px-3"
      >
        {/* Rides the narrative toolbar row: a zero-height sticky overlay so
            the switcher pins together with the toolbar while scrolling.
            Chrome class names are legacy-shared with EncounterVisit; both
            hosts style them in encounter-visit.css (mieweb/ui#758). */}
        <div
          inert={resolverField !== null}
          className="encounter-view-switch pointer-events-none sticky top-0 flex h-0 justify-start"
        >
          <Select
            aria-label={m('Document mode')}
            size="sm"
            className="pointer-events-auto ms-1 mt-1.5 w-28"
            value={mode}
            disabled={modePending || saving}
            options={[
              { value: 'esheet', label: m('eSheet') },
              { value: 'rich', label: m('RichEdit') },
              { value: 'view', label: m('View') },
              { value: 'export', label: m('Export') },
            ]}
            onValueChange={(value) => void setMode(value as RichTextEsheetMode)}
          />
        </div>
        {/* Always mounted: the narrative toolbar is the document's constant
            chrome. Outside RichEdit the document body is hidden and the bar
            empties to just the view switcher; the controls fade back in
            when RichEdit returns. */}
        <div
          inert={mode !== 'rich' || resolverField !== null}
          className={cn(
            'encounter-rich-chrome',
            mode !== 'rich' && 'encounter-rich-collapsed'
          )}
        >
          <DocumentEditorBoundary
            fallback={
              <p role="alert">
                {m(
                  'Rich editor is unavailable. Continue editing in eSheet or review this document in View.'
                )}
              </p>
            }
          >
            <React.Suspense
              fallback={<p role="status">{m('Loading rich editor…')}</p>}
            >
              <DocumentMdyEditor
                ref={richEditor}
                body={richBody}
                fieldIds={editorFields.map((field) => field.id)}
                fields={editorFields.map((field) => ({
                  id: field.id,
                  display: field.display,
                  label: field.label,
                }))}
                onChange={writeBody}
                onFieldActivate={(id) => {
                  // Retired links have no section to resolve; they stay
                  // protected, normalized prose.
                  if (!mdyFields.some((field) => field.id === id)) return;
                  void activateResolver(id);
                }}
                disabled={
                  readOnly ||
                  saving ||
                  mode !== 'rich' ||
                  resolverField !== null
                }
              />
            </React.Suspense>
          </DocumentEditorBoundary>
        </div>
        {showErrors && snapshot.errors.length > 0 && (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/5 mb-4 rounded-lg border p-3 text-sm"
          >
            <p className="font-semibold">{m('Sections need attention')}</p>
            <ul className="mt-2 space-y-1">
              {snapshot.errors.map((issue) => (
                <li key={issue.sectionId}>
                  <button
                    type="button"
                    className="text-destructive min-h-11 text-start underline underline-offset-2"
                    onClick={() => focusSection(issue.sectionId)}
                  >
                    {/* Stable template key; the host-authored title is a substitution. */}
                    {m('{section} is required.', {
                      section:
                        stable.definition.sections.find(
                          (section) => section.id === issue.sectionId
                        )?.title ?? issue.sectionId,
                    })}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {resolverField && (
          <div className="fixed inset-0 z-40 bg-black/50" aria-hidden="true" />
        )}
        <div
          ref={resolverTrap}
          hidden={mode !== 'esheet' && !resolverField}
          role={resolverField ? 'dialog' : undefined}
          aria-modal={resolverField ? true : undefined}
          aria-labelledby={resolverField ? resolverTitleId : undefined}
          tabIndex={resolverField ? -1 : undefined}
          className={cn(
            resolverField &&
              'encounter-focused bg-background fixed inset-0 z-50 overflow-y-auto px-2 pb-4 sm:inset-8 sm:rounded-lg sm:px-3'
          )}
        >
          {resolverField && (
            <div className="bg-background sticky top-0 z-20 flex items-center justify-between gap-2 py-2">
              <h3 id={resolverTitleId} className="font-semibold">
                {m(resolvedField?.label ?? 'Linked document section')}
              </h3>
              <Button
                type="button"
                variant="secondary"
                className="min-h-11"
                onClick={closeResolver}
              >
                {m('Done')}
              </Button>
            </div>
          )}
          <EsheetSectionContext.Provider value={true}>
            <EsheetNarrativeMediaContext.Provider value={narrativeMedia}>
              <EsheetRenderer
                key={fieldsSettled ? 'settled' : 'priming'}
                ref={renderer}
                formDataInput={rendererInput.definition}
                initialResponses={rendererInput.responses}
                onReady={handleReady}
                strict
                readOnly={readOnly || saving}
                fitToContainer
                topNavigation={false}
                bottomNavigation={false}
                className="richtext-esheet-renderer"
              />
            </EsheetNarrativeMediaContext.Provider>
          </EsheetSectionContext.Provider>
        </div>
        {mode === 'view' && (
          <DocumentMdyView
            source={snapshot.mdy}
            render={renderRichTextEsheetMdy}
          />
        )}
        {mode === 'export' && (
          <DocumentExportView
            source={snapshot.mdy}
            fileName={`${stable.definition.id}.md`}
          />
        )}
      </div>

      <footer
        inert={resolverField !== null}
        className="bg-background sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-3"
      >
        <p
          role="status"
          aria-live="polite"
          className="text-muted-foreground min-w-0 text-sm"
        >
          {saveMessage || (readOnly ? m('Read-only document') : '')}
        </p>
        {onSubmit && (
          <Button
            type="button"
            className="min-h-11"
            disabled={readOnly || saving || modePending}
            leftIcon={<Save size={16} aria-hidden="true" />}
            onClick={() => void submit()}
          >
            {m(saving ? 'Saving…' : 'Save document')}
          </Button>
        )}
      </footer>
      {media.dialog}
    </div>
  );
});
