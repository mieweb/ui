'use client';

import * as React from 'react';
import { Save } from 'lucide-react';
import { EsheetRenderer, type EsheetRendererHandle } from '@esheet/renderer';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import {
  MessagesProvider,
  useMessages,
  type ComponentMessages,
} from '../../utils/messages';
import { registerEsheetNarrativeFieldType } from '../../esheet-fields/EsheetNarrativeField';
import {
  EsheetSectionContext,
  registerEsheetSectionFieldType,
} from '../../esheet-fields/EsheetSectionField';
import {
  createRichTextEsheetFormDefinition,
  createRichTextEsheetSnapshot,
  getRichTextEsheetSectionFieldId,
  type RichTextEsheetDefinition,
  type RichTextEsheetParty,
  type RichTextEsheetResponses,
  type RichTextEsheetSnapshot,
} from './definition';

export interface RichTextEsheetProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onChange' | 'onSubmit' | 'title'
> {
  /** Document sections and their memory aids. */
  definition: RichTextEsheetDefinition;
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
  /** Every edit returns the same native eSheet responses. */
  onChange?: (document: RichTextEsheetSnapshot) => void;
  /** Host-owned persistence. Reject to keep the draft and show the failure. */
  onSubmit?: (document: RichTextEsheetSnapshot) => void | Promise<void>;
  readOnly?: boolean;
}

export interface RichTextEsheetHandle {
  getSnapshot: () => RichTextEsheetSnapshot;
  focusSection: (sectionId: string) => void;
}

/**
 * A guided rich text document backed by a native eSheet: letters, support
 * tickets, any templated prose where an eSheet acts as the memory aid. Each
 * section is a narrative field with docked finding macros; parties (patient,
 * provider, reporter…) become insertable macros. For clinical visit
 * documentation use EncounterVisit, which layers coded clinical sections on
 * the same foundations.
 */
export const RichTextEsheet = React.forwardRef<
  RichTextEsheetHandle,
  RichTextEsheetProps
>(function RichTextEsheet({ messages, ...props }, ref) {
  return (
    <MessagesProvider messages={messages}>
      <RichTextEsheetSession key={props.definition.id} {...props} ref={ref} />
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
  Omit<RichTextEsheetProps, 'messages'>
>(function RichTextEsheetSession(
  {
    definition,
    parties,
    initialResponses,
    onChange,
    onSubmit,
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
  const [initialSeed] = React.useState(() => initialResponses ?? {});
  const [snapshot, setSnapshot] = React.useState(() =>
    createRichTextEsheetSnapshot(stable.definition, initialSeed, stable.parties)
  );
  const [showErrors, setShowErrors] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const submissionPending = React.useRef(false);
  const [saveMessage, setSaveMessage] = React.useState('');
  const renderer = React.useRef<EsheetRendererHandle>(null);
  const root = React.useRef<HTMLDivElement>(null);
  const unsubscribe = React.useRef<(() => void) | null>(null);
  const responses = React.useRef(initialSeed);
  const latest = React.useRef({ stable, onChange, onSubmit, readOnly, m });
  latest.current = { stable, onChange, onSubmit, readOnly, m };
  // Preserve answers when section configuration changes within this document.
  const rendererInput = React.useMemo(
    () => ({ definition: form, responses: responses.current }),
    [form]
  );

  const currentSnapshot = React.useCallback(() => {
    const { stable } = latest.current;
    return createRichTextEsheetSnapshot(
      stable.definition,
      renderer.current?.getRawResponse() ?? responses.current,
      stable.parties
    );
  }, []);

  const focusSection = React.useCallback((sectionId: string) => {
    // Compare attributes directly: ids can contain punctuation, so no CSS escaping is needed.
    const fieldId = getRichTextEsheetSectionFieldId(sectionId);
    const section = Array.from(
      root.current?.querySelectorAll<HTMLElement>('[data-field-id]') ?? []
    ).find((element) => element.dataset.fieldId === fieldId);
    if (!section) return;
    section.tabIndex = -1;
    section.focus({ preventScroll: true });
    section.scrollIntoView?.({ block: 'start', behavior: 'auto' });
  }, []);

  React.useImperativeHandle(
    ref,
    () => ({ getSnapshot: currentSnapshot, focusSection }),
    [currentSnapshot, focusSection]
  );

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
    const context = latest.current;
    if (
      !context.onSubmit ||
      context.readOnly ||
      saving ||
      submissionPending.current
    )
      return;
    submissionPending.current = true;
    try {
      const next = currentSnapshot();
      setShowErrors(true);
      if (next.errors.length > 0) {
        setSnapshot(next);
        setSaveMessage(m('Resolve the highlighted sections before saving.'));
        focusSection(next.errors[0].sectionId);
        return;
      }
      renderer.current?.getFormStore().getState().setReadOnly(true);
      setSaving(true);
      setSaveMessage('');
      try {
        await context.onSubmit(next);
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
      <header className="flex flex-wrap items-start justify-between gap-2 px-2 pt-3 pb-2 sm:px-3">
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
                    {m(issue.message)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        <EsheetSectionContext.Provider value={true}>
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
        </EsheetSectionContext.Provider>
      </div>

      <footer className="bg-background sticky bottom-0 z-10 flex flex-wrap items-center justify-between gap-2 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-3">
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
            disabled={readOnly || saving}
            leftIcon={<Save size={16} aria-hidden="true" />}
            onClick={() => void submit()}
          >
            {m(saving ? 'Saving…' : 'Save document')}
          </Button>
        )}
      </footer>
    </div>
  );
});
