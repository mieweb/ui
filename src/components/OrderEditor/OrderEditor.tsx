'use client';

/**
 * OrderEditor — order editor modal for an `AssessmentOrder`.
 *
 * Works identically to `MedicationEditor` (open / onClose / onSave) but is
 * smart about the order type: it **morphs into the right editor** —
 *
 * | `order.type` | Editor                                         |
 * |--------------|------------------------------------------------|
 * | `medication` | `MedicationEditor` (full NCPDP prescription)   |
 * | `lab`        | `LabOrderEditor`                               |
 * | `imaging`    | `ImagingOrderEditor`                           |
 * | `referral`   | `ReferralEditor`                               |
 * | `procedure`  | `ProcedureOrderEditor`                         |
 *
 * ```tsx
 * <OrderEditor
 *   open={editing !== null}
 *   order={editing ?? undefined}
 *   codeLookup={{ component: CodeLookup, indexUrl: '/codify' }}
 *   onClose={() => setEditing(null)}
 *   onSave={(order) => upsert(order)}
 * />
 * ```
 *
 * The type-specific editors share a common scaffold (coded order search,
 * priority, timing, instructions, indication, performer notes) plus their
 * own fields (imaging/procedure: body site; referral: refer-to). Like
 * `MedicationEditor`, the draft is seeded once per mount — give the editor a
 * `key` (e.g. the order id) so a different target remounts it.
 */

import * as React from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../Modal';
import { Button } from '../Button';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { Label } from '../Label';
import { RadioGroup, Radio } from '../Radio';
import {
  MedicationEditor,
  labelToMedicationFields,
  parseSig,
  type CodeLookupConfig,
  type Medication,
} from '../MedicationList';
import type { AssessmentOrder, OrderType } from '../Assessment';
import { useCodeLookupConfig } from '../CodeLookup/context';

// =============================================================================
// Types — CodeLookup injection (structural, same pattern as MedicationEditor)
// =============================================================================

/** Code-lookup domains the order editors search. */
export type OrderSearchDomain = 'med' | 'vaccine' | 'lab' | 'procedure';

/** Minimal shape of a CodeLookup selection the editors consume. */
export interface OrderLookupResult {
  fullid: string;
  label: string;
  codetype: string;
  fullcode: string;
}

/**
 * Structural subset of `CodeLookupProps` the order editors use. `CodeLookup`
 * satisfies this — it is injected (not imported) because its Web Worker
 * keeps it out of the library build (see CodeLookup/index.ts).
 */
export interface OrderLookupProps {
  indexUrl: string;
  locale?: string;
  domains?: OrderSearchDomain[];
  bare?: boolean;
  clearOnSelect?: boolean;
  placeholder?: string;
  initialQuery?: string;
  initialSearch?: boolean;
  onSelect?: (result: OrderLookupResult) => void;
  onFreeText?: (text: string) => void;
}

/** CodeLookup wiring for the editors (component injected by the consumer). */
export interface OrderCodeLookupConfig {
  /** The CodeLookup component: `import { CodeLookup } from '…/CodeLookup'` */
  component: React.ComponentType<OrderLookupProps>;
  /** Base URL of the codify index, e.g. '/codify' */
  indexUrl: string;
  /** Shard locale (default 'en') */
  locale?: string;
}

export interface OrderEditorProps {
  /** Whether the editor is open */
  open: boolean;
  /** Order being edited — omit for "add" mode */
  order?: AssessmentOrder;
  /** Order type used in add mode (edit mode follows `order.type`) */
  defaultType?: OrderType;
  /**
   * Codify shard location for coded order search. Defaults to the ambient
   * `CodeLookupProvider`; pass `false` to force a plain name input.
   */
  codeLookup?: OrderCodeLookupConfig | false;
  /** Called when the editor is dismissed without saving */
  onClose: () => void;
  /** Called with the complete order on save */
  onSave: (order: AssessmentOrder) => void;
}

// =============================================================================
// Medication mapping — AssessmentOrder ⇄ Medication (for MedicationEditor)
// =============================================================================

/** Map an order onto the `Medication` shape `MedicationEditor` edits —
 * strength/dose form/quantity unit are parsed from the display label and
 * route/frequency/PRN from the sig, so the editor opens fully populated. */
export function orderToMedication(order: AssessmentOrder): Medication {
  const sig = order.detail ? parseSig(order.detail) : undefined;
  return {
    id: order.orderId,
    name: order.display,
    sig: order.detail,
    status: 'unreconciled',
    indication: order.indication,
    pharmacyNotes: order.notes,
    ...labelToMedicationFields(order.display),
    ...(sig && {
      route: sig.route,
      frequency: sig.frequency,
      prn: sig.prn || undefined,
    }),
    code: order.code
      ? {
          system: order.code.codetype,
          code: order.code.fullcode,
          display: order.display,
        }
      : undefined,
  };
}

/** Fold a saved `Medication` back into the order it was opened from. */
export function medicationToOrder(
  med: Medication,
  base: AssessmentOrder
): AssessmentOrder {
  return {
    ...base,
    display: med.name,
    detail: med.sig || undefined,
    indication: med.indication || undefined,
    notes: med.pharmacyNotes || undefined,
    code: med.code
      ? // keep the original fullid when the code is unchanged
        base.code?.codetype === med.code.system &&
        base.code?.fullcode === med.code.code
        ? base.code
        : {
            fullid: `${med.code.system}:${med.code.code}`,
            codetype: med.code.system,
            fullcode: med.code.code,
          }
      : undefined,
  };
}

// =============================================================================
// Shared scaffold for the non-medication editors
// =============================================================================

interface TypeConfig {
  /** Modal noun: "Correct/Add {noun}" */
  noun: string;
  domains: OrderSearchDomain[];
  searchPlaceholder: string;
  timingLabel: string;
  /** Show the body-site field (imaging, procedure) */
  bodySite?: boolean;
  /** Show the refer-to field (referral) */
  referTo?: boolean;
}

const TYPE_CONFIG: Record<Exclude<OrderType, 'medication'>, TypeConfig> = {
  lab: {
    noun: 'Lab Order',
    domains: ['lab'],
    searchPlaceholder: 'Search labs — e.g. a1c',
    timingLabel: 'When to collect',
  },
  imaging: {
    noun: 'Imaging Order',
    domains: ['procedure'],
    searchPlaceholder: 'Search imaging — e.g. chest x',
    timingLabel: 'When to perform',
    bodySite: true,
  },
  procedure: {
    noun: 'Procedure Order',
    domains: ['procedure'],
    searchPlaceholder: 'Search procedures',
    timingLabel: 'When to perform',
    bodySite: true,
  },
  referral: {
    noun: 'Referral',
    domains: ['procedure'],
    searchPlaceholder: 'Search referrals & consults',
    timingLabel: 'When to be seen',
    referTo: true,
  },
};

function newId(): string {
  return `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Type-specific editor props: `OrderEditorProps` minus the morphing. */
export type TypedOrderEditorProps = Omit<OrderEditorProps, 'defaultType'>;

function BaseOrderEditor({
  type,
  open,
  order,
  codeLookup,
  onClose,
  onSave,
}: TypedOrderEditorProps & { type: Exclude<OrderType, 'medication'> }) {
  const config = TYPE_CONFIG[type];

  // Default the lookup to the ambient provider; `false` forces plain text.
  const ambientCodeLookup = useCodeLookupConfig();
  const effectiveCodeLookup: OrderCodeLookupConfig | undefined =
    codeLookup === false
      ? undefined
      : (codeLookup ?? ambientCodeLookup ?? undefined);

  const [draft, setDraft] = React.useState<AssessmentOrder>(
    () =>
      order ?? {
        orderId: newId(),
        type,
        display: '',
      }
  );

  // Focus the order search / name input when the dialog opens.
  const bodyRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const input = bodyRef.current?.querySelector('input');
    input?.focus();
  }, []);

  const patch = (p: Partial<AssessmentOrder>) =>
    setDraft((prev) => ({ ...prev, ...p }));

  const canSave = draft.display.trim().length > 0;

  if (!open) return null;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()} size="lg">
      <ModalHeader>
        <ModalTitle>
          {order ? `Correct ${config.noun}` : `Add ${config.noun}`}
        </ModalTitle>
        <ModalClose />
      </ModalHeader>
      <ModalBody className="space-y-5">
        <div ref={bodyRef} className="contents">
          {/* ——— Order + coding ——— */}
          <section className="space-y-3" aria-label="Order">
            {effectiveCodeLookup ? (
              <div className="space-y-1.5">
                <Label htmlFor="ord-search">Order</Label>
                <effectiveCodeLookup.component
                  indexUrl={effectiveCodeLookup.indexUrl}
                  locale={effectiveCodeLookup.locale}
                  domains={config.domains}
                  bare
                  clearOnSelect={false}
                  placeholder={config.searchPlaceholder}
                  // Seed the search box with the order name; an uncoded
                  // order also searches immediately so the closest coded
                  // matches are offered.
                  initialQuery={order?.display || undefined}
                  initialSearch={order ? !order.code : undefined}
                  onSelect={(result) =>
                    patch({
                      display: result.label,
                      code: {
                        fullid: result.fullid,
                        codetype: result.codetype,
                        fullcode: result.fullcode,
                      },
                    })
                  }
                  onFreeText={(text) =>
                    patch({ display: text, code: undefined })
                  }
                />
                <p className="text-muted-foreground text-xs">
                  {draft.code
                    ? `Coded: ${draft.code.codetype} ${draft.code.fullcode}`
                    : draft.display
                      ? `Uncoded free text: "${draft.display}" — pick a result to code it`
                      : 'Pick a result to code the order, or press Enter for free text'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="ord-name">Order</Label>
                <Input
                  id="ord-name"
                  value={draft.display}
                  onChange={(e) => patch({ display: e.target.value })}
                />
              </div>
            )}
            {config.referTo && (
              <div className="space-y-1.5">
                <Label htmlFor="ord-refer-to">
                  Refer to (specialty / provider)
                </Label>
                <Input
                  id="ord-refer-to"
                  value={draft.referTo ?? ''}
                  onChange={(e) =>
                    patch({ referTo: e.target.value || undefined })
                  }
                />
              </div>
            )}
            {config.bodySite && (
              <div className="space-y-1.5">
                <Label htmlFor="ord-body-site">Body site</Label>
                <Input
                  id="ord-body-site"
                  value={draft.bodySite ?? ''}
                  onChange={(e) =>
                    patch({ bodySite: e.target.value || undefined })
                  }
                />
              </div>
            )}
          </section>

          {/* ——— Scheduling ——— */}
          <section className="space-y-3" aria-label="Scheduling">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Scheduling
            </h4>
            <RadioGroup
              name="ord-priority"
              label="Priority"
              value={draft.priority ?? 'routine'}
              onValueChange={(v) =>
                patch({
                  priority:
                    v === 'routine'
                      ? undefined
                      : (v as AssessmentOrder['priority']),
                })
              }
              orientation="horizontal"
              size="sm"
            >
              <Radio value="routine" label="Routine" />
              <Radio value="urgent" label="Urgent" />
              <Radio value="stat" label="STAT" />
            </RadioGroup>
            <div className="space-y-1.5">
              <Label htmlFor="ord-timing">{config.timingLabel}</Label>
              <Input
                id="ord-timing"
                placeholder="e.g. in 3 months"
                value={draft.timing ?? ''}
                onChange={(e) => patch({ timing: e.target.value || undefined })}
              />
            </div>
          </section>

          {/* ——— Details ——— */}
          <section className="space-y-3" aria-label="Details">
            <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Details
            </h4>
            <div className="space-y-1.5">
              <Label htmlFor="ord-detail">Instructions</Label>
              <Textarea
                id="ord-detail"
                value={draft.detail ?? ''}
                onChange={(e) => patch({ detail: e.target.value || undefined })}
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ord-indication">Indication</Label>
              <Input
                id="ord-indication"
                value={draft.indication ?? ''}
                onChange={(e) =>
                  patch({ indication: e.target.value || undefined })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ord-notes">
                {type === 'referral'
                  ? 'Notes to consultant'
                  : 'Notes to performer'}
              </Label>
              <Textarea
                id="ord-notes"
                value={draft.notes ?? ''}
                onChange={(e) => patch({ notes: e.target.value || undefined })}
                rows={2}
              />
            </div>
          </section>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() => {
            onSave({ ...draft, display: draft.display.trim() });
            onClose();
          }}
          disabled={!canSave}
        >
          Save
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// =============================================================================
// Type-specific editors
// =============================================================================

/** Lab order editor — coded lab search, priority, collection timing. */
export function LabOrderEditor(props: TypedOrderEditorProps) {
  return <BaseOrderEditor type="lab" {...props} />;
}

/** Imaging order editor — coded study search, body site, priority. */
export function ImagingOrderEditor(props: TypedOrderEditorProps) {
  return <BaseOrderEditor type="imaging" {...props} />;
}

/** Procedure order editor — coded procedure search, body site, priority. */
export function ProcedureOrderEditor(props: TypedOrderEditorProps) {
  return <BaseOrderEditor type="procedure" {...props} />;
}

/** Referral editor — refer-to specialty/provider, reason, urgency. */
export function ReferralEditor(props: TypedOrderEditorProps) {
  return <BaseOrderEditor type="referral" {...props} />;
}

// =============================================================================
// OrderEditor — the morphing wrapper
// =============================================================================

/**
 * Order editor that morphs by order type: medications get the full
 * `MedicationEditor` (NCPDP prescription), every other type gets its
 * dedicated editor. API-compatible with `MedicationEditor` — see the module
 * doc for the mapping.
 */
export function OrderEditor({
  open,
  order,
  defaultType = 'procedure',
  codeLookup,
  onClose,
  onSave,
}: OrderEditorProps): React.JSX.Element | null {
  const type = order?.type ?? defaultType;

  if (type === 'medication') {
    const base: AssessmentOrder = order ?? {
      orderId: newId(),
      type: 'medication',
      display: '',
    };
    return (
      <MedicationEditor
        open={open}
        medication={order ? orderToMedication(order) : undefined}
        codeLookup={
          codeLookup === false
            ? false
            : codeLookup &&
              // MedicationLookupProps is a narrowing of OrderLookupProps
              // (domains ['med'] ⊂ OrderSearchDomain[]) — the same CodeLookup
              // component fits; the cast bridges the two structural prop types.
              ({
                component: codeLookup.component,
                indexUrl: codeLookup.indexUrl,
                locale: codeLookup.locale,
              } as CodeLookupConfig)
        }
        onClose={onClose}
        onSave={(med) => onSave(medicationToOrder(med, base))}
      />
    );
  }

  return (
    <BaseOrderEditor
      type={type}
      open={open}
      order={order}
      codeLookup={codeLookup}
      onClose={onClose}
      onSave={onSave}
    />
  );
}

export default OrderEditor;
