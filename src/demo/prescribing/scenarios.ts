/** These settings describe invented fixture outcomes, not clinical recommendations. */
export interface SimulationScenario {
  id: string;
  label: string;
  description: string;
  variants?: string[];
  product: 'sim-a' | 'sim-b' | 'sim-renal' | 'sim-controlled' | null;
  interaction?: boolean;
  historyMissing?: boolean;
  pregnancy?: 'precaution' | 'unknown' | 'stale';
  dose?:
    | 'high'
    | 'missing-weight'
    | 'wrong-renal'
    | 'alternate-weight'
    | 'incompatible-unit';
  pdmp?:
    | 'required'
    | 'ambiguous'
    | 'empty'
    | 'partial'
    | 'unavailable'
    | 'stale';
  coverage?: 'restricted' | 'nonpreferred' | 'unsupported' | 'inactive';
  pa?: 'approved' | 'denied' | 'more-info' | 'pending';
  paHold?: boolean;
  unavailable?:
    | 'interactions'
    | 'pregnancy'
    | 'dosing'
    | 'formulary'
    | 'benefit'
    | 'pdmp';
  signing?: 'declined' | 'expired';
  transmission?: 'acknowledged' | 'rejected' | 'response-lost' | 'unknown';
  reconciliation?:
    | 'acknowledged'
    | 'known-not-transmitted'
    | 'still-unknown'
    | 'unavailable';
  cancellation?: 'acknowledged' | 'rejected' | 'unknown';
  readOnly?: boolean;
  unsupportedService?: boolean;
  failureBeforeCommit?: boolean;
}

export const prescribingScenarios: readonly SimulationScenario[] = [
  {
    id: 'lasix-draft',
    label: 'Bare Lasix draft',
    description:
      'Free text saves with missing details. No invented safety claims attach to Lasix.',
    product: null,
  },
  {
    id: 'complete-demo',
    label: 'Complete synthetic prescription',
    description:
      'All required synthetic facts/checks pass; review, simulated signing and send reach acknowledgement.',
    product: 'sim-a',
  },
  {
    id: 'interaction-review',
    label: 'Interaction review',
    description:
      'An invented ingredient pair requires a permitted override; findings remain visible.',
    product: 'sim-a',
    interaction: true,
  },
  {
    id: 'interaction-history-missing',
    label: 'Incomplete medication history',
    description:
      'A known interaction coexists with incomplete coverage. An override cannot repair missing history.',
    product: 'sim-a',
    interaction: true,
    historyMissing: true,
  },
  {
    id: 'pregnancy-precaution',
    label: 'Pregnancy precaution',
    description:
      'Dated pregnancy evidence triggers an invented narrative precaution.',
    product: 'sim-a',
    pregnancy: 'precaution',
  },
  {
    id: 'pregnancy-unknown',
    label: 'Pregnancy facts unknown',
    description:
      'Missing or old observations remain unknown until facts are updated.',
    product: 'sim-a',
    pregnancy: 'unknown',
    variants: ['missing', 'stale'],
  },
  {
    id: 'dose-high',
    label: 'Invented high dose',
    description:
      '12 mg exceeds the invented SimDrug A demonstration limit of 10 mg per administration.',
    product: 'sim-a',
    dose: 'high',
  },
  {
    id: 'dose-context-missing',
    label: 'Dosing facts missing',
    description:
      'Missing weight or wrong renal metric prevents a demonstration calculation.',
    product: 'sim-b',
    dose: 'missing-weight',
    variants: ['weight', 'renal'],
  },
  {
    id: 'dose-unit-conversion',
    label: 'Explicit unit conversion',
    description:
      'Supported lb-to-kg conversion; incompatible dose units remain unknown.',
    product: 'sim-b',
    dose: 'alternate-weight',
    variants: ['supported', 'incompatible'],
  },
  {
    id: 'pdmp-required',
    label: 'Explicit PDMP review required',
    description:
      'A fictional controlled-product policy requires a query and current report review.',
    product: 'sim-controlled',
    pdmp: 'required',
  },
  {
    id: 'pdmp-ambiguous-or-outage',
    label: 'PDMP uncertainty',
    description:
      'Ambiguous, empty matched, partial jurisdiction, stale and unavailable outcomes remain distinct.',
    product: 'sim-controlled',
    pdmp: 'ambiguous',
    variants: ['ambiguous', 'empty', 'partial', 'stale', 'unavailable'],
  },
  {
    id: 'covered-versus-benefit',
    label: 'Formulary versus member benefit',
    description:
      'Covered formulary does not erase patient-specific restrictions or a nonpreferred pharmacy.',
    product: 'sim-a',
    coverage: 'restricted',
    variants: ['restricted', 'nonpreferred', 'unsupported', 'inactive'],
  },
  {
    id: 'pa-approved',
    label: 'PA approval',
    description:
      'A complete questionnaire progresses to scoped approval; the configured hold clears.',
    product: 'sim-a',
    pa: 'approved',
    paHold: true,
  },
  {
    id: 'pa-denied-more-info',
    label: 'PA denied or additional information',
    description:
      'Denial preserves reasons; additional information produces a new form version.',
    product: 'sim-a',
    pa: 'denied',
    paHold: true,
    variants: ['denied', 'more-info'],
  },
  {
    id: 'pa-pending-send-allowed',
    label: 'Send while PA pending',
    description:
      'PA remains pending while a no-hold policy permits simulated transmission.',
    product: 'sim-a',
    pa: 'pending',
    paHold: false,
  },
  {
    id: 'provider-unavailable',
    label: 'Provider unavailable',
    description:
      'Required provider outage leaves unknown gates and a visible retry path.',
    product: 'sim-a',
    unavailable: 'interactions',
    variants: [
      'interactions',
      'pregnancy',
      'dosing',
      'formulary',
      'benefit',
      'pdmp',
    ],
  },
  {
    id: 'stale-edit-and-conflict',
    label: 'Concurrent edit and stale evaluation',
    description:
      'Revision preconditions prevent overwrites; older provider results cannot authorize edited content.',
    product: 'sim-a',
  },
  {
    id: 'override-invalidated',
    label: 'Override invalidated by edit',
    description:
      'A prior override is retained historically and cannot resolve a new snapshot.',
    product: 'sim-a',
    interaction: true,
  },
  {
    id: 'signing-declined-expired',
    label: 'Signing declined or expired',
    description:
      'No artifact is created when a simulated challenge is declined or expires.',
    product: 'sim-a',
    signing: 'declined',
    variants: ['declined', 'expired'],
  },
  {
    id: 'send-rejected',
    label: 'Send rejected',
    description: 'Provider rejection is visible and never called dispensing.',
    product: 'sim-a',
    transmission: 'rejected',
  },
  {
    id: 'send-response-lost',
    label: 'Committed send response lost',
    description:
      'The same idempotency key recovers one committed NewRx operation.',
    product: 'sim-a',
    transmission: 'response-lost',
  },
  {
    id: 'send-unknown-reconciliation',
    label: 'Unknown send reconciliation',
    description:
      'Lookup creates no send attempt; only known failure permits a retry.',
    product: 'sim-a',
    transmission: 'unknown',
    reconciliation: 'acknowledged',
    variants: [
      'acknowledged',
      'known-not-transmitted',
      'still-unknown',
      'unavailable',
    ],
  },
  {
    id: 'cancellation-rejected',
    label: 'Cancellation and replacement',
    description:
      'CancelRx rejection or uncertainty remains visible alongside a replacement draft.',
    product: 'sim-a',
    cancellation: 'rejected',
    variants: ['rejected', 'unknown', 'acknowledged'],
  },
  {
    id: 'reset-readonly-permissions',
    label: 'Reset and permissions',
    description:
      'Per-session isolation, read-only errors, unsupported services and precommit failure.',
    product: 'sim-a',
    readOnly: true,
    variants: ['read-only', 'unsupported', 'precommit-failure'],
  },
];

export function getScenario(
  id = 'lasix-draft',
  variant?: string
): SimulationScenario {
  const source = prescribingScenarios.find((entry) => entry.id === id);
  if (!source) throw new Error(`Unknown prescribing scenario: ${id}`);
  const scenario = { ...source };
  if (variant && !source.variants?.includes(variant))
    throw new Error(`Unsupported variant: ${variant}`);
  if (id === 'pregnancy-unknown' && variant === 'stale')
    scenario.pregnancy = 'stale';
  if (id === 'dose-context-missing' && variant === 'renal') {
    scenario.product = 'sim-renal';
    scenario.dose = 'wrong-renal';
  }
  if (id === 'dose-unit-conversion' && variant === 'incompatible')
    scenario.dose = 'incompatible-unit';
  if (id === 'pdmp-ambiguous-or-outage' && variant)
    scenario.pdmp = variant as SimulationScenario['pdmp'];
  if (id === 'covered-versus-benefit' && variant)
    scenario.coverage = variant as SimulationScenario['coverage'];
  if (id === 'pa-denied-more-info' && variant === 'more-info')
    scenario.pa = 'more-info';
  if (id === 'provider-unavailable' && variant) {
    scenario.unavailable = variant as SimulationScenario['unavailable'];
    if (variant === 'pdmp') {
      scenario.product = 'sim-controlled';
      scenario.pdmp = 'required';
    }
  }
  if (id === 'signing-declined-expired' && variant === 'expired')
    scenario.signing = 'expired';
  if (id === 'send-unknown-reconciliation' && variant)
    scenario.reconciliation = variant as SimulationScenario['reconciliation'];
  if (id === 'cancellation-rejected' && variant)
    scenario.cancellation = variant as SimulationScenario['cancellation'];
  if (id === 'reset-readonly-permissions' && variant === 'unsupported') {
    scenario.readOnly = false;
    scenario.unsupportedService = true;
  }
  if (id === 'reset-readonly-permissions' && variant === 'precommit-failure') {
    scenario.readOnly = false;
    scenario.failureBeforeCommit = true;
  }
  return scenario;
}
