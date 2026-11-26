/**
 * English source strings for scorer codes. They are message keys: the
 * component passes each through `useMessages()` before rendering.
 */

import type { FieldOutcome, MatchField, MatchReasonCode } from './scoring';
import type { ImportWarningCode } from './types';
import type { EditableField } from './decisions';

export const FIELD_LABELS: Record<MatchField, string> = {
  identity: 'Medication',
  strengthForm: 'Strength and form',
  sig: 'Directions',
  date: 'Start / fill date',
  prescriber: 'Prescriber',
  pharmacy: 'Pharmacy',
  quantity: 'Quantity',
};

export const OUTCOME_LABELS: Record<FieldOutcome, string> = {
  agree: 'Match',
  partial: 'Partial match',
  differ: 'Different',
  missing: 'Not compared',
};

export const REASON_LABELS: Record<MatchReasonCode, string> = {
  'same-product': 'Same product code',
  'brand-generic': 'Brand/generic match',
  'same-name': 'Same name',
  'similar-name': 'Similar name',
  'different-name': 'Different name',
  'same-strength-form': 'Same strength and form',
  'different-strength': 'Different strength',
  'different-form': 'Different form',
  'different-strength-form': 'Different strength and form',
  'same-sig': 'Same directions',
  'similar-sig': 'Similar directions',
  'different-sig': 'Different directions',
  'same-date': 'Within a week',
  'near-date': 'Dates apart',
  'distant-date': 'More than a year apart',
  'same-prescriber': 'Same prescriber',
  'similar-prescriber': 'Similar prescriber name',
  'different-prescriber': 'Different prescriber',
  'same-pharmacy': 'Same pharmacy',
  'similar-pharmacy': 'Similar pharmacy name',
  'different-pharmacy': 'Different pharmacy',
  'same-quantity': 'Same quantity',
  'same-quantity-unit': 'Same unit, different amount',
  'different-quantity': 'Different quantity',
  missing: 'Missing on one side',
  custom: 'Host rule',
};

export const WARNING_LABELS: Record<ImportWarningCode, string> = {
  'ndc-missing': 'No NDC in the history record',
  'ndc-unknown': 'NDC not found in the drug database',
  'ndc-ambiguous': 'NDC matches more than one medication',
  'substitution-invalid': 'Unrecognized substitution value',
  'unit-unknown': 'Unrecognized quantity unit',
};

export const EDITED_FIELD_LABELS: Record<EditableField, string> = {
  name: 'Medication',
  code: 'Code',
  uncodedType: 'Compound / supply',
  compoundIngredients: 'Ingredients',
  strength: 'Strength',
  doseForm: 'Dose form',
  quantity: 'Quantity',
  quantityUnit: 'Quantity unit',
  daysSupply: 'Days supply',
  sig: 'Practitioner sig',
  patientSig: 'Directions',
  route: 'Route',
  frequency: 'Frequency',
  prn: 'As needed',
  refills: 'Refills',
  substitution: 'Substitution',
  startDate: 'Start date',
  endDate: 'End date',
  indication: 'Indication',
  prescriber: 'Prescriber',
  pharmacyId: 'Pharmacy',
  pharmacyNotes: 'Pharmacy notes',
  note: 'Note',
};
