# MedHistoryReconciliation maintainer notes

How to change the medication-history import review safely. Consumer docs live in the story description.

## Layers

```mermaid
graph TB
    Host["Host<br/>(parse, code, persist)"] -->|MedHistoryRecord[]| Component[MedHistoryReconciliation]
    Component --> Scoring["scoring.ts<br/>(pure)"]
    Component --> Decisions["decisions.ts<br/>(pure)"]
    Component --> List["ReviewList.tsx<br/>(listbox)"]
    Component --> Detail["ReviewDetail.tsx<br/>RecordReview.tsx"]
    Component --> Summary[MergeSummaryModal.tsx]
    Component --> Editor[MedicationEditor]
    Scoring --> Label["MedicationList/medicationLabel.ts<br/>MedicationList/sig.ts"]
    Scoring --> Pharm["Pharmacy/pharmacy.ts"]
    Component -->|MedHistoryChangeSet| Host
    classDef pure fill:#e8f5e9,stroke:#2e7d32
    classDef host fill:#fff3e0,stroke:#ef6c00
    class Scoring,Decisions,Label,Pharm pure
    class Host host
```

- **`scoring.ts` and `decisions.ts` stay pure.** No React, no DOM, no text. They import only other pure modules. That is why the drug-label parsers moved from `MedicationEditor.tsx` to `MedicationList/medicationLabel.ts`; don't import from a `.tsx` file here.
- **The scorer returns codes, not words.** `MatchReasonCode`, `DismissReason` and import warning codes become English source strings in `labels.ts` (and `DISMISS_LABELS` in the component), translated through `useMessages()`. Adding a reason code means adding its label — the `Record<…>` types enforce it.
- **The host owns everything outside review**: parsing (NCPDP / FHIR / HL7), NDC → FDB lookup, persistence, chart-revision checks, audit and raw-message storage. Don't add parsing or fetching here.

## Scoring pipeline

1. **Normalize once per record** (`normalizeRecord`): name without strength/form words, sorted tokens, code keys (`SYSTEM:code`, NDC digits only), strength `value unit`, base dose form, sig text plus `parseSig`, ISO dates as day numbers, pharmacy ids via `parsePharmacyIdentifier`.
2. **Gates** (`identityGate`, `nameGate`), in order:
   - shared product code → identity 1.0 (`same-product`), wins over everything;
   - supply (`uncodedType: 'SP'`) vs. a coded drug → dismissed;
   - same `drugId` or host alias group → identity `max(brandGenericCredit, name similarity)`;
   - both have different `drugId`s → dismissed (`different-drug`);
   - name length ratio or no shared 3-letter word prefix → dismissed before Levenshtein.
3. **Field scores**, each 0–1 or `null` (missing). Weights `DEFAULT_MATCH_WEIGHTS` (35/20/10/10/10/10/5).
4. **Combine**: `Σ weight × similarity / Σ compared weight`. Missing fields are excluded, never neutral; `coverage` reports the compared share. The threshold check has a `1e-9` tolerance so 0.8 passes a 0.8 threshold.

Invariants with tests in `scoring.test.ts`:

- Missing data never raises or lowers a score.
- A different strength is visible (`different-strength`) even when the pair is flagged; same drug at another strength **is** flagged by default (product decision).
- The Appendix A pairs from the planning doc are fixtures — change a weight or gate and those tests tell you which clinical outcome moved.
- 100 × 100 plus the incoming × incoming repeat-fill pass stays well under 2 s (≈0.5–1 s in jsdom). `editDistance` works on pre-split code-point arrays; keep `Array.from` out of inner loops.

## Layout

- **Master–detail, fixed height.** `MedHistoryReconciliation.tsx` owns state and renders `ReviewList` (start side) and the selected item's `RecordDetail` / `GroupDetail` (end side) in a grid at `panelHeight`. Below `md` (`useMediaQuery('(max-width: 767px)')`) the list fills the width and the detail opens in a `Modal` "sheet" with the stacked comparison (`FieldComparison layout="stack"`). jsdom's `matchMedia` mock reports no match, so tests render the wide layout unless they stub it.
- **List items are "units"**: one incoming record, or a repeat-fill group keyed by its newest fill. Possible duplicates first, then new medications, otherwise input order. `ReviewList` is a listbox with roving `tabIndex`; ↑/↓/Home/End move focus and selection; Enter/Space/click "opens" (the sheet on narrow screens).
- **Auto-advance**: any decision on the selected record, and any group preset, moves to the next undecided unit (wrapping) and announces "Next: …". If focus was in the detail it moves to the new heading (`tabIndex={-1}`); in the sheet the sheet closes and focus returns to the list. Per-fill changes inside a group do not advance.
- **Shortcuts N / F / S** use a document `keydown` listener that only acts when the event target is inside the section or the open sheet, there are no modifiers, the target isn't a text field, and no summary/editor dialog is open. They apply to single records, not groups. Buttons expose them with `aria-keyshortcuts` and a visual `<kbd>`.
- **Comparison** (`FieldComparison`): fields as rows, each chart candidate then the incoming record as columns; chart values are plain, the incoming cell carries the outcome badges (one per non-dismissed candidate, labelled when several) and the worst outcome's tint; only differing fields (plus Medication) by default, "Show N matching fields" for the rest.

## Review state

- **Decisions are keyed by incoming id**: `add` | `fill` (chart id) | `skip`. There is no replace — existing chart records are never changed. `pruneReview` drops decisions for removed records and refill targets no longer offered whenever the sources change. A source change while the summary is open closes it and shows a warning — a confirmation never applies to lists the reviewer did not see.
- **Repeat fills**: `findRepeatFillGroups` is union-find over incoming pairs at the threshold; `toRepeatGroups` picks the newest member (latest dispensed/start date). `withGroupDefaults` presets every group whose fills are all undecided to **Keep newest** (newest `add`, others `skip`) — at mount and after pruning. The preset is **not stored**: `currentPreset` derives "keep-newest" / "skip-all" / custom from the fills, so manual changes unpress the group button and `applyPreset` overwrites every fill. Pressing the already-pressed preset does nothing. Only the newest fill gets Add as Refill.
- **Defaults aren't edits**: `onDirtyChange` follows a `touched` flag set by user actions, so the Keep newest defaults don't mark the review dirty. They do count as reviewed, and Skip remaining leaves them alone (it only fills undecided records). Add all new only touches undecided records with no candidates that aren't in a group.
- **Refills (`fill`) are dispenses, not medications.** `fillBlocker` / `canBeFillOf` (scoring.ts) gate the button: shared product code, or name/brand-generic identity with strength **and** form agreeing (unknown strength/form doesn't qualify). `decisionChoices` shows one Add as Refill (disabled with the blocker's reason) for a single candidate, one per eligible candidate for several, or one disabled button when none qualifies. `fillFromRecord` copies dispense fields only; the chart prescription and its status are untouched, and Edit is disabled. The decision kind is `fill` — `MedicationList` already uses `refill` for renewing a prescription.
- **Decision buttons are toggles, not radios.** `DecisionButtons` is a `role="toolbar"` of `aria-pressed` buttons (`toolbarKeyNav`). Pressing the active button clears the decision. Refill buttons use an `aria-label` that starts with the visible text and adds the chart record's name; per-fill buttons add the fill date — keep the visible text as the prefix (label in name).
- **Edits** store a full `Medication` from `MedicationEditor`; `editedFields` diffs it against the incoming values. Every added record is written `status: 'unreconciled'` (import is not reconciliation).
- **Focus**: `Modal` does not restore focus on close, so the component remembers the opener (`useReturnFocus`) and refocuses it.
- **Memoization matters.** `incoming`, `chart` and `scoring` identities key the matching memo, the AI request and the pharmacy lookup. The source-change check compares a JSON signature, so equal-but-new arrays don't wipe decisions.

## AI provider

Optional and advisory. `useAiSuggestions` aborts on source change and ignores results after abort. A suggestion for a pair the rules dismissed is shown with the rule's reason; dismissing it clears a refill decision that pointed at it. AI never sets a decision.

## Tests

- `scoring.test.ts` — Levenshtein, normalization, gates, every field scorer, options, fixtures, performance.
- `decisions.test.ts` — decision encoding, repeat groups, pruning, edited fields, change set.
- `MedHistoryReconciliation.test.tsx` — rendering, decisions, summary, save failure, edits, pharmacy names, AI states. Slow in jsdom; the `describe` blocks raise the timeout to 20 s.
- No visual spec yet; add one under `tests/visual` (including `direction:rtl`) before promoting past `maturity:experimental`.
