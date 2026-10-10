'use client';

import * as React from 'react';
import { ClipboardList, FileText, Save, Stethoscope } from 'lucide-react';
import { EsheetRenderer, type EsheetRendererHandle } from '@esheet/renderer';
import { getFieldComponent } from '@esheet/fields';
import { cn } from '../../utils/cn';
import { registerMedicationListFieldType } from '../../esheet-fields/MedicationListField';
import { registerAllergyListFieldType } from '../../esheet-fields/AllergyListField';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
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
} from './types';

export interface EncounterVisitProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'onSubmit' | 'title'
> {
  /** Sections and their narrative / observation granularity. */
  definition?: EncounterVisitDefinition;
  /** Loaded once per definition.id. Change the id to open another visit. */
  initialResponses?: EncounterResponses;
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
>(function EncounterVisit(
  { definition = DEFAULT_ENCOUNTER_VISIT_DEFINITION, ...props },
  ref
) {
  return (
    <EncounterVisitSession
      key={definition.id}
      {...props}
      definition={definition}
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
  const [initialSeed] = React.useState(() => initialResponses ?? {});
  const [snapshot, setSnapshot] = React.useState(() =>
    createEncounterSnapshot(stableDefinition, initialSeed)
  );
  const [activeSection, setActiveSection] = React.useState(
    stableDefinition.sections[0].id
  );
  const [showNote, setShowNote] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
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

  const focusSection = React.useCallback((sectionId: string) => {
    if (
      !latest.current.definition.sections.some(
        (section) => section.id === sectionId
      )
    )
      return;
    setActiveSection(sectionId);
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
    }),
    [tools, focusSection]
  );

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
  };

  const documentedSections = snapshot.definition.sections.filter((section) =>
    getEncounterSectionFieldIds(section).some((fieldId) =>
      snapshot.observations.some(
        (observation) => observation.fieldId === fieldId
      )
    )
  );
  const componentId = React.useId();
  const reviewId = `${componentId}-review`;
  const selectId = `${componentId}-section`;

  return (
    <div
      {...props}
      ref={root}
      data-slot="encounter-visit"
      className={cn(
        'encounter-visit border-border bg-background text-foreground min-w-0 rounded-xl border',
        className
      )}
    >
      <header className="border-border flex flex-wrap items-start justify-between gap-4 border-b p-4 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-300 flex size-11 shrink-0 items-center justify-center rounded-xl">
            <Stethoscope size={22} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Anonymous patient · visit document
            </p>
            <h2 className="mt-1 text-xl font-semibold">
              {stableDefinition.title}
            </h2>
            {patientContext && (
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm break-words">
                {patientContext}
              </p>
            )}
          </div>
        </div>
        <p className="text-muted-foreground text-sm">
          {documentedSections.length} of {stableDefinition.sections.length}{' '}
          sections documented
        </p>
      </header>

      <div className="min-w-0 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav
          aria-label="Visit sections"
          className="border-border bg-background lg:bg-muted/30 sticky top-0 z-20 border-b p-3 lg:static lg:border-e lg:border-b-0 lg:p-4"
        >
          <div className="lg:sticky lg:top-4">
            <label
              htmlFor={selectId}
              className="text-muted-foreground mb-1 block text-xs font-semibold lg:hidden"
            >
              Go to section
            </label>
            <select
              id={selectId}
              className="border-border bg-background focus-visible:ring-primary-500 min-h-11 w-full rounded-lg border px-3 text-base focus-visible:ring-2 focus-visible:outline-none lg:hidden"
              value={activeSection}
              onChange={(event) => focusSection(event.target.value)}
            >
              {stableDefinition.sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
            <p className="text-muted-foreground mb-3 hidden items-center gap-2 text-xs font-semibold tracking-wider uppercase lg:flex">
              <ClipboardList size={14} aria-hidden="true" /> Visit sections
            </p>
            <ol className="hidden space-y-1 lg:block">
              {stableDefinition.sections.map((section, index) => {
                const documented = documentedSections.some(
                  (item) => item.id === section.id
                );
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      aria-current={
                        activeSection === section.id ? 'location' : undefined
                      }
                      onClick={() => focusSection(section.id)}
                      className={cn(
                        'focus-visible:ring-primary-500 flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-start text-sm focus-visible:ring-2 focus-visible:outline-none',
                        activeSection === section.id
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-200 font-semibold'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <span
                        className={cn(
                          'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs',
                          documented
                            ? 'border-primary-500 bg-primary-500 text-primary-foreground'
                            : 'border-border'
                        )}
                      >
                        {index + 1}
                      </span>
                      <span>{section.title}</span>
                      <span className="sr-only">
                        {documented ? ', documented' : ', not documented'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </nav>
        <div className="min-w-0 p-3 sm:p-6">
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
          {showNote && (
            <section
              id={reviewId}
              aria-label="Visit note preview"
              className="border-border bg-muted/30 mt-6 rounded-xl border p-4"
            >
              <h3 className="flex items-center gap-2 font-semibold">
                <FileText size={18} aria-hidden="true" /> Visit note preview
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                Includes documented entries. Unanswered findings remain blank.
              </p>
              <pre className="mt-4 font-sans text-sm leading-relaxed break-words whitespace-pre-wrap">
                {snapshot.note || 'No observations documented yet.'}
              </pre>
            </section>
          )}
        </div>
      </div>
      <footer className="border-border bg-background sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
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
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            aria-expanded={showNote}
            aria-controls={reviewId}
            leftIcon={<FileText size={16} aria-hidden="true" />}
            onClick={() => setShowNote((current) => !current)}
          >
            {showNote ? 'Hide note' : 'Review note'}
          </Button>
          {onSubmit && (
            <Button
              type="button"
              className="min-h-11"
              disabled={readOnly || saving}
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
