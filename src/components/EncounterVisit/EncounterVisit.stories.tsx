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

const PATIENT_CONTEXT =
  '45 yo male with pre-diabetes, back pain and hypertension';

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

A mobile-friendly encounter document backed by one **eSheet** response store. Configure major sections as narrative, individual observations, repeatable vitals, medication reconciliation, allergies, or assessment and orders. HPI is one narrative observation; physical examination can be one narrative, body-system observations, or both. Patient history, review of systems, plan, and follow-up / appointment details are included in the default template. Patient identity is not captured.

The three-way toggle uses one draft: **eSheet** offers memory aids and coded capture, **RichEdit** uses Kerebron for headings and free Markdown prose with protected data links, and **View** renders the flattened MDY through mieweb/templit for a final report check. Select a linked value in RichEdit to open its eSheet section with related inputs. Changes update every projection of that field. Free prose stays in the document body; it is not automatically promoted to a coded observation.

The visit reads as a continuous report with small outer insets and no nested section cards. Narrative inputs and the document editor grow with their content. A compact sticky section selector is available in eSheet on desktop and phone.

### Use it when

- You want to document a whole visit with the same response data available to a clinician and an MCP agent.
- Your application owns storage and decides which sections and observations belong to the visit.

### Don't use it when

- You only need a medication list or assessment panel; use those standalone components.
- You need a scheduling backend, clinical decision support, or a signed medical record workflow. These remain host responsibilities.

### Example

Import from \`@mieweb/ui/esheet\` and load \`@mieweb/ui/styles.css\`. Install matching \`@esheet/core\`, \`@esheet/fields\`, \`@esheet/renderer\` and \`@esheet/builder\` packages (0.0.6-17 or newer; the shared entry re-exports the builder). eSheet supplies its shared CSS automatically. RichEdit additionally uses the optional Kerebron peers documented at \`@mieweb/ui/kerebron\`: load \`@mieweb/ui/kerebron.css\` and serve \`@kerebron/wasm/assets\` at \`/kerebron-wasm\`.

\`\`\`tsx
import { EncounterVisit, DEFAULT_ENCOUNTER_VISIT_DEFINITION } from '@mieweb/ui/esheet';

<EncounterVisit
  definition={DEFAULT_ENCOUNTER_VISIT_DEFINITION}
  patientContext="45 yo male with pre-diabetes, back pain and hypertension"
  initialResponses={savedNativeEsheetResponses}
  onChange={(visit) => updateDraft(visit.mdy)}
  onSubmit={async (visit) => saveVisit(visit)}
  onToolsReady={(tools) => connectAgent(tools)}
/>
\`\`\`

Each section has a stable \`id\` and \`kind\`. An \`observations\` section accepts \`narrative: true\` and \`observations: [{ id, label, type?, unit?, code?, options?, required? }]\`. For an exam stored as one observation, choose \`kind: 'narrative'\`. Generated IDs are available through \`getEncounterFieldId\`. Change \`definition.id\` to open another visit; \`initialResponses\` is loaded once per visit. Rebuilding the same definition inline preserves edits. Configuration changes preserve answers; removed fields stay in native responses but are omitted from the current observation export.

\`onChange\`, \`ref.getSnapshot()\`, and the MCP tools expose native responses, observations, a plain data note, portable \`mdy\`, and validation errors. Save persists the full MDY; reopen it with \`initialMdy\`, which takes precedence over \`initialResponses\`. \`defaultMode\` accepts \`esheet\`, \`rich\`, or \`view\`. YAML contains the native \`form\` / \`response\`, encounter section configuration, and stable MDY field projections; the Markdown body contains headings, prose, and linked values. Existing YAML comments and host metadata survive edits. Free prose remains separate from coded data, and manual changes to linked display text cannot overwrite clinical answers. BP is one observation with systolic/diastolic components and a stable reading group; repeat readings retain timestamp, position and site.

The integration follows [Kerebron #115](https://github.com/mieweb/kerebron/issues/115), [eSheet PR #122](https://github.com/mieweb/eSheet/pull/122), and the [Templit MDY specification](https://github.com/mieweb/templit/blob/main/doc/mdy-specification.md). The first two remain open: this component supplies a local protected-link/resolver bridge over the installed editor. Templit 0.2.0 supplies the actual rendering pipeline. Native eSheet IDs retain their identity; MDY-safe aliases map links to those fields. \`mdy:\` targets avoid Kerebron 0.8.12's rewriting of fragment links.

### MCP integration

Export \`ENCOUNTER_VISIT_TOOL_DEFINITIONS\` to the host's tools/list response. Route tools/call through \`executeEncounterVisitToolCall(name, args, tools)\`, using the \`tools\` received by \`onToolsReady\`. The executor returns MCP text content, structuredContent and isError. Tools read/write native clinical fields, retrieve the full MDY (\`encounter_visit_get_mdy\`), replace free document prose (\`encounter_visit_set_document_body\`), validate, get the plain data note, and navigate to a section. Replacing prose retains every coded answer and imported YAML metadata. \`ENCOUNTER_VISIT_SYSTEM_PROMPT\` describes anonymous, evidence-only documentation. The host owns transport, authentication and persistence.

### Limitations

- Save is a host callback, and appointment details are documentation rather than booking. No FHIR Observation or signed-document export is claimed.
- Validation checks configured required entries, value types, supported ranges, JSON shapes and complete BP pairs. It does not interpret measurements medically.
- The anonymous example seeds only the facts supplied: age, sex, pre-diabetes, back pain and hypertension. Measurements, exam findings, medications and treatment remain unanswered.
- Medication and allergy fields use the existing clinical components and their CodeLookupProvider when provided. Assessment and orders reuse Assessment's concern / assertion model. Labels and the default template are English; customize section and observation labels for your application.`,
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
      ],
    },
  },
  args: {
    patientContext: PATIENT_CONTEXT,
    initialResponses: EXAMPLE_ENCOUNTER_VISIT_RESPONSES,
    onSubmit: async () => {},
  },
};
export default meta;
type Story = StoryObj<typeof EncounterVisit>;

export const AnonymousVisit: Story = {};

export const RichEdit: Story = { args: { defaultMode: 'rich' } };

export const FinalView: Story = { args: { defaultMode: 'view' } };

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
