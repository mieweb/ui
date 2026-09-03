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
  title: 'Healthcare/HealthSurveillance',
  component: HealthSurveillance,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
**Health-surveillance due list** — evaluates a \`PatientHistory\` against program
metadata (\`programs.json\` from the codify pipeline, or a deployment's own) and
shows what's **overdue / due / pending** vs **done** across the *health
surveillance* umbrella: occupational programs (OSHA, DOT, GS-1811…) **and**
CMS eCQM quality measures.

- Age/sex gates, periodicity windows and pending-order suppression come from
  the pure \`evaluateDue()\` engine (unit-tested; injectable clock).
- Each due item expands into a **multi-select picklist** of its satisfying
  orders — add several at once via \`onOrderMany\`, linked to the program so
  the Assessment component can nest them under the program's concern.
- \`dueForOrder()\` supports ordering-time prompts ("due for OSHA 1910.95",
  "already satisfied") in any ordering UI.
        `,
      },
    },
  },
  tags: ['autodocs'],
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
