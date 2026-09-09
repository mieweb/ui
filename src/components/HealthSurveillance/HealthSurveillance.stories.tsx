import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import {
  HealthSurveillance,
  type SurveillanceOrderPick,
} from './HealthSurveillance';
import { ChartOrdersGrid, EncounterOrdersGrid } from './OrdersGrid';
import type { OrderRow } from './orderRows';
import type { ProgramsMap } from './evaluate';
import type { PatientHistory } from './history';
import { Card, CardHeader, CardContent } from '../Card/Card';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button';

const meta: Meta<typeof HealthSurveillance> = {
  id: 'encounter-orders-healthsurveillance',
  title: 'Healthcare/Encounter & orders/HealthSurveillance',
  component: HealthSurveillance,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

The patient's **health-surveillance due list**. It runs the pure \`evaluateDue(history, programs, { enrolledKeys, now })\` engine over a \`PatientHistory\` (orders, observations, procedures, immunizations, conditions, age, sex) and program metadata (\`ProgramsMap\` — the \`programs\` field of \`programs.json\` from the codify pipeline, or a deployment's own) and renders every applicable program as **Overdue / Due / Pending / Done** across the *health surveillance* umbrella: occupational programs (OSHA 1910.95 hearing conservation, 1910.1025 lead, DOT / FMCSA, NFPA, FAA — only those in \`enrolledKeys\`) **and** CMS eCQM quality measures (everyone passing the program's age / sex gates). Each actionable item expands into a **multi-select picklist** of the orders that satisfy it — alternatives grouped as "one of", prerequisites shown as "after …" and disabled until met, already-pending orders disabled — and **Add N orders** emits \`onOrderMany(picks)\` (or \`onOrder(pick)\` per item) as \`SurveillanceOrderPick { key, label, programKey, programLabel }\`, ready to become \`AssessmentOrder\`s linked to the program's concern. \`programLabels\` / \`orderLabels\` map \`CODETYPE|FULLCODE\` keys to display text; \`now\` injects the evaluation clock. The engine (\`evaluateDue\`, \`evaluateProgram\`, \`dueForOrder\`, \`isApplicable\`) and the row builders (\`buildChartOrderRows\`, \`buildEncounterOrderRows\`) are exported for hosts that want the knowledge without this card.

### Use it when

- An encounter or chart view should tell the clinician **what is due** for this patient — periodicity windows, age / sex gates and in-flight orders already accounted for — and let them place the satisfying orders in one click.
- The host has the patient's history in (or can map it to) \`PatientHistory\` and can serve or embed the program metadata.
- You want ordering-time prompts elsewhere: \`dueForOrder(orderKey, dueItems)\` returns the due items an order would satisfy ("due for OSHA 1910.95" / "already satisfied").

### Don't use it when

- You need the **plan** itself — where the picked orders live under their problems — [Assessment](?path=/docs/encounter-orders-assessment--docs); this card proposes, Assessment records.
- You need a **full order history grid** with grouping, requisitions and mass cancel — the \`ChartOrdersGrid\` / \`EncounterOrdersGrid\` demos in the *ChartOrders* / *EncounterOrders* stories are built on \`buildChartOrderRows\` / \`buildEncounterOrderRows\` + \`DataVisNitroGrid\`, but the grid components themselves are **not exported** from the package.
- You want a patient-level count chip ("Due List 4") in a header — [PatientHeader](?path=/docs/encounter-orders-patientheader--docs) with a \`CountBadge\`; feed it \`evaluateDue(...).length\`.
- Your programs are not expressible as *periodicity + age / sex gate + satisfying order keys* (e.g. lab-value-driven follow-up, risk-stratified intervals) — the engine has no rule language beyond \`ProgramMeta\`.

### Example

\`\`\`tsx
const [programs, setPrograms] = useState<ProgramsMap | null>(null);
useEffect(() => { fetch('/codify/en/programs.json').then((r) => r.json()).then((j) => setPrograms(j.programs)); }, []);

if (!programs) return <Skeleton />;

<HealthSurveillance
  history={patientHistory}                   // host maps chart data into PatientHistory
  programs={programs}
  enrolledKeys={employee.programs}           // ['OSHA|1910.95', 'OSHA|1910.1025']
  programLabels={PROGRAM_LABELS}
  orderLabels={ORDER_LABELS}
  onOrderMany={(picks) =>
    setOrders((prev) => [
      ...prev,
      ...picks.map((p) => ({ orderId: newId(), type: orderTypeForCodetype(p.key.split('|')[0]), display: p.label,
                              code: { fullid: p.key, codetype: p.key.split('|')[0], fullcode: p.key.split('|')[1] },
                              concernId: concernForProgram(p.programKey) })),   // link under the program's concern in Assessment
    ])
  }
/>
\`\`\`

The card owns only which item is expanded and which checkboxes are ticked; history, programs and the resulting orders are the host's.

### Limitations

- **Accessibility as implemented.** Two \`<ul aria-label>\` lists (due / satisfied); each item's expander is a \`<button aria-expanded aria-label="Show orders for …">\`; the picklist uses labelled \`Checkbox\`es with \`description\` for "after …" / "already pending". Status is conveyed by badge colour **and** text. Nothing is announced: expanding, checking or **Add N orders** produce no live-region message, and the header counts ("2 actionable · 3 done") are plain text. Item keys (\`OSHA|1910.95\`) render as visible monospace text.
- **Clinical / regulatory caveats.** \`evaluateDue\` is periodicity arithmetic (UTC, day-of-month clamped) over \`ProgramMeta { kind?, periodicityMonths?, ageMin?, ageMax?, sex?, orders? }\`: it does **not** know exposure levels, standard-threshold-shift logic, abnormal results, employer-specific protocols beyond what \`programsUrl\` / your \`programs\` supply, or payer measure specifications. Correctness of due status depends entirely on the completeness of \`history\` — a completed order the host omits reads as overdue. Nothing here places orders or writes back to the chart.
- **Hard-coded card chrome**: the title "Health surveillance", header counts and empty copy are not props; there is no \`readOnly\` (omit both \`onOrder\` / \`onOrderMany\` to hide the picklists) and no per-item action beyond ordering.
- **Preselection heuristics** — expanding an item ticks the first alternative of every unblocked, non-pending order spec; alternatives are mutually exclusive — may not match local practice.
- **Responsive / RTL.** Rows are single-line \`flex\` with a truncating label; the nested picklist uses physical \`marginLeft\` / \`border-l-2\` lanes — no RTL mirroring.
- **Theming / i18n.** Semantic tokens via \`Card\` / \`Badge\`; every string (badges, "one of", "after", "linked to", "Nothing due — …") is English.
- **Dependencies / entry.** \`Card\`, \`Badge\`, \`Button\`, \`Checkbox\`, \`./evaluate\`, \`./history\`; main \`@mieweb/ui\` entry, no peers. The stories fetch \`programs.json\` from \`/codify/en/\` (Storybook static) — the same sidecar CodeLookup uses for its program drill-downs.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'encounter-orders-assessment',
          why: "onOrderMany picks carry programKey so the host can add them to Assessment as orders linked to the program's concern.",
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:domain-specific', 'maturity:stable'],
};

export default meta;
type Story = StoryObj<typeof HealthSurveillance>;

// -----------------------------------------------------------------------------
// Sample data — 55-year-old female factory worker, evaluated at 2026-07-04
// -----------------------------------------------------------------------------

const NOW = new Date('2026-07-04');

const PROGRAM_LABELS: Record<string, string> = {
  'OSHA|1910.95': 'Hearing conservation (OSHA 1910.95)',
  'OSHA|1910.1025': 'Lead surveillance (OSHA 1910.1025)',
  'OSHA|1910.1030': 'Bloodborne pathogens / hep B (OSHA 1910.1030)',
  'OSHA|1910.134': 'Respirator medical clearance (OSHA 1910.134)',
  'eCQM|CMS122': 'Diabetes: A1c control (CMS122)',
  'eCQM|CMS124': 'Cervical cancer screening (CMS124)',
  'eCQM|CMS125': 'Breast cancer screening (CMS125)',
  'eCQM|CMS130': 'Colorectal cancer screening (CMS130)',
  'eCQM|CMS147': 'Influenza immunization (CMS147)',
};

const ORDER_LABELS: Record<string, string> = {
  'HCPCS|92551': 'Pure tone hearing test, air',
  'HCPCS|0209T': 'Audiometry, air & bone',
  'LOINC|89015-2': 'Pure tone threshold audiometry panel',
  'Quest Order|3058': 'Lead, blood (OSHA)',
  'Quest Order|22996': 'Lead and zinc protoporphyrin evaluation',
  'Quest Order|948': 'Zinc protoporphyrin (ZPP)',
  'LabCorp Order|005009': 'CBC with differential/platelet',
  'LabCorp Order|003772': 'Urinalysis, complete',
  'CVX|45': 'Hepatitis B vaccine',
  'CVX|189': 'Hepatitis B vaccine (CpG adjuvanted)',
  'Quest Order|499': 'Hepatitis B surface antibody',
  'Quest Order|26526': 'Hepatitis B surface antibody (reflex)',
  'LabCorp Order|001453': 'Hemoglobin A1c',
  'Quest Order|16320': 'Hemoglobin A1c with eAG',
  'HCPCS|77057': 'Screening mammogram',
  'HCPCS|44388': 'Colonoscopy',
  'LabCorp Order|182949': 'Occult blood, fecal (FIT)',
  'LabCorp Order|009100': 'Pap smear',
  'CVX|88': 'Influenza vaccine',
  'HCPCS|94150': 'Spirometry (vital capacity)',
  'HCPCS|94014': 'Spirometry (patient recorded)',
  'HCPCS|71020': 'Chest X-ray',
  'LOINC|85216-0': 'Fitness-for-duty determination (RMO)',
};

const ENROLLED = [
  'OSHA|1910.95',
  'OSHA|1910.1025',
  'OSHA|1910.1030',
  'OSHA|1910.134',
];

const HISTORY: PatientHistory = {
  age: 55,
  sex: 'F',
  orders: [
    // hearing conservation satisfied 8 months ago (annual)
    {
      key: 'HCPCS|92551',
      label: 'Pure tone hearing test, air',
      status: 'completed',
      date: '2025-11-02',
    },
    // blood lead 8 months ago — 6-month periodicity → overdue
    {
      key: 'Quest Order|3058',
      label: 'Lead, blood (OSHA)',
      status: 'completed',
      date: '2025-11-02',
    },
    // A1c 14 months ago — annual CMS122 → overdue
    {
      key: 'LabCorp Order|001453',
      label: 'Hemoglobin A1c',
      status: 'completed',
      date: '2025-05-01',
    },
    // pap 2024 — 36-month CMS124 → satisfied until 2027
    {
      key: 'LabCorp Order|009100',
      label: 'Pap smear',
      status: 'completed',
      date: '2024-09-12',
    },
  ],
  immunizations: [
    {
      key: 'CVX|45',
      label: 'Hepatitis B vaccine (series)',
      date: '2015-03-10',
    },
  ],
  observations: [
    {
      key: 'LOINC|4548-4',
      label: 'Hemoglobin A1c',
      value: '7.2 %',
      date: '2025-05-01',
    },
    {
      key: 'LOINC|5671-3',
      label: 'Lead, blood',
      value: '18 µg/dL',
      date: '2025-11-02',
    },
    {
      key: 'LOINC|28615-3',
      label: 'Audiogram',
      value: 'STS not present',
      date: '2025-11-02',
    },
  ],
  conditions: [
    { key: 'ICD10|I10', label: 'Essential hypertension', onset: '2019-02-01' },
    {
      key: 'ICD10|E11.9',
      label: 'Type 2 diabetes mellitus',
      onset: '2021-08-15',
    },
    { key: 'ICD10|Z57.0', label: 'Occupational exposure to noise' },
  ],
  allergies: [
    {
      key: 'RxNORM|7980',
      label: 'Penicillin',
      reaction: 'hives',
      severity: 'moderate',
    },
  ],
  medications: [
    { label: 'lisinopril', detail: '10 mg daily' },
    { label: 'metformin', detail: '500 mg BID' },
    { label: 'levothyroxine', detail: '50 mcg daily' },
  ],
};

// -----------------------------------------------------------------------------
// Grid sample data — the same chart with provider / requisition / encounter
// context on each order, plus this visit's pending unprocessed orders
// -----------------------------------------------------------------------------

/** Today's visit. */
const ENCOUNTER_ID = 'ENC-2026-0704';

const GRID_HISTORY: PatientHistory = {
  ...HISTORY,
  orders: [
    {
      key: 'HCPCS|92551',
      label: 'Pure tone hearing test, air',
      status: 'completed',
      date: '2025-11-02',
      provider: 'Dr. Alvarez (Audiology)',
      requisitionId: 'REQ-2025-1102',
      encounterId: 'ENC-2025-1102',
    },
    {
      key: 'Quest Order|3058',
      label: 'Lead, blood (OSHA)',
      status: 'completed',
      date: '2025-11-02',
      provider: 'Dr. Alvarez (Audiology)',
      requisitionId: 'REQ-2025-1102',
      encounterId: 'ENC-2025-1102',
    },
    {
      key: 'LabCorp Order|001453',
      label: 'Hemoglobin A1c',
      status: 'completed',
      date: '2025-05-01',
      provider: 'Dr. Gupta (Internal Med)',
      requisitionId: 'REQ-2025-0501',
      encounterId: 'ENC-2025-0501',
    },
    {
      key: 'LabCorp Order|009100',
      label: 'Pap smear',
      status: 'completed',
      date: '2024-09-12',
      provider: 'Dr. Okafor (OB/GYN)',
      requisitionId: 'REQ-2024-0912',
      encounterId: 'ENC-2024-0912',
    },
    // this visit — pending, not yet bundled into a requisition
    {
      key: 'LabCorp Order|182949',
      label: 'Occult blood, fecal (FIT)',
      status: 'pending',
      date: '2026-07-04',
      provider: 'Dr. Gupta (Internal Med)',
      encounterId: ENCOUNTER_ID,
    },
    {
      key: 'HCPCS|94150',
      label: 'Spirometry (vital capacity)',
      status: 'pending',
      date: '2026-07-04',
      provider: 'Dr. Gupta (Internal Med)',
      encounterId: ENCOUNTER_ID,
    },
  ],
};

/** Fetch the served programs.json (same sidecar the CodeLookup worker uses). */
function usePrograms(): ProgramsMap | null {
  const [programs, setPrograms] = useState<ProgramsMap | null>(null);
  useEffect(() => {
    fetch('/codify/en/programs.json')
      .then((r) => r.json())
      .then((j) => setPrograms(j.programs ?? {}))
      .catch(() => setPrograms({}));
  }, []);
  return programs;
}

// -----------------------------------------------------------------------------
// Stories
// -----------------------------------------------------------------------------

/** Due list only: overdue lead + A1c, due mammo/colorectal/flu, done items. */
function DueListDemo() {
  const programs = usePrograms();
  const [placed, setPlaced] = useState<SurveillanceOrderPick[]>([]);
  if (!programs) return <div className="text-sm">Loading programs…</div>;
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      <HealthSurveillance
        history={HISTORY}
        programs={programs}
        enrolledKeys={ENROLLED}
        programLabels={PROGRAM_LABELS}
        orderLabels={ORDER_LABELS}
        now={NOW}
        onOrderMany={(picks) => setPlaced((p) => [...p, ...picks])}
      />
      {placed.length > 0 && (
        <Card padding="sm">
          <div className="text-sm font-semibold">Orders placed this visit</div>
          <ul className="mt-1 space-y-0.5 text-sm">
            {placed.map((p, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <span>{p.label}</span>
                <span className="text-muted-foreground text-xs">
                  for {p.programLabel}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export const DueList: Story = { render: () => <DueListDemo /> };

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding="none" className="h-full">
      <CardHeader className="px-3 py-2">
        <span className="text-sm font-semibold">{title}</span>
      </CardHeader>
      <CardContent className="px-3 py-2">{children}</CardContent>
    </Card>
  );
}

/** Full chart demo: due list beside medications, allergies, conditions and
 * lab results — the context a clinician has while working the due list.
 * Toggle between the compact due-list card and the encounter-orders grid. */
function ChartDemoView() {
  const programs = usePrograms();
  const [placed, setPlaced] = useState<SurveillanceOrderPick[]>([]);
  const [view, setView] = useState<'due' | 'grid'>('due');
  if (!programs) return <div className="text-sm">Loading programs…</div>;
  const rowPicks = (rows: OrderRow[]): SurveillanceOrderPick[] =>
    rows.map((r) => ({
      key: r.orderKey,
      label: r.order,
      programKey: r.reasonKey,
      programLabel: r.reason || r.reasonKey,
    }));
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-3 flex items-baseline gap-3">
        <span className="text-lg font-semibold">Riley Chen</span>
        <span className="text-muted-foreground text-sm">
          55 F · assembly technician · enrolled: noise, lead, BBP
        </span>
        <span className="ml-auto flex gap-1">
          <Button
            size="sm"
            variant={view === 'due' ? 'primary' : 'outline'}
            onClick={() => setView('due')}
          >
            Due list
          </Button>
          <Button
            size="sm"
            variant={view === 'grid' ? 'primary' : 'outline'}
            onClick={() => setView('grid')}
          >
            Encounter orders
          </Button>
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {view === 'due' ? (
            <HealthSurveillance
              history={GRID_HISTORY}
              programs={programs}
              enrolledKeys={ENROLLED}
              programLabels={PROGRAM_LABELS}
              orderLabels={ORDER_LABELS}
              now={NOW}
              onOrderMany={(picks) => setPlaced((p) => [...p, ...picks])}
            />
          ) : (
            <EncounterOrdersGrid
              history={GRID_HISTORY}
              programs={programs}
              encounterId={ENCOUNTER_ID}
              enrolledKeys={ENROLLED}
              programLabels={PROGRAM_LABELS}
              orderLabels={ORDER_LABELS}
              now={NOW}
              onOrderRows={(rows) =>
                setPlaced((p) => [...p, ...rowPicks(rows)])
              }
            />
          )}
          <Panel title={`Orders this visit (${placed.length})`}>
            {placed.length === 0 ? (
              <span className="text-muted-foreground text-sm">
                Expand a due item and add its orders.
              </span>
            ) : (
              <ul className="space-y-0.5 text-sm">
                {placed.map((p, i) => (
                  <li key={i} className="flex items-baseline gap-2">
                    <Badge variant="secondary" size="sm">
                      order
                    </Badge>
                    <span>{p.label}</span>
                    <span className="text-muted-foreground text-xs">
                      for {p.programLabel}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="space-y-3">
          <Panel title="Medications">
            <ul className="space-y-0.5 text-sm">
              {HISTORY.medications?.map((m) => (
                <li key={m.label}>
                  {m.label}{' '}
                  <span className="text-muted-foreground text-xs">
                    {m.detail}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Allergies">
            <ul className="space-y-0.5 text-sm">
              {HISTORY.allergies?.map((a) => (
                <li key={a.label}>
                  {a.label}{' '}
                  <span className="text-muted-foreground text-xs">
                    {a.reaction} ({a.severity})
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Conditions">
            <ul className="space-y-0.5 text-sm">
              {HISTORY.conditions?.map((c) => (
                <li key={c.key} className="flex items-baseline gap-2">
                  <span>{c.label}</span>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {c.key.split('|')[1]}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
          <Panel title="Lab results">
            <ul className="space-y-0.5 text-sm">
              {HISTORY.observations?.map((o) => (
                <li key={o.key} className="flex items-baseline gap-2">
                  <span>{o.label}</span>
                  <span className="text-foreground font-medium">{o.value}</span>
                  <span className="text-muted-foreground text-xs">
                    {o.date}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}

export const ChartDemo: Story = { render: () => <ChartDemoView /> };

// -----------------------------------------------------------------------------
// Orders grids (NITRO / DataVis)
// -----------------------------------------------------------------------------

/** Chart-wide order history — group by reason, provider, requisition, status,
 * or date via the preset chips, or open the grid's own controls to
 * filter/group/pivot freely. Selecting pending unprocessed rows enables the
 * requisition/cancel mass operations. */
function ChartOrdersDemo() {
  const programs = usePrograms();
  const [log, setLog] = useState<string[]>([]);
  if (!programs) return <div className="text-sm">Loading programs…</div>;
  return (
    <div className="mx-auto max-w-6xl space-y-3">
      <ChartOrdersGrid
        history={GRID_HISTORY}
        programs={programs}
        enrolledKeys={ENROLLED}
        programLabels={PROGRAM_LABELS}
        orderLabels={ORDER_LABELS}
        now={NOW}
        onRequisition={(rows) =>
          setLog((l) => [
            ...l,
            `Requisition created for: ${rows.map((r) => r.order).join(', ')}`,
          ])
        }
        onCancel={(rows) =>
          setLog((l) => [
            ...l,
            `Cancelled: ${rows.map((r) => r.order).join(', ')}`,
          ])
        }
      />
      {log.length > 0 && (
        <Card padding="sm">
          <div className="text-sm font-semibold">Actions</div>
          <ul className="mt-1 space-y-0.5 text-sm">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export const ChartOrders: Story = { render: () => <ChartOrdersDemo /> };

/** The current encounter's orders with mass operations — place available
 * due-list orders, bundle pending unprocessed ones into a requisition, or
 * cancel them. */
function EncounterOrdersDemo() {
  const programs = usePrograms();
  const [log, setLog] = useState<string[]>([]);
  if (!programs) return <div className="text-sm">Loading programs…</div>;
  return (
    <div className="mx-auto max-w-6xl space-y-3">
      <EncounterOrdersGrid
        history={GRID_HISTORY}
        programs={programs}
        encounterId={ENCOUNTER_ID}
        enrolledKeys={ENROLLED}
        programLabels={PROGRAM_LABELS}
        orderLabels={ORDER_LABELS}
        now={NOW}
        onOrderRows={(rows) =>
          setLog((l) => [
            ...l,
            `Ordered: ${rows.map((r) => r.order).join(', ')}`,
          ])
        }
        onRequisition={(rows) =>
          setLog((l) => [
            ...l,
            `Requisition created for: ${rows.map((r) => r.order).join(', ')}`,
          ])
        }
        onCancel={(rows) =>
          setLog((l) => [
            ...l,
            `Cancelled: ${rows.map((r) => r.order).join(', ')}`,
          ])
        }
      />
      {log.length > 0 && (
        <Card padding="sm">
          <div className="text-sm font-semibold">Actions</div>
          <ul className="mt-1 space-y-0.5 text-sm">
            {log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export const EncounterOrders: Story = { render: () => <EncounterOrdersDemo /> };
