'use client';

import * as React from 'react';
import { Save } from 'lucide-react';
import { EsheetRenderer, type EsheetRendererHandle } from '@esheet/renderer';
import { getFieldComponent } from '@esheet/fields';
import { cn } from '../../utils/cn';
import { registerMedicationListFieldType } from '../../esheet-fields/MedicationListField';
import { registerAllergyListFieldType } from '../../esheet-fields/AllergyListField';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import type { RichEditorHandle } from '../RichEditor';
import { EncounterMdyView } from './EncounterMdyView';
import {
  ENCOUNTER_DOCUMENT_FIELD_ID,
  encounterDocumentResponse,
  getEncounterMdyFields,
  getEncounterDocumentBody,
  parseEncounterMdy,
  updateEncounterDocumentBody,
} from './mdy';
import {
  createEncounterFormDefinition,
  DEFAULT_ENCOUNTER_VISIT_DEFINITION,
  getEncounterSectionFieldId,
  getEncounterSectionFieldIds,
} from './definition';
import { registerEncounterFieldTypes } from './fields';
import { createEncounterSnapshot } from './model';
import { createEncounterVisitTools, type EncounterVisitTools } from './mcp';
import type {
  EncounterResponses,
  EncounterVisitDefinition,
  EncounterVisitSnapshot,
  EncounterVisitMode,
} from './types';

const EncounterMdyEditor = React.lazy(() =>
  import('./EncounterMdyEditor').then((module) => ({
    default: module.EncounterMdyEditor,
  }))
);

export interface EncounterVisitProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'onSubmit' | 'title'
> {
  /** Sections and their narrative / observation granularity. */
  definition?: EncounterVisitDefinition;
  /** Loaded once per definition.id. Change the id to open another visit. */
  initialResponses?: EncounterResponses;
  /** Portable MDY draft, loaded once per visit id. Takes precedence over initialResponses. */
  initialMdy?: string;
  /** Initial surface; all three modes share the same draft. */
  defaultMode?: EncounterVisitMode;
  /** Anonymous context, for example “45 yo male with pre-diabetes, back pain and hypertension”. */
  patientContext?: string;
  /** Every edit, including MCP edits, returns the same native eSheet responses. */
  onChange?: (visit: EncounterVisitSnapshot) => void;
  /** Host-owned persistence. Reject to keep the draft and show the failure. */
  onSubmit?: (visit: EncounterVisitSnapshot) => void | Promise<void>;
  /** Connect these tools to the host's MCP transport / agent runtime. */
  onToolsReady?: (tools: EncounterVisitTools) => void;
  readOnly?: boolean;
}

export interface EncounterVisitHandle {
  getSnapshot: () => EncounterVisitSnapshot;
  getTools: () => EncounterVisitTools;
  focusSection: (sectionId: string) => void;
  setMode: (mode: EncounterVisitMode) => Promise<void>;
}

function ensureFields(): void {
  registerEncounterFieldTypes();
  // Respect a host's earlier registration, including its CodeLookup wiring.
  if (!getFieldComponent('medicationList')) registerMedicationListFieldType();
  if (!getFieldComponent('allergyList')) registerAllergyListFieldType();
}

/** A configurable visit document, backed by a single native eSheet renderer. */
export const EncounterVisit = React.forwardRef<
  EncounterVisitHandle,
  EncounterVisitProps
>(function EncounterVisit({ definition, initialMdy, ...props }, ref) {
  const parsed = React.useMemo(
    () => (initialMdy === undefined ? null : parseEncounterMdy(initialMdy)),
    [initialMdy]
  );
  const visitDefinition =
    definition ?? parsed?.definition ?? DEFAULT_ENCOUNTER_VISIT_DEFINITION;
  const loadErrors =
    parsed?.diagnostics.filter(
      (diagnostic) =>
        diagnostic.severity === 'error' && diagnostic.code !== 'dangling-link'
    ) ?? [];
  if (loadErrors.length > 0) {
    throw new Error(
      `Unable to load encounter MDY: ${loadErrors.map((diagnostic) => diagnostic.message).join(' ')}`
    );
  }
  if (parsed && !parsed.definition && !definition) {
    throw new Error(
      'Supply an encounter definition to open a native eSheet MDY without encounterDefinition.'
    );
  }
  if (parsed?.definition && parsed.definition.id !== visitDefinition.id) {
    throw new Error('The MDY visit id does not match the supplied definition.');
  }
  if (parsed?.form && parsed.form.id !== visitDefinition.id) {
    throw new Error('The MDY form id does not match the encounter definition.');
  }
  if (parsed?.form && !parsed.definition) {
    const fieldIds = (
      form: ReturnType<typeof createEncounterFormDefinition>
    ) => {
      const ids: string[] = [];
      const visitFields = (fields: (typeof form.pages)[number]['fields']) =>
        fields?.forEach((field) => {
          ids.push(field.id);
          if ('fields' in field) visitFields(field.fields);
        });
      form.pages.forEach((page) => visitFields(page.fields));
      return ids.sort().join('\n');
    };
    if (
      fieldIds(parsed.form) !==
      fieldIds(createEncounterFormDefinition(visitDefinition))
    ) {
      throw new Error(
        'The MDY fields do not match the supplied encounter definition.'
      );
    }
  }
  return (
    <EncounterVisitSession
      key={visitDefinition.id}
      {...props}
      initialMdy={initialMdy}
      definition={visitDefinition}
      ref={ref}
    />
  );
});

const EncounterVisitSession = React.forwardRef<
  EncounterVisitHandle,
  EncounterVisitProps & { definition: EncounterVisitDefinition }
>(function EncounterVisitSession(
  {
    definition,
    initialResponses,
    initialMdy,
    defaultMode = 'esheet',
    patientContext,
    onChange,
    onSubmit,
    onToolsReady,
    readOnly = false,
    className,
    ...props
  },
  ref
) {
  ensureFields();
  // Content identity prevents a host's inline config object from resetting answers.
  const definitionJson = JSON.stringify(definition);
  const stableDefinition = React.useMemo(
    () => JSON.parse(definitionJson) as EncounterVisitDefinition,
    [definitionJson]
  );
  const form = React.useMemo(
    () => createEncounterFormDefinition(stableDefinition),
    [stableDefinition]
  );
  const [initialSeed] = React.useState(() => {
    if (initialMdy === undefined) return initialResponses ?? {};
    const document = parseEncounterMdy(initialMdy);
    return {
      ...(document.response ?? {}),
      [ENCOUNTER_DOCUMENT_FIELD_ID]: encounterDocumentResponse(initialMdy),
    };
  });
  const [snapshot, setSnapshot] = React.useState(() =>
    createEncounterSnapshot(stableDefinition, initialSeed)
  );
  const [richBodySeed] = React.useState(
    () => parseEncounterMdy(snapshot.mdy).body
  );
  const [activeSection, setActiveSection] = React.useState(
    stableDefinition.sections[0].id
  );
  const [mode, setModeState] = React.useState<EncounterVisitMode>(defaultMode);
  const [richMounted, setRichMounted] = React.useState(defaultMode === 'rich');
  const [modePending, setModePending] = React.useState(false);
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
  const latest = React.useRef({
    definition: stableDefinition,
    onChange,
    onSubmit,
    readOnly,
    saving,
  });
  latest.current = {
    definition: stableDefinition,
    onChange,
    onSubmit,
    readOnly,
    saving,
  };
  const responses = React.useRef(initialSeed);
  // Preserve answers when section configuration changes within this visit.
  const rendererInput = React.useMemo(
    () => ({ definition: form, responses: responses.current }),
    [form]
  );

  const writeBody = React.useCallback((body: string) => {
    if (latest.current.readOnly || latest.current.saving) return;
    const store = renderer.current?.getFormStore();
    if (!store) return;
    const current = store.getState().responses;
    if (current[ENCOUNTER_DOCUMENT_FIELD_ID]?.answer === body) return;
    const next = updateEncounterDocumentBody(current, body, { _ai: false });
    store
      .getState()
      .setResponse(
        ENCOUNTER_DOCUMENT_FIELD_ID,
        next[ENCOUNTER_DOCUMENT_FIELD_ID]
      );
  }, []);

  const flushEditor = React.useCallback(async () => {
    if (
      richEditor.current &&
      !latest.current.readOnly &&
      !latest.current.saving
    ) {
      const before =
        renderer.current?.getRawResponse()[ENCOUNTER_DOCUMENT_FIELD_ID];
      const body = await richEditor.current.getContent();
      const after =
        renderer.current?.getRawResponse()[ENCOUNTER_DOCUMENT_FIELD_ID];
      // A newer body commit (including MCP) owns the document if it arrived
      // while Kerebron was serializing. Clinical writes do not change this key.
      if (after !== before && after?.answer !== before?.answer) return;
      writeBody(body);
    }
  }, [writeBody]);

  const setMode = React.useCallback(
    async (next: EncounterVisitMode) => {
      if (!['esheet', 'rich', 'view'].includes(next)) return;
      setModePending(true);
      try {
        await flushEditor();
        setResolverField(null);
        if (next === 'rich') setRichMounted(true);
        setModeState(next);
      } catch (error) {
        setSaveMessage(
          error instanceof Error
            ? error.message
            : 'Unable to read the editor. Your draft is still here.'
        );
      } finally {
        setModePending(false);
      }
    },
    [flushEditor]
  );

  const focusSection = React.useCallback((sectionId: string) => {
    if (
      !latest.current.definition.sections.some(
        (section) => section.id === sectionId
      )
    )
      return;
    setActiveSection(sectionId);
    setResolverField(null);
    setModeState('esheet');
    // Compare attributes directly: ids can contain punctuation, so no CSS escaping is needed.
    const fieldId = getEncounterSectionFieldId(sectionId);
    const section = Array.from(
      root.current?.querySelectorAll<HTMLElement>('[data-field-id]') ?? []
    ).find((element) => element.dataset.fieldId === fieldId);
    if (!section) return;
    const toggle = section.querySelector<HTMLButtonElement>(
      'button[aria-expanded="false"]'
    );
    toggle?.click();
    section.tabIndex = -1;
    section.style.scrollMarginTop = '6rem';
    section.focus({ preventScroll: true });
    section.scrollIntoView?.({ block: 'start', behavior: 'auto' });
  }, []);

  const [tools] = React.useState(() =>
    createEncounterVisitTools({
      getDefinition: () => latest.current.definition,
      getResponses: () => {
        if (!renderer.current) throw new Error('Visit renderer is not ready.');
        return renderer.current.getRawResponse();
      },
      setResponses: (next) => {
        if (!renderer.current) throw new Error('Visit renderer is not ready.');
        const store = renderer.current.getFormStore();
        for (const [fieldId, value] of Object.entries(next)) {
          if (
            JSON.stringify(store.getState().responses[fieldId]) !==
            JSON.stringify(value)
          ) {
            store.getState().setResponse(fieldId, value);
          }
        }
      },
      isReadOnly: () => latest.current.readOnly || latest.current.saving,
      navigateToSection: focusSection,
    })
  );

  React.useImperativeHandle(
    ref,
    () => ({
      getSnapshot: () =>
        createEncounterSnapshot(
          latest.current.definition,
          renderer.current?.getRawResponse() ?? responses.current
        ),
      getTools: () => tools,
      focusSection,
      setMode,
    }),
    [tools, focusSection, setMode]
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
          error instanceof Error ? error.message : 'Unable to read the editor.'
        );
      } finally {
        setModePending(false);
      }
    },
    [flushEditor]
  );
  useEscapeKey(closeResolver, resolverField !== null);

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
    const trapFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !container.contains(event.target))
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

  const mdyFields = getEncounterMdyFields(snapshot);
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
          getEncounterSectionFieldId(resolvedSectionId);
      element.toggleAttribute('data-encounter-focus', Boolean(focused));
      wrapper?.toggleAttribute('data-encounter-focus', Boolean(focused));
    });
    if (!resolvedNativeFieldId) return;
    const wrapper = Array.from(
      root.current?.querySelectorAll<HTMLElement>('[data-field-id]') ?? []
    ).find((element) => element.dataset.fieldId === resolvedNativeFieldId);
    const section = Array.from(sections ?? []).find((element) =>
      element.hasAttribute('data-encounter-focus')
    );
    section
      ?.querySelector<HTMLButtonElement>('button[aria-expanded="false"]')
      ?.click();
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
      const next = createEncounterSnapshot(
        latest.current.definition,
        responses.current
      );
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
  }, []);

  // Detach before eSheet's passive initialization effect reloads a changed
  // definition; hosts should see the complete restored draft, not intermediate seeds.
  React.useLayoutEffect(() => {
    unsubscribe.current?.();
    unsubscribe.current = null;
  }, [rendererInput]);

  React.useEffect(() => {
    onToolsReady?.(tools);
  }, [onToolsReady, tools]);
  React.useEffect(() => () => unsubscribe.current?.(), []);
  React.useEffect(() => {
    if (
      !stableDefinition.sections.some((section) => section.id === activeSection)
    ) {
      setActiveSection(stableDefinition.sections[0].id);
    }
  }, [stableDefinition, activeSection]);

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
        if (richEditor.current) await flushEditor();
      } catch (error) {
        setSaveMessage(
          error instanceof Error ? error.message : 'Unable to read the editor.'
        );
        return;
      }
      if (
        !latest.current.onSubmit ||
        latest.current.readOnly ||
        latest.current.saving
      )
        return;
      const next = createEncounterSnapshot(
        latest.current.definition,
        renderer.current?.getRawResponse() ?? responses.current
      );
      setShowErrors(true);
      if (next.errors.length > 0) {
        setSnapshot(next);
        setSaveMessage('Resolve the highlighted entries before saving.');
        focusSection(next.errors[0].sectionId);
        return;
      }
      latest.current.saving = true;
      renderer.current?.getFormStore().getState().setReadOnly(true);
      setSaving(true);
      setSaveMessage('');
      try {
        await latest.current.onSubmit(next);
        setSaveMessage('Visit saved.');
      } catch (error) {
        setSaveMessage(
          error instanceof Error
            ? error.message
            : 'Unable to save this visit. Your draft is still here.'
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

  const documentedSections = snapshot.definition.sections.filter((section) =>
    getEncounterSectionFieldIds(section).some((fieldId) =>
      snapshot.observations.some(
        (observation) => observation.fieldId === fieldId
      )
    )
  );
  const componentId = React.useId();
  const panelId = `${componentId}-document`;
  const resolverTitleId = `${componentId}-resolver-title`;
  const selectId = `${componentId}-section`;

  return (
    <div
      {...props}
      ref={root}
      data-slot="encounter-visit"
      className={cn(
        'encounter-visit bg-background text-foreground min-w-0',
        className
      )}
    >
      <header
        inert={resolverField !== null}
        className="flex flex-wrap items-start justify-between gap-2 px-2 pt-3 pb-2 sm:px-3"
      >
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">Anonymous patient</p>
          <h2 className="text-lg font-semibold">{stableDefinition.title}</h2>
          {patientContext && (
            <p
              dir="auto"
              className="text-muted-foreground mt-1 text-sm break-words"
            >
              {patientContext}
            </p>
          )}
        </div>
        <p className="text-muted-foreground text-xs">
          <bdi>
            {documentedSections.length} of {stableDefinition.sections.length}{' '}
            sections documented
          </bdi>
        </p>
      </header>

      <div className="min-w-0">
        <div
          inert={resolverField !== null}
          className="encounter-mode-bar bg-background sticky top-0 z-20 px-2 sm:px-3"
        >
          <div
            role="tablist"
            tabIndex={-1}
            aria-label="Visit mode"
            className="grid grid-cols-3 gap-1"
            onKeyDown={(event) => {
              const modes: EncounterVisitMode[] = ['esheet', 'rich', 'view'];
              const current = modes.indexOf(mode);
              const rtl =
                getComputedStyle(event.currentTarget).direction === 'rtl';
              const delta =
                event.key === 'ArrowRight'
                  ? rtl
                    ? -1
                    : 1
                  : event.key === 'ArrowLeft'
                    ? rtl
                      ? 1
                      : -1
                    : 0;
              const index =
                event.key === 'Home'
                  ? 0
                  : event.key === 'End'
                    ? 2
                    : delta
                      ? (current + delta + 3) % 3
                      : -1;
              if (index < 0 || modePending) return;
              event.preventDefault();
              const tabs = event.currentTarget;
              void setMode(modes[index]).then(() =>
                tabs
                  .querySelectorAll<HTMLButtonElement>('[role="tab"]')
                  .item(index)
                  ?.focus()
              );
            }}
          >
            {(['esheet', 'rich', 'view'] as const).map((value) => (
              <button
                key={value}
                id={`${componentId}-${value}`}
                type="button"
                role="tab"
                aria-selected={mode === value}
                aria-controls={panelId}
                tabIndex={mode === value ? 0 : -1}
                disabled={modePending || saving}
                className={cn(
                  'focus-visible:ring-primary-500 min-h-11 rounded px-2 text-base focus-visible:ring-2 focus-visible:outline-none',
                  mode === value
                    ? 'bg-muted font-semibold'
                    : 'text-muted-foreground'
                )}
                onClick={() => void setMode(value)}
              >
                {value === 'esheet'
                  ? 'eSheet'
                  : value === 'rich'
                    ? 'RichEdit'
                    : 'View'}
              </button>
            ))}
          </div>
        </div>
        <nav
          hidden={mode !== 'esheet'}
          inert={resolverField !== null}
          aria-label="Visit sections"
          className="bg-background sticky top-11 z-20 px-2 py-1 sm:px-3"
        >
          <div className="flex items-center gap-2">
            <label
              htmlFor={selectId}
              className="text-muted-foreground shrink-0 text-sm"
            >
              Go to section
            </label>
            <select
              id={selectId}
              className="bg-background focus-visible:ring-primary-500 min-h-11 min-w-0 flex-1 rounded px-1 text-base focus-visible:ring-2 focus-visible:outline-none"
              value={activeSection}
              onChange={(event) => focusSection(event.target.value)}
            >
              {stableDefinition.sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          </div>
        </nav>
        <div
          id={panelId}
          role="tabpanel"
          aria-labelledby={`${componentId}-${mode}`}
          data-slot="encounter-visit-document"
          className="min-w-0 px-2 pt-2 pb-4 sm:px-3"
        >
          {showErrors && snapshot.errors.length > 0 && (
            <div
              role="alert"
              className="border-destructive/40 bg-destructive/5 mb-4 rounded-lg border p-3 text-sm"
            >
              <p className="font-semibold">Entries need attention</p>
              <ul className="mt-2 space-y-1">
                {snapshot.errors.map((issue, index) => (
                  <li key={`${issue.fieldId}-${index}`}>
                    <button
                      type="button"
                      className="text-destructive min-h-11 text-start underline underline-offset-2"
                      onClick={() => focusSection(issue.sectionId)}
                    >
                      {issue.message}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {resolverField && (
            <div
              className="fixed inset-0 z-40 bg-black/50"
              aria-hidden="true"
            />
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
                  {resolvedField?.label ?? 'Linked visit field'}
                </h3>
                <Button
                  type="button"
                  variant="secondary"
                  className="min-h-11"
                  onClick={closeResolver}
                >
                  Done
                </Button>
              </div>
            )}
            <EsheetRenderer
              ref={renderer}
              formDataInput={rendererInput.definition}
              initialResponses={rendererInput.responses}
              onReady={handleReady}
              strict
              touchMode
              readOnly={readOnly || saving}
              fitToContainer
              topNavigation={false}
              bottomNavigation={false}
              className="encounter-visit-renderer"
            />
          </div>
          {richMounted && (
            <div hidden={mode !== 'rich'} inert={resolverField !== null}>
              <p className="text-muted-foreground mb-2 text-sm">
                Write headings and free text. Select a linked value to edit its
                eSheet data.
              </p>
              <React.Suspense
                fallback={<p role="status">Loading rich editor…</p>}
              >
                <EncounterMdyEditor
                  ref={richEditor}
                  body={
                    getEncounterDocumentBody(snapshot.responses) ?? richBodySeed
                  }
                  fieldIds={mdyFields.map((field) => field.id)}
                  fields={mdyFields.map((field) => ({
                    id: field.id,
                    display: field.display,
                    label: field.label,
                  }))}
                  onChange={writeBody}
                  onFieldActivate={(id) => void activateResolver(id)}
                  disabled={
                    readOnly ||
                    saving ||
                    mode !== 'rich' ||
                    resolverField !== null
                  }
                />
              </React.Suspense>
            </div>
          )}
          {mode === 'view' && <EncounterMdyView source={snapshot.mdy} />}
        </div>
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
          {saveMessage ||
            (readOnly
              ? 'Read-only visit'
              : `${snapshot.observations.length} observations documented`)}
        </p>
        <ButtonGroup className="w-full sm:w-auto">
          {onSubmit && (
            <Button
              type="button"
              className="min-h-11"
              disabled={readOnly || saving || modePending}
              leftIcon={<Save size={16} aria-hidden="true" />}
              onClick={() => void submit()}
            >
              {saving ? 'Saving…' : 'Save visit'}
            </Button>
          )}
        </ButtonGroup>
      </footer>
    </div>
  );
});
