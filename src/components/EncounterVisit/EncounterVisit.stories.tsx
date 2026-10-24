import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { EncounterVisit, type EncounterVisitProps } from './EncounterVisit';
import {
  DEFAULT_ENCOUNTER_VISIT_DEFINITION,
  EXAMPLE_ENCOUNTER_VISIT_RESPONSES,
} from './definition';
import { executeEncounterVisitToolCall, type EncounterVisitTools } from './mcp';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import type { CodeLookupProps } from '../CodeLookup/CodeLookup';
import type { CodifyResult } from '../CodeLookup/engine';

const PATIENT_CONTEXT =
  '45 yo male with pre-diabetes, back pain and hypertension';

// Story-only selections reuse clinical component examples. The peanut substance
// is also documented in SNOMED's Allergy Implementation Guide:
// https://docs.snomed.org/implementation-guides/allergy-implementation-guide/4-information-model-and-terminology-binding/4.3-examples
// Production hosts inject their actual terminology catalog.
const SAMPLE_CATALOG: CodifyResult[] = [
  {
    fullid: 'FDB244899',
    label: 'lisinopril 10 mg tablet',
    codetype: 'FDB',
    fullcode: '244899',
    domain: 'med',
    score: 1,
    viaAlias: false,
  },
  {
    fullid: 'ICD10|I10',
    label: 'Essential hypertension',
    codetype: 'ICD10',
    fullcode: 'I10',
    domain: 'condition',
    score: 1,
    viaAlias: false,
  },
  {
    fullid: 'LOINC|4548-4',
    label: 'Hemoglobin A1c',
    codetype: 'LOINC',
    fullcode: '4548-4',
    domain: 'lab',
    score: 1,
    viaAlias: false,
  },
  {
    fullid: 'HCPCS|92551',
    label: 'Pure tone hearing test, air',
    codetype: 'HCPCS',
    fullcode: '92551',
    domain: 'procedure',
    score: 1,
    viaAlias: false,
  },
  {
    fullid: 'SNOMED US|762952008',
    label: 'Peanut substance',
    codetype: 'SNOMED US',
    fullcode: '762952008',
    domain: 'condition',
    score: 1,
    viaAlias: false,
  },
];

/** Small deterministic Storybook catalog, never imported by the component. */
function SampleCatalog({
  domains,
  searchDomains,
  searchCodetypes,
  placeholder,
  initialQuery,
  clearOnSelect,
  onSelect,
  onFreeText,
  'aria-label': ariaLabel,
}: CodeLookupProps): React.JSX.Element {
  const [query, setQuery] = React.useState(initialQuery ?? '');
  const allowedDomains = searchDomains ?? domains;
  const matches = query.trim()
    ? SAMPLE_CATALOG.filter(
        (result) =>
          (!allowedDomains ||
            allowedDomains.some((domain) => domain === result.domain)) &&
          (!searchCodetypes || searchCodetypes.includes(result.codetype)) &&
          `${result.label} ${result.fullcode}`
            .toLowerCase()
            .includes(query.trim().toLowerCase())
      )
    : [];
  const select = (result: CodifyResult) => {
    onSelect?.(result);
    setQuery(clearOnSelect === false ? result.label : '');
  };
  return (
    <div className="min-w-0 space-y-1" data-slot="sample-clinical-catalog">
      <input
        type="search"
        aria-label={
          ariaLabel ?? placeholder ?? 'Search sample clinical catalog'
        }
        placeholder={placeholder}
        value={query}
        className="border-input bg-background min-h-11 w-full min-w-0 rounded border px-2 text-base"
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && matches[0]) {
            event.preventDefault();
            select(matches[0]);
          }
        }}
      />
      {matches.map((result) => (
        <Button
          key={result.fullid}
          type="button"
          variant="secondary"
          className="min-h-11 w-full justify-start text-start whitespace-normal"
          aria-label={`Select ${result.label} (${result.codetype} ${result.fullcode})`}
          onClick={() => select(result)}
        >
          {result.label} · {result.codetype} {result.fullcode}
        </Button>
      ))}
      {query.trim() && !matches.length && (
        <p className="text-muted-foreground text-xs" role="status">
          No match in this small Storybook sample catalog.
        </p>
      )}
      {onFreeText && query.trim() && (
        <Button type="button" onClick={() => onFreeText(query.trim())}>
          Use uncoded free text
        </Button>
      )}
    </div>
  );
}

const meta: Meta<typeof EncounterVisit> = {
  id: 'encounter-orders-encountervisit',
  title: 'Healthcare/Encounter & orders/EncounterVisit',
  component: EncounterVisit,
  tags: ['autodocs', 'scope:domain-specific', 'maturity:experimental'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `### What it's for

A mobile-friendly encounter document backed by one **eSheet** response store. Configure major sections as narrative, individual observations, repeatable vitals, medication reconciliation, allergies, coded conditions, assessment and coded plan orders. HPI is one narrative observation; physical examination can be one narrative, body-system observations, or both. Patient history, review of systems, a plan narrative and follow-up / appointment details are included in the default eleven-section template. Patient identity is not captured.

MedicationReconciliation, AllergyManager, ProblemList and Assessment supply the healthcare capture controls. New medications, allergens, conditions and plan orders require a selected terminology code. Common findings sit under each narrative field as always-visible chips for one-click selection; unselecting a chip removes its line. Explicit selections append to narrative text without replacing authored content or auto-recording normal findings. The examples use a small, **Storybook-only sample catalog** with representative code selections. Production applications supply their real CodeLookup component and catalog URL through \`codeLookup\` or an enclosing \`CodeLookupProvider\`. Non-drug allergens require SNOMED substance concepts in the host catalog; these are never inferred from names.

The visit mode dropdown at the start of the always-visible narrative toolbar switches one draft between three projections: **eSheet** offers memory aids and coded capture, **RichEdit** uses Kerebron for headings and free Markdown prose with protected data links, and **View** renders the flattened MDY through mieweb/templit for a final report check. View omits uncaptured field prompts and empty section headings, while retaining authored prose and entered values such as zero or a negative choice. Select a linked value in RichEdit to open its eSheet section with related inputs. Changes update every projection of that field. Free prose stays in the document body; it is not automatically promoted to a coded observation.

The visit reads as a continuous report with small outer insets and no nested section cards. Narrative inputs and the document editor grow with their content. A compact sticky section selector is available in eSheet on desktop and phone.

### Use it when

- You want to document a whole visit with the same response data available to a clinician and an MCP agent.
- Your application owns storage and decides which sections and observations belong to the visit.

### Don't use it when

- You only need a medication list or assessment panel; use those standalone components.
- You need a scheduling backend, clinical decision support, or a signed medical record workflow. These remain host responsibilities.

### Example

Import from \`@mieweb/ui/esheet\` and load \`@mieweb/ui/styles.css\`. Install matching \`@esheet/core\`, \`@esheet/fields\`, \`@esheet/renderer\` and \`@esheet/builder\` packages (0.0.6-17 or newer; the shared entry re-exports the builder). eSheet supplies its shared CSS automatically. RichEdit additionally uses the optional Kerebron peers documented at \`@mieweb/ui/kerebron\`: load \`@mieweb/ui/kerebron.css\` and serve \`@kerebron/wasm/assets\` at \`/kerebron-wasm\`. With Kerebron 0.8.12, the host must override every \`prosemirror-view\` resolution to 1.42.3; [package-manager setup](https://github.com/mieweb/ui/blob/main/MIGRATION.md#esheet-and-encountervisit) is included in the published package. This repository’s pnpm override does not propagate to consumer applications.

\`\`\`tsx
import { EncounterVisit, DEFAULT_ENCOUNTER_VISIT_DEFINITION } from '@mieweb/ui/esheet';
import { CodeLookup } from '…/CodeLookup'; // from the host's worker-capable app bundle

<EncounterVisit
  definition={{ ...DEFAULT_ENCOUNTER_VISIT_DEFINITION, encounterDate: visit.date }}
  patientContext="45 yo male with pre-diabetes, back pain and hypertension"
  initialResponses={savedNativeEsheetResponses}
  codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
  onChange={(visit) => updateDraft(visit.mdy)}
  onSubmit={async (visit) => saveVisit(visit)}
  onToolsReady={(tools) => connectAgent(tools)}
/>
\`\`\`

The host supplies the visit’s explicit \`definition.encounterDate\` (YYYY-MM-DD) or the user enters an assertion date when capturing a condition. Clinical dates never default to the current clock. Provide \`messages={{ labels: { "Save visit": "Guardar visita", "Allergies": "Alergias" } }}\` or \`messages.translate(message, values)\` for built-in interface text, including accessible labels, section controls, clinical dialogs and announcements. English source strings are lookup keys; placeholders such as \`{name}\` retain the actual entered name. Author section titles, prompts and common findings in the application’s language. Catalog display names, codes and entered clinical prose are preserved.

Each section has a stable \`id\` and \`kind\`. An \`observations\` section accepts \`narrative: true\` and \`observations: [{ id, label, type?, unit?, code?, options?, required? }]\`. For an exam stored as one observation, choose \`kind: 'narrative'\`. Generated IDs are available through \`getEncounterFieldId\`. Change \`definition.id\` to open another visit; \`initialResponses\` is loaded once per visit. Rebuilding the same definition inline preserves edits. Configuration changes preserve answers; removed fields stay in native responses but are omitted from the current observation export.

\`onChange\`, \`ref.getSnapshot()\`, and the MCP tools expose native responses, observations, a plain data note, portable \`mdy\`, and validation errors. Save persists the full MDY; reopen it with \`initialMdy\`, which takes precedence over \`initialResponses\`. \`defaultMode\` accepts \`esheet\`, \`rich\`, or \`view\`. YAML contains the native \`form\` / \`response\`, encounter section configuration, and stable MDY field projections; the Markdown body contains headings, prose, and linked values. Existing YAML comments and host metadata survive edits. Free prose remains separate from coded data, and manual changes to linked display text cannot overwrite clinical answers. BP is one observation with systolic/diastolic components and a stable reading group; repeat readings retain timestamp, position and site.

The integration follows [Kerebron #115](https://github.com/mieweb/kerebron/issues/115), [eSheet PR #122](https://github.com/mieweb/eSheet/pull/122), and the [Templit MDY specification](https://github.com/mieweb/templit/blob/main/doc/mdy-specification.md). The first two remain open: this component supplies a local protected-link/resolver bridge over the installed editor. Templit 0.2.0 supplies the actual rendering pipeline. Native eSheet IDs retain their identity; MDY-safe aliases map links to those fields. \`mdy:\` targets avoid Kerebron 0.8.12's rewriting of fragment links.

### MCP integration

Export \`ENCOUNTER_VISIT_TOOL_DEFINITIONS\` to the host's tools/list response. Route tools/call through \`executeEncounterVisitToolCall(name, args, tools)\`, using the \`tools\` received by \`onToolsReady\`. The executor returns MCP text content, structuredContent and isError. Tools read/write native clinical fields, retrieve the full MDY (\`encounter_visit_get_mdy\`), replace free document prose (\`encounter_visit_set_document_body\`), validate, get the plain data note, and navigate to a section. Replacing prose retains every coded answer and imported YAML metadata. \`ENCOUNTER_VISIT_SYSTEM_PROMPT\` describes anonymous, evidence-only documentation. The host owns transport, authentication and persistence.

### Limitations

- Save is a host callback, and appointment details are documentation rather than booking. No FHIR Observation or signed-document export is claimed.
- Validation checks configured required entries, value types, supported ranges, JSON shapes and complete BP pairs. It does not interpret measurements medically.
- The anonymous example seeds only the facts supplied: age, sex, pre-diabetes, back pain and hypertension. Measurements, exam findings, medications and treatment remain unanswered.
- The small sample catalog demonstrates interaction. The host supplies its real terminology service; new coded entries cannot be added without it. Imported uncoded legacy entries remain visible and can be corrected.
- Medication, allergy, condition and plan fields retain the codes actually selected through the existing clinical components. Assessment and orders reuse Assessment's concern / assertion model. The default template and interface are English. Use \`messages\` for interface translations and configure section labels, prompts and common findings in the application’s language. Kerebron toolbar translation remains an upstream limitation.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui/esheet',
      peers: [
        '@esheet/core',
        '@esheet/fields',
        '@esheet/renderer',
        '@esheet/builder',
      ],
      relationships: [
        {
          type: 'composes with',
          target: 'composite-forms-esheet-renderer',
          why: 'One eSheet renderer owns every narrative, observation and clinical-list response.',
        },
        {
          type: 'composes with',
          target: 'encounter-orders-assessment',
          why: 'The assessment field keeps existing concern, assertion and linked-order records.',
        },
        {
          type: 'composes with',
          target: 'clinical-lists-medicationlist',
          why: 'Medication reconciliation is recorded in the visit response.',
        },
        {
          type: 'composes with',
          target: 'clinical-lists-allergylist',
          why: 'The visit allergy field uses AllergyManager over AllergyList for coded capture and explicit no-known-allergies status; use AllergyManager directly for a standalone chart list.',
        },
      ],
    },
  },
  args: {
    definition: {
      ...DEFAULT_ENCOUNTER_VISIT_DEFINITION,
      encounterDate: '2026-10-10', // Explicit date for this fictional visit.
    },
    patientContext: PATIENT_CONTEXT,
    initialResponses: EXAMPLE_ENCOUNTER_VISIT_RESPONSES,
    codeLookup: {
      component: SampleCatalog,
      indexUrl: '/storybook-sample-catalog',
    },
    onSubmit: async () => {},
  },
};
export default meta;
type Story = StoryObj<typeof EncounterVisit>;

export const AnonymousVisit: Story = {};

export const RichEdit: Story = { args: { defaultMode: 'rich' } };

export const FinalView: Story = { args: { defaultMode: 'view' } };

/** Deliberately expanded control text also exercises the inherited clinical translations. */
export const Localized: Story = {
  args: {
    messages: {
      labels: {
        'Anonymous patient': 'Paciente anónimo',
        eSheet: 'Formulario clínico con captura estructurada y codificada',
        RichEdit: 'Editor de narrativa clínica enriquecida',
        View: 'Revisión final del documento clínico',
        'Go to section': 'Ir a la sección del documento clínico',
        Systolic: 'Sistólica',
        Diastolic: 'Diastólica',
        'Add measurement set': 'Agregar un conjunto de mediciones',
        'Visit note preview': 'Vista previa del documento clínico',
        'Save visit': 'Guardar la visita',
      },
    },
  },
};

export const Mobile: Story = {
  render: (args) => (
    <div className="mx-auto max-w-[390px]">
      <EncounterVisit {...args} />
    </div>
  ),
};

export const NarrativeExam: Story = {
  args: {
    definition: {
      ...DEFAULT_ENCOUNTER_VISIT_DEFINITION,
      id: 'narrative-exam-visit',
      encounterDate: '2026-10-10',
      sections: DEFAULT_ENCOUNTER_VISIT_DEFINITION.sections.map((section) =>
        section.id === 'exam'
          ? { id: 'exam', title: 'Physical examination', kind: 'narrative' }
          : section
      ),
    },
  },
};

export const ReadOnly: Story = { args: { readOnly: true } };

function McpDemo(args: EncounterVisitProps) {
  const [tools, setTools] = React.useState<EncounterVisitTools | null>(null);
  const [result, setResult] = React.useState('');
  const [body, setBody] = React.useState(
    '# Encounter visit\n\n## Discussion\n\nFree report prose.'
  );
  const [sectionId, setSectionId] = React.useState('plan');
  const [sectionJson, setSectionJson] = React.useState(
    JSON.stringify(
      {
        orders: [
          {
            orderId: 'demo-a1c',
            type: 'lab',
            display: 'Hemoglobin A1c',
            code: {
              fullid: 'LOINC|4548-4',
              codetype: 'LOINC',
              fullcode: '4548-4',
            },
          },
        ],
      },
      null,
      2
    )
  );
  return (
    <div className="space-y-4">
      <div className="border-border bg-muted/30 text-foreground rounded-xl border p-4">
        <h3 className="font-semibold">MCP tools connected to this visit</h3>
        <p className="text-muted-foreground mt-1 mb-3 text-sm">
          Try a tools/call against the live form. The BP example uses fictional
          demo measurements.
        </p>
        <ButtonGroup>
          <Button
            variant="secondary"
            disabled={!tools}
            onClick={() =>
              tools &&
              setResult(
                JSON.stringify(
                  executeEncounterVisitToolCall(
                    'encounter_visit_get',
                    {},
                    tools
                  ),
                  null,
                  2
                )
              )
            }
          >
            Read visit
          </Button>
          <Button
            variant="secondary"
            disabled={!tools}
            onClick={() =>
              tools &&
              setResult(
                JSON.stringify(
                  executeEncounterVisitToolCall(
                    'encounter_visit_get_mdy',
                    {},
                    tools
                  ),
                  null,
                  2
                )
              )
            }
          >
            Read MDY
          </Button>
          <Button
            variant="secondary"
            disabled={!tools || args.readOnly}
            onClick={() =>
              tools &&
              setResult(
                JSON.stringify(
                  executeEncounterVisitToolCall(
                    'encounter_visit_upsert_vitals',
                    {
                      sectionId: 'vitals',
                      reading: { id: 'demo-bp', systolic: 142, diastolic: 88 },
                    },
                    tools
                  ),
                  null,
                  2
                )
              )
            }
          >
            Record demo BP via MCP
          </Button>
        </ButtonGroup>
        <label className="mt-3 block text-sm">
          Coded section
          <select
            className="bg-background mt-1 block min-h-11 w-full rounded px-2 py-1 text-base"
            value={sectionId}
            onChange={(event) => setSectionId(event.target.value)}
          >
            {(args.definition ?? DEFAULT_ENCOUNTER_VISIT_DEFINITION).sections
              .filter((section) =>
                [
                  'medications',
                  'allergies',
                  'conditions',
                  'assessment',
                  'plan',
                ].includes(section.kind)
              )
              .map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
          </select>
        </label>
        <label className="mt-2 block text-sm">
          Coded section JSON
          <textarea
            className="bg-background mt-1 block min-h-11 w-full rounded px-2 py-1 text-base"
            rows={3}
            value={sectionJson}
            onChange={(event) => setSectionJson(event.target.value)}
          />
        </label>
        <Button
          className="mt-2 min-h-11"
          variant="secondary"
          disabled={!tools || args.readOnly}
          onClick={() => {
            if (!tools) return;
            try {
              const value: unknown = JSON.parse(sectionJson);
              setResult(
                JSON.stringify(
                  executeEncounterVisitToolCall(
                    'encounter_visit_update_section',
                    { sectionId, value },
                    tools
                  ),
                  null,
                  2
                )
              );
            } catch {
              setResult('Enter valid JSON before updating the coded section.');
            }
          }}
        >
          Update coded section via MCP
        </Button>
        <label className="mt-3 block text-sm">
          Document Markdown body
          <textarea
            className="bg-background mt-1 block min-h-11 w-full rounded px-2 py-1 text-base"
            rows={3}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </label>
        <Button
          className="mt-2 min-h-11"
          variant="secondary"
          disabled={!tools || args.readOnly}
          onClick={() =>
            tools &&
            setResult(
              JSON.stringify(
                executeEncounterVisitToolCall(
                  'encounter_visit_set_document_body',
                  { body },
                  tools
                ),
                null,
                2
              )
            )
          }
        >
          Replace document body via MCP
        </Button>
        {result && (
          <pre
            aria-label="MCP result"
            className="bg-background mt-3 max-h-64 overflow-auto rounded-lg p-3 text-xs break-words whitespace-pre-wrap"
          >
            {result}
          </pre>
        )}
      </div>
      <EncounterVisit {...args} onToolsReady={setTools} />
    </div>
  );
}

export const McpInteraction: Story = {
  render: (args) => <McpDemo {...args} />,
};
