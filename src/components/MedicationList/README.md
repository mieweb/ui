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

| You need                                 | Use                                 |
| ---------------------------------------- | ----------------------------------- |
| Custom data flow / your own dialogs      | `MedicationList`                    |
| Working reconciliation UI in a React app | `MedicationReconciliation`          |
| A question type in an eSheet form        | `registerMedicationListFieldType()` |
| Just the prescription editor             | `MedicationEditor`                  |

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
  onAddOther={() => …}                     // "Add" editor button
  readOnly                                 // display-only
/>
```

Row anatomy: name · code (`RxNORM 314076`) · a **Compound**/**Supply**
Badge for an uncoded medication (`uncodedType`) · sig (gray) · `EXPIRED`
(red) · "Discontinued on: date" · note/task lines underneath. Alt+↑/↓
reorders from the keyboard; the toolbar is reachable by Tab (revealed on
focus).

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

| Editor field                                  | `Medication` prop              | NCPDP element                        |
| --------------------------------------------- | ------------------------------ | ------------------------------------ |
| Medication (search/name)                      | `name`                         | DrugDescription                      |
| — code (auto from lookup)                     | `code {system, code, display}` | DrugCoded / ProductCode / DrugDBCode |
| Compound / Supply (uncoded only)              | `uncodedType` (`'CP'`/`'SP'`)  | — (required to e-send uncoded)       |
| Strength (auto from label)                    | `strength`                     | Strength + StrengthUnitOfMeasure     |
| Dose form (auto from label)                   | `doseForm`                     | DrugCoded/FormCode                   |
| Practitioner sig                              | `sig`                          | — (expanded into the patient sig)    |
| Sig (patient directions)                      | `patientSig`                   | Sig/SigText                          |
| — route/frequency/PRN (auto from patient sig) | `route`, `frequency`, `prn`    | Sig structured elements              |
| Days supply (30d / 90d presets)               | `daysSupply`                   | DaysSupply                           |
| Quantity                                      | `quantity`                     | Quantity/Value                       |
| Quantity unit (dropdown, defaults from form)  | `quantityUnit`                 | Quantity/QuantityUnitOfMeasure       |
| Refills (−/+ stepper, 0–99)                   | `refills`                      | NumberOfRefills                      |
| Indication                                    | `indication`                   | Diagnosis/Primary                    |
| Prescriber                                    | `prescriber`                   | Prescriber                           |
| Substitution (radio)                          | `substitution` (`'0'`/`'1'`)   | Substitutions (DAW)                  |
| Start / End date                              | `startDate`, `endDate`         | WrittenDate / EffectiveDate          |
| Pharmacy notes                                | `pharmacyNotes`                | Note                                 |
| Pharmacy (with the `pharmacy` prop)           | `pharmacyId`                   | Pharmacy                             |
| Transmission (Transmit / Print / None)        | `transmission`                 | — (the host acts on the choice)      |

Optional editor props (also accepted by `MedicationReconciliation` as
`editorOptions`):

- `sigPresets` — `{ label, sig }[]` chips above the practitioner sig;
  hidden when omitted. `sig` is the **timing only** (`'bid with food'`);
  see "Directions presets" below for the dose the editor adds.
- `durationPresets` — days-supply chips (default `[30, 90]`).
- `prescribers` — `SelectOption[]` for a prescriber select; omitted → free
  text. The selected option's `value` is stored in `prescriber`.
- `sigTerms` — extra sig dictionary terms (see "Quantity calculation").
- `collectCompoundIngredients` — show a structured ingredients sub-form
  (drug, form, strength, quantity, unit per row) for a compound medication
  (`uncodedType === 'CP'`); stored in `compoundIngredients`. Hidden when
  omitted or when the medication isn't a compound.

Editor-only prop (not part of `editorOptions`):

- `pharmacy` — `{ source, patId, showIds?, stateOptions?, canMakePreferred?,
initialFilters?, onFiltersChange? }`. Adds a Pharmacy row
  (`PharmacyField`, loaded from the host's
  `PharmacyDataSource`) and a Transmission choice above the pharmacy notes,
  saved as `pharmacyId` and `transmission` (`'none'` until the prescriber
  picks another). **Transmit** is enabled only when the chosen pharmacy can
  receive it — `transmitRoute(pharmacy)` is `'esend'` (NCPDP + NewRx) or
  `'fax'` (has a fax number) — and its label says which. Otherwise it stays
  visible but disabled with the reason as its description, and a saved
  `transmit` falls back to `none` with a polite announcement. Until the
  pharmacy lookup confirms a route (still loading, or failed), a saved
  `transmit` can't be saved: Save is disabled and a note beside
  Transmission, linked to Save with `aria-describedby`, says to wait or
  choose Print or None, which always save. The library
  never sends or prints; the host performs the saved choice. No other
  readiness rules (prescriber, EPCS, uncoded CP/SP) are enforced here.

Derived fields ("auto"):

- Picking a coded result parses the label — "lisinopril 20 mg tablet" fills
  `strength: "20 mg"`, `doseForm: "tablet"`, and `quantityUnit: "tablet"`
  (via `parseMedicationLabel`, exported). The dose form keeps qualifiers
  ("Xanax XR 1 mg tablet,extended release" → `tablet,extended release`).
- Picking a **drug-level** result (no strength or form, e.g. "Xanax" FDB
  MEDNAME) turns Strength and Dose form into autocompletes listing that
  drug's products (from CodeLookup's `onSelectFamily`; rows without both a
  strength and a form are skipped). Each list narrows by the other field.
  Once the two leave a single product, the medication is recoded to it
  (name, code, both fields); otherwise it stays coded at the drug level.
  Typed values are still accepted. Not offered when correcting an existing
  medication until a result is picked again.
- The quantity unit dropdown defaults to the base dose form's implied unit
  (tablet → tablet, solution → milliliter, …) and keeps following it as the
  dose form changes — until the provider picks a different unit from the
  dropdown, which then sticks regardless of further dose-form changes.
- An **uncoded** medication (free text — Enter in the search, or the plain
  name input) shows **Compound** / **Supply** toggles under the medication
  field, stored as `uncodedType: 'CP' | 'SP'` (labels in
  `UNCODED_TYPE_LABELS`). One or none can be chosen; clicking the chosen
  one clears it. It is required to e-send an uncoded prescription, but the
  editor doesn't block saving without it. Coding the medication (picking a
  result) clears it, and a coded medication is never saved with one.
- When `collectCompoundIngredients` is set and the medication is marked
  **Compound**, an "Ingredients" sub-form appears below Strength/Dose form,
  with the first row already there to fill in — no click needed to start:
  rows of Drug (same injected `CodeLookup`, or plain input), Form and
  Strength (same `SuggestField` autocomplete as the main fields, without
  the main field's drug-family narrowing), Quantity, and a quantity-unit
  dropdown (same default-from-form / manual-override model as the main
  Quantity). "+ Add ingredient" appends further rows; rows left blank are
  dropped on save, and removing the only row just clears it rather than
  leaving zero rows. Ingredients are stored as the medication's
  `compoundIngredients: CompoundIngredient[]`, cleared if the medication
  isn't a compound.
- The practitioner sig (`sig`) is expanded into the patient sig
  (`patientSig`, via `expandSig`, exported): "1 tab po bid with food" →
  "Take 1 tablet by mouth twice a day with food." The patient sig follows
  `sig` until it is edited by hand (clearing it, or picking a preset,
  resumes following); a patient sig that didn't come from `sig` is never
  overwritten. A medication with only `sig` opens with `patientSig`
  pre-filled from its expansion.
- Route, frequency, and PRN are parsed live from the patient sig (via
  `parseSig`, exported): "1 tablet by mouth daily as needed" derives
  `route: oral`, `frequency: Once daily`, `prn: true`, shown under the
  patient sig field.
- List rows show `sig` (the practitioner sig).

Directions presets: a preset's timing is prefixed with the dose + route the
dose form implies. Route words in the form are checked first, so an
ophthalmic solution is never "by mouth". `__` marks an amount the
prescriber fills in. With no recognized dose form, the timing is used alone.

| Dose form (contains)                        | Practitioner sig prefix         | Patient wording                 |
| ------------------------------------------- | ------------------------------- | ------------------------------- |
| ophthalmic / eye + ointment, gel            | `apply __ in __ eye`            | Apply ** in ** eye              |
| ophthalmic / eye                            | `instill __ gtts in __ eye`     | Instill ** drops in ** eye      |
| otic / ear                                  | `instill __ gtts in __ ear`     | Instill ** drops in ** ear      |
| nasal                                       | `use __ sprays in each nostril` | Use \_\_ sprays in each nostril |
| inhalation solution / suspension, nebulizer | `inhale __ ml via nebulizer`    | Inhale \_\_ mL via nebulizer    |
| inhalation / inhaler                        | `inhale 2 puffs`                | Inhale 2 puffs                  |
| injection / intravenous                     | `inject __ ml`                  | Inject \_\_ mL                  |
| vaginal                                     | `insert __ vaginally`           | Insert \_\_ vaginally           |
| suppository                                 | `insert 1 supp pr`              | Insert 1 suppository rectally   |
| rectal                                      | `insert __ pr`                  | Insert \_\_ rectally            |
| patch / transdermal                         | `apply 1 patch`                 | Apply 1 patch                   |
| film                                        | `dissolve 1 film`               | Dissolve 1 film                 |
| sublingual                                  | `place 1 tab sl`                | Place 1 tablet under the tongue |
| tablet / caplet                             | `1 tab po`                      | Take 1 tablet by mouth          |
| capsule / softgel                           | `1 cap po`                      | Take 1 capsule by mouth         |
| lozenge / troche                            | `dissolve 1 lozenge po`         | Dissolve 1 lozenge by mouth     |
| topical, cream, ointment, gel, lotion, foam | `apply topically`               | Apply topically                 |
| oral liquid, syrup, elixir                  | `__ ml po`                      | Take \_\_ mL by mouth           |

After a preset is picked, changing the dose form rebuilds the sig (and the
patient sig, if it is still following) until the practitioner sig is edited
by hand.

### Quantity calculation

Quantity is worked out from the sig and days supply (`calculateQuantity`,
exported from `sig.ts`): **Σ over `;`-separated sig parts of units per day ×
the days that part covers**, rounded up to a whole unit.

- **Units per day** multiplies what each phrase contributes — amount (`2`,
  `1/2`, `1 1/2`, `one and a half`; ranges use the upper bound, `1-2` → 2),
  unit conversion (`tsp` = 4.92892 mL, `tbsp` = 14.7868 mL; `500 mg` of a
  250 mg tablet = 2 tablets), and frequency (`bid`, `q6h`, `q4-6h` → every
  4 h, `3x/day`, `2 tabs/day`, `every other day`). Times of day add up
  (`8am and 8pm` = 2/day). A sig with a dose but no frequency is once a day.
- **Days per part:** `x 5 days` / `for 2 weeks` at the end of a part; a final
  `then …` part takes the remaining days; a part with no duration runs for
  the whole supply (concurrent doses: `1 tab qam; 2 tabs qhs` = 3/day).
- **Days supply** accepts `30`, `2w`, `1m 2w` (m = 30 days) and is
  normalized to days on blur.
- **When it runs:** on blur after the drug, strength, dose form, sig, or
  days supply changed; on a directions / days-supply preset click; and from
  the Calculate button. It **overwrites** the quantity (current product);
  blurs that changed nothing keep a typed quantity.
- **Only for countable forms** — tablet, capsule, suppository, patch,
  lozenge, film — **and oral liquids** dosed in mL / tsp / tbsp; the sig's
  dose unit must match the form. Creams, inhalers, drops, injections, …
  show "Quantity can't be calculated for this dose form" and keep a typed
  quantity.
- **Refuses rather than guesses:** weight-based doses (`mg/kg`), `units`,
  mass doses without a single-amount strength, `__` blanks, and parts with
  only a number ("take if weight over 149 pounds") clear the quantity and
  show a reason under the field (an `aria-live` status).

The vocabulary (frequencies, routes, dose units) is one dictionary shared
by `expandSig`, `parseSig`, and `calculateQuantity`. Extend or override it
with server data (e.g. `rxlist_frequencies` rows) through `sigTerms`:

```tsx
<MedicationEditor
  sigTerms={[{ abbrev: 'qac', term: 'before each meal', perDay: 3 }]}
  …
/>
```

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
  "medications": [
    { "id": "1", "name": "calcium 500 mg tablet", "status": "unreconciled" },
  ],
  "quickAddOptions": ["aspirin 81 mg tablet"],
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
- **Healthcare/Clinical lists/MedicationListField (eSheet)** — the field
  running inside the real `EsheetRenderer`
