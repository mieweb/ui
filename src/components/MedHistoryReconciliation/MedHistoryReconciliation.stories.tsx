import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import {
  MedHistoryReconciliation,
  type MedHistoryAiProvider,
} from './MedHistoryReconciliation';
import type { MedHistoryChangeSet, MedHistoryRecord } from './types';
import { chartHistory, incomingHistory } from './storyData';

const meta: Meta<typeof MedHistoryReconciliation> = {
  id: 'clinical-lists-medhistoryreconciliation',
  title: 'Healthcare/Clinical lists/MedHistoryReconciliation',
  component: MedHistoryReconciliation,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `### What it's for

**Import an external medication history into the chart without creating duplicates.** It compares incoming records (Source A — pharmacy fill history such as NCPDP RxHistory, an HIE, another provider) with the patient's chart medications (Source B) in a fixed-height panel: the incoming list on the start side (grouped **Possible duplicates** / **New medications**, each item showing its best chart match, score and decision) and the selected record's comparison on the end side. The comparison shows only the fields that differ, with **Show N matching fields** for the rest. The header shows "9 incoming · 4 on chart · 5 of 9 reviewed" with **Add all new**, **Skip remaining** and **Review changes**.

The reviewer decides each record with toggle buttons — **Add as New · Add as Refill · Skip** (shortcuts **N** / **F** / **S**); choosing one moves to the next undecided record, and pressing the active button clears it. **Add as Refill** records the incoming dispense (fill date, quantity, days supply, refills remaining, substitution, pharmacy, prescriber) on the existing chart prescription and leaves that prescription and its status untouched — in WebChart, a new \`rxlist_refills\` row. It is offered for the same product, or the same drug (by name or brand/generic) at the same strength and form; otherwise it is disabled with the reason. **Edit before import** opens the shared \`MedicationEditor\` for Add as New. Existing chart records are never replaced.

Repeat fills of one prescription (e.g. three lancet fills) are one list item, preset to **Keep newest** (newest fill Add as New, older fills Skip), with **Skip all** as the other preset. Each fill has its own buttons (only the newest can be a refill); changing one unpresses the preset, and pressing a preset again overwrites every fill. **Review changes** opens a summary; **Confirm import** hands a \`MedHistoryChangeSet\` to \`onConfirm\` — the component never writes anything itself.

Matching is a standalone, pure scorer exported alongside the component (\`scoreMedicationPair\`, \`findDuplicateCandidates\`, \`findRepeatFillGroups\`): product codes (FDB medid, NDC, RxNorm) settle identity; a shared FDB \`drugId\` or a host alias counts as a brand ↔ generic match worth \`brandGenericCredit\` (default 90%) of the medication points; otherwise names are compared with Levenshtein distance after cheap gates rule out unrelated pairs. Strength and form, directions, dates, prescriber, pharmacy and quantity are weighted (35/20/10/10/10/10/5). Fields missing on either side are left out and the share compared is shown. Pairs at or above \`duplicateThreshold\` (default 0.8) are flagged. Incoming records that match each other (repeat fills) are grouped (\`findRepeatFillGroups\`).

### Use it when

- A medication history arrives from outside the chart and a clinician must decide what to import.
- Your host can parse the source (NCPDP SCRIPT, FHIR, HL7) into \`MedHistoryRecord\`s and resolve codes before review.
- You want an optional AI duplicate check that never decides on its own — pass \`aiSuggestions\`.

### Don't use it when

- You are recording whether the patient is **taking** the medications already on the chart — [MedicationList](?path=/docs/clinical-lists-medicationlist--docs) (\`MedicationReconciliation\`). Imported records arrive as \`unreconciled\`; reconcile their status there afterwards.
- You are reviewing AI-proposed **field** changes to one record (a scanned ID, a profile) — [AIReconciliationPanel](?path=/docs/chat-reconciliationpanel--docs) compares current vs. proposed values field by field, not two lists of records.
- You need clinical checking (interactions, duplicate therapy, dosing) — nothing here validates clinical content.

### Example

\`\`\`tsx
// Host parses + codes the history, then reviews it against the chart.
const incoming = useMemo(() => parseRxHistory(message), [message]);   // MedHistoryRecord[]
const chart = useMemo(() => toRecords(chartMeds), [chartMeds]);

<MedHistoryReconciliation
  incoming={incoming}
  chart={chart}
  chartRevision={chartRev}                   // echoed for your concurrency check
  duplicateThreshold={0.8}
  scoring={{ brandGenericCredit: 0.9 }}
  pharmacySource={pharmacyDataSource}       // optional: names for id-only pharmacies
  codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
  onDirtyChange={setUnsaved}                // warn before navigating away
  onConfirm={async (changeSet) => {
    await api.applyMedHistory(changeSet);   // one transaction; reject to show an error
  }}
/>
\`\`\`

Change-set entries are a tagged union on \`action\`: \`add\` carries the final \`medication\`; \`fill\` carries \`fill\` (a \`MedHistoryFill\`) and \`fillOf\` (the chart record). Review state (decisions and edits) is held in memory only. The host owns persistence, the chart revision check, audit, and any raw-message storage. Pass memoized \`incoming\`, \`chart\` and \`scoring\` — a new array identity re-runs matching and the AI provider.

### Limitations

- **Accessibility as implemented.** The review is a \`<section>\`; the list is a \`role="listbox"\` with \`role="group"\` sections and roving focus (↑/↓, Home/End; Enter/Space opens the detail on narrow screens), each option naming its decision or "Not reviewed". The detail is a labelled region whose heading receives focus after auto-advance, and "Next: …" is announced. Comparisons are real \`<table>\`s with row and column headers and an sr-only caption; chart columns come first as the reference and the incoming cell carries a text badge with an icon per chart candidate (Match / Partial match / Different / Not compared, prefixed "Chart A:" etc. when there are several); non-matching incoming cells add a tint and a start-edge bar — never color alone. Decisions are a \`role="toolbar"\` of \`aria-pressed\` buttons (←/→, Home/End, mirrored in RTL) with \`aria-keyshortcuts\`; refill buttons name the chart record in their accessible name, and disabled ones state why. N / F / S are ignored while typing in a field and while a dialog is open. Summary, editor and the narrow-screen sheet use \`Modal\` (focus trap, Esc); focus returns to the opener. Bulk actions and saving are announced through an \`aria-live="polite"\` region; errors render in an \`Alert\` (\`role="alert"\`).
- **Matching heuristics.** Name normalization and abbreviations are English; sig equivalence uses \`parseSig\`. Without codes, brand ↔ generic equivalence can't be detected from names — supply \`drugId\` or \`aliases\`. The score never selects an action.
- **Responsive / RTL.** From the \`md\` breakpoint the list and detail sit side by side at \`panelHeight\` (default 32rem; each scrolls independently); below it the list fills the width and the detail opens as a full-screen sheet; layout uses logical properties and mirrors in RTL. Clinical values (names, strengths, directions) are wrapped in \`<bdi>\` so authored LTR text keeps its order inside an RTL layout.
- **i18n.** All UI text goes through \`MessagesProvider\`; the scorer returns reason codes, not text. Clinical data (names, sigs) is shown as authored. Dates and percentages use \`Intl\`.
- **Not included.** Replacing chart records, NCPDP / FHIR / HL7 parsing, NDC → FDB lookup, persistence, and merging repeat fills into one record with several fills.
- **Dependencies / entry.** \`MedicationEditor\`, \`Modal\`, \`Table\`, \`Badge\`, \`toolbarKeyNav\` (RowActionToolbar), \`useMediaQuery\`, \`Alert\`, \`Button\`; main \`@mieweb/ui\` entry, no peers.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'composes with',
          target: 'clinical-lists-medicationlist',
          why: 'Imported records arrive unreconciled; MedicationReconciliation then records whether the patient is taking them. Its MedicationEditor is reused for edits before import.',
        },
        {
          type: 'alternative to',
          target: 'chat-reconciliationpanel',
          why: 'AIReconciliationPanel reviews proposed field changes to one record; MedHistoryReconciliation compares two lists of medication records.',
        },
        {
          type: 'uses',
          target: 'overlays-modal',
          why: 'The merge summary and the edit dialog are Modals.',
        },
      ],
    },
  },
  argTypes: {
    incoming: {
      description:
        'Incoming medication history (Source A) as normalized `MedHistoryRecord`s. Memoize.',
    },
    chart: {
      description: "The patient's chart medications (Source B). Memoize.",
    },
    onConfirm: {
      description:
        'Receives the confirmed `MedHistoryChangeSet`. Return a promise to keep the summary open while saving; a rejection is shown and selections are kept.',
    },
    chartRevision: {
      description:
        'Chart revision the review is based on, echoed in the change set for the host’s concurrency check.',
    },
    duplicateThreshold: {
      control: { type: 'range', min: 0.5, max: 1, step: 0.05 },
      description:
        '0–1 score at which a pair is a potential duplicate (default 0.8).',
    },
    scoring: {
      description:
        'Scoring options: `weights`, `brandGenericCredit` (default 0.9), brand/generic `aliases`, custom field `scorers`. Memoize.',
    },
    aiSuggestions: {
      description:
        'Optional host AI provider `(request, signal) => Promise<suggestions>`. Off when omitted; suggestions are advisory and can be dismissed.',
    },
    pharmacySource: {
      description:
        'Optional `getPharmacy(pharmId)` used to show names for pharmacies given only by id.',
    },
    codeLookup: {
      description:
        'CodeLookup wiring for the edit dialog (see MedicationEditor); `false` forces a plain name input.',
    },
    editorOptions: {
      description: 'MedicationEditor options for the edit dialog.',
    },
    onDirtyChange: {
      description: 'Called when unsaved decisions appear or are cleared.',
    },
    panelHeight: {
      control: 'text',
      description:
        'Height of the list + detail panel from the `md` breakpoint (default `32rem`).',
    },
    title: { description: 'Heading text; `null` hides it.' },
  },
  tags: ['autodocs', 'scope:domain-specific', 'maturity:experimental'],
};

export default meta;
type Story = StoryObj<typeof MedHistoryReconciliation>;

function describeChangeSet(set: MedHistoryChangeSet): string {
  return [
    ...set.changes.map((c) =>
      c.action === 'fill'
        ? `refill of ${c.fillOf.medication.name}: filled ${c.fill.fillDate ?? '?'}, ${c.fill.quantity ?? '?'} ${c.fill.quantityUnit ?? ''}`
        : `add ${c.medication.name}${c.editedFields.length ? ` (edited: ${c.editedFields.join(', ')})` : ''}`
    ),
    `skipped: ${set.skipped.length}, undecided: ${set.undecided.length}`,
  ].join('\n');
}

function Host({
  incoming = incomingHistory,
  chart = chartHistory,
  fail = false,
  ...props
}: Partial<React.ComponentProps<typeof MedHistoryReconciliation>> & {
  incoming?: MedHistoryRecord[];
  chart?: MedHistoryRecord[];
  fail?: boolean;
}) {
  const [result, setResult] = useState<string>();
  return (
    <div className="space-y-4">
      <MedHistoryReconciliation
        incoming={incoming}
        chart={chart}
        codeLookup={false}
        chartRevision="rev-42"
        {...props}
        onConfirm={async (set) => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          if (fail) throw new Error('The chart was changed by another user');
          setResult(describeChangeSet(set));
        }}
      />
      {result && (
        <pre className="text-muted-foreground rounded border p-2 text-xs whitespace-pre-wrap">
          {result}
        </pre>
      )}
    </div>
  );
}

/**
 * The RxHistory sample against a small chart: Sprycel matches dasatinib
 * (brand ↔ generic, refill available), the methylprednisolone dose pack
 * matches a typed chart entry, doxycycline matches an older course, and
 * three lancet fills form a repeat-fill group preset to Keep newest. The
 * syringe and lancets show import warnings and the possible-supply hint.
 * Try **N** / **F** / **S** on the selected record.
 */
export const Default: Story = {
  render: () => <Host />,
};

/**
 * Raise the threshold to 95% and only the methylprednisolone dose pack
 * (100%) stays flagged. Sprycel ↔ dasatinib (93.2% — the directions are
 * worded differently) and the older doxycycline course (92.5%) move to
 * New medications.
 */
export const StricterThreshold: Story = {
  render: () => <Host duplicateThreshold={0.95} />,
};

const tobradexChart: MedHistoryRecord[] = [
  ...chartHistory,
  {
    id: 'chart-tobradex',
    medication: {
      id: 'chart-tobradex',
      name: 'TobraDex eye drops',
      status: 'not-taking',
    },
  },
];

const fakeAi: MedHistoryAiProvider = (request, signal) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        resolve([
          {
            incomingId: 'rxh-tobradex',
            chartId: 'chart-tobradex',
            reason: 'Possible match: TobraDex is the brand of this eye drop',
            confidence: 0.82,
          },
        ]),
      1200
    );
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

/**
 * An optional host AI provider suggests a match the rules miss (TobraDex is
 * not coded, and the names share nothing). Suggestions are advisory: the
 * reviewer still decides, and **Dismiss** removes one.
 */
export const WithAiSuggestions: Story = {
  render: () => <Host chart={tobradexChart} aiSuggestions={fakeAi} />,
};

const lancetChart: MedHistoryRecord[] = [
  ...chartHistory,
  {
    id: 'chart-lancets',
    medication: {
      id: 'chart-lancets',
      name: 'FreeStyle 28G lancets',
      status: 'taking',
      quantity: '100',
      quantityUnit: 'each',
      startDate: '2025-06-01',
    },
    codes: [{ system: 'NDC', code: '99073013001' }],
  },
];

/**
 * The chart already has the lancets, so the repeat-fill group is a possible
 * duplicate and its newest fill can be **Add as Refill**; older fills can
 * only be added or skipped.
 */
export const RepeatFillsWithChartRecord: Story = {
  render: () => <Host chart={lancetChart} />,
};

/**
 * `onConfirm` rejects: the summary stays open with the error, and every
 * selection is kept for another try.
 */
export const SaveFails: Story = {
  render: () => <Host fail />,
};

/** No incoming history to review. */
export const Empty: Story = {
  render: () => <Host incoming={[]} />,
};
