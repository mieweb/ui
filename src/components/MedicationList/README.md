# MedicationList — presenting medications & reconciliation

Components for the WebChart "Presenting medications" workflow: review a
patient's medications during an encounter, record whether they're actually
taking each one, and maintain the list (correct, code, annotate, reorder,
add, remove) — standalone in any React app or as an eSheet question type.

## The three layers

```
MedicationList             presentational: props in, callbacks out — no state
        ▲
MedicationReconciliation   the engine: owns interaction state, dialogs, editor
        ▲
MedicationListField        eSheet adapter (via @mieweb/ui/esheet)
```

Pick the **lowest layer that fits**:

| You need | Use |
|---|---|
| Custom data flow / your own dialogs | `MedicationList` |
| Working reconciliation UI in a React app | `MedicationReconciliation` |
| A question type in an eSheet form | `registerMedicationListFieldType()` |
| Just the prescription editor | `MedicationEditor` |

## MedicationList (presentational)

Fully controlled. Renders the grouped list — Unreconciled → Taking as
Directed → Not Taking as Directed → Not Taking → Unknown — with hover/focus
row toolbars, and reports every interaction through callbacks. Stores
nothing.

```tsx
import { MedicationList } from '@mieweb/ui';

<MedicationList
  medications={meds}                       // grouping derived from status
  onStatusChange={(med, status) => …}      // 👍 🤘 👎 ? buttons
  onAction={(med, action) => …}            // correct/note/add-task/remove/move-up/move-down/open/refill
  actions={['correct', 'remove']}          // limit the toolbar (default: all)
  quickAddOptions={['aspirin 81 mg tablet']}
  onQuickAdd={(name) => …}
  onAddOther={() => …}                     // "Other…" button
  readOnly                                 // display-only
/>
```

Row anatomy: name · code (`RxNORM 314076`) · sig (gray) · `EXPIRED` (red) ·
"Discontinued on: date" · note/task lines underneath. Alt+↑/↓ reorders from
the keyboard; the toolbar is reachable by Tab (revealed on focus).

## MedicationReconciliation (the engine)

Owns all interaction: status changes, the **MedicationEditor** for
Correct/Add, Notes / Add Task dialogs, reorder-within-group, remove,
quick-add. Uncontrolled or controlled:

```tsx
import { MedicationReconciliation } from '@mieweb/ui';
import { CodeLookup } from '…/CodeLookup'; // app bundlers only, see below

// uncontrolled — component owns the list, reports every change
<MedicationReconciliation
  defaultMedications={presentingMeds}
  quickAddOptions={['aspirin 81 mg tablet']}
  codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
  onChange={(meds) => save(meds)}
/>

// controlled — you own the list
<MedicationReconciliation medications={meds} onChange={setMeds} />
```

- `codeLookup` (optional) wires the offline RxNorm/FDB autocomplete into the
  editor. Omitted → plain text medication name input.
- Host-specific actions (`open`, `refill`) are not managed; include them in
  `actions` and handle them via `onAction`.

## MedicationEditor (NCPDP prescription editor)

Modal editor capturing the NCPDP SCRIPT NewRx `MedicationPrescribed` field
set, with CodeLookup-based drug coding. Mount with a `key` per target so a
different medication reseeds the draft.

| Editor field | `Medication` prop | NCPDP element |
|---|---|---|
| Medication (search/name) | `name` | DrugDescription |
| — code (auto from lookup) | `code {system, code, display}` | DrugCoded / ProductCode / DrugDBCode |
| Strength | `strength` | Strength + StrengthUnitOfMeasure |
| Dose form | `doseForm` | DrugCoded/FormCode |
| Quantity / Unit | `quantity`, `quantityUnit` | Quantity/Value + QuantityUnitOfMeasure |
| Days supply | `daysSupply` | DaysSupply |
| Refills | `refills` | NumberOfRefills |
| Substitution | `substitution` (`'0'`/`'1'`) | Substitutions (DAW) |
| Sig | `sig` | Sig/SigText |
| Route / Frequency / PRN | `route`, `frequency`, `prn` | Sig structured elements |
| Start / End date | `startDate`, `endDate` | WrittenDate / EffectiveDate |
| Indication | `indication` | Diagnosis/Primary |
| Pharmacy notes | `pharmacyNotes` | Note |

All fields are optional on `Medication` — a bare `{ id, name, status }`
renders fine everywhere.

### Why CodeLookup is injected, not imported

`CodeLookup` uses a module Web Worker the tsup library build can't bundle
(see [CodeLookup/index.ts](../CodeLookup/index.ts)), so it isn't in the main
`@mieweb/ui` entry. App bundlers (Vite, Next) handle it natively — import it
in your app and pass it in:

```tsx
codeLookup={{ component: CodeLookup, indexUrl: '/codify', locale: 'en' }}
```

`indexUrl` serves the codify `.mcdx` shards (see
[CodeLookup/README.md](../CodeLookup/README.md); Storybook serves them at
`/codify`).

## eSheet question type

```tsx
import { registerMedicationListFieldType } from '@mieweb/ui/esheet';
import { CodeLookup } from '…/CodeLookup';

// once, at module load, before EsheetBuilder/EsheetRenderer mounts
registerMedicationListFieldType({
  codeLookup: { component: CodeLookup, indexUrl: '/codify' },
});
```

Then a form field:

```jsonc
{
  "id": "meds",
  "fieldType": "medicationList",
  "question": "Presenting medications",
  "medications": [ { "id": "1", "name": "calcium 500 mg tablet", "status": "unreconciled" } ],
  "quickAddOptions": ["aspirin 81 mg tablet"]
}
```

The response persists as JSON in `response.answer`:
`{ "medications": [ … ] }`. The field seeds from `definition.medications`
until a response exists; it is interactive only in fill-out (preview +
enabled) mode. Requires `@esheet/core` with the custom-field schema fix
([mieweb/eSheet#91](https://github.com/mieweb/eSheet/pull/91)).

## Stories

- **Healthcare/MedicationList** — presentational variants + `Reconciliation`
  (standalone engine with CodeLookup)
- **Components/Forms & Inputs/eSheet/MedicationListField** — the field
  running inside the real `EsheetRenderer`
