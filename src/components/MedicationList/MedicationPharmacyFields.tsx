'use client';

import * as React from 'react';
import { useMessages } from '../../utils/messages';
import {
  PharmacyField,
  transmitRoute,
  type TransmitRoute,
  type PharmacyCandidate,
  type PharmacyDataSource,
  type PharmacySearchFilters,
  type PharmacyStateOption,
} from '../Pharmacy';
import { Radio, RadioGroup } from '../Radio';
import type { Medication, MedicationTransmission } from './MedicationList';

/** Turns on the editor's Pharmacy and Transmission rows. */
export interface MedicationPharmacyConfig {
  /** Where pharmacies come from. Implemented by the host. */
  source: PharmacyDataSource;
  patId: string;
  /** Append NCPDP and NPI ids to search results. */
  showIds?: boolean;
  stateOptions?: readonly PharmacyStateOption[];
  /** Show "Make Preferred" in the search. Default true. */
  canMakePreferred?: boolean;
  /** Filters applied on top of the patient's address, e.g. saved prefs. */
  initialFilters?: Partial<PharmacySearchFilters>;
  onFiltersChange?: (filters: PharmacySearchFilters) => void;
}

type PharmacyPatch = Pick<Medication, 'pharmacyId' | 'transmission'>;

export interface MedicationPharmacyFieldsProps {
  config: MedicationPharmacyConfig;
  pharmacyId: string | undefined;
  transmission: MedicationTransmission | undefined;
  onChange: (patch: Partial<PharmacyPatch>) => void;
  /**
   * Reports the chosen pharmacy's route once it is known. Until the first
   * report (lookup pending or failed) the route is unconfirmed.
   */
  onRouteChange: (route: TransmitRoute | null) => void;
}

/** Id of the note explaining why Transmit can't be saved yet. */
export const TRANSMISSION_NOTE_ID = 'med-transmission-note';

/**
 * Pharmacy and Transmission rows of the prescription editor. Transmit is
 * offered only when the chosen pharmacy can receive it (e-prescribe or fax);
 * otherwise it stays visible but disabled, with the reason as its description.
 */
export function MedicationPharmacyFields({
  config,
  pharmacyId,
  transmission,
  onChange,
  onRouteChange,
}: MedicationPharmacyFieldsProps) {
  const m = useMessages();
  const [pharmacy, setPharmacy] = React.useState<PharmacyCandidate | null>(
    null
  );
  const [loaded, setLoaded] = React.useState(false);
  const [announcement, setAnnouncement] = React.useState('');

  const choice = transmission ?? 'none';
  const choiceRef = React.useRef(choice);
  choiceRef.current = choice;
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const onRouteChangeRef = React.useRef(onRouteChange);
  onRouteChangeRef.current = onRouteChange;

  const handlePharmacy = React.useCallback(
    (pharmId: string, candidate: PharmacyCandidate | null) => {
      setPharmacy(candidate);
      setLoaded(true);
      const next: Partial<PharmacyPatch> = { pharmacyId: pharmId || undefined };
      const candidateRoute = candidate ? transmitRoute(candidate) : null;
      onRouteChangeRef.current(candidateRoute);
      if (!candidateRoute && choiceRef.current === 'transmit') {
        next.transmission = 'none';
        setAnnouncement(
          m(
            'Transmission changed to None: the selected pharmacy can’t receive prescriptions electronically or by fax.'
          )
        );
      } else {
        setAnnouncement('');
      }
      onChangeRef.current(next);
    },
    [m]
  );

  const route = pharmacy ? transmitRoute(pharmacy) : null;
  const transmitLabel =
    route === 'esend'
      ? m('Transmit (e-prescribe)')
      : route === 'fax'
        ? m('Transmit (fax)')
        : m('Transmit');
  const transmitReason =
    loaded && !route
      ? pharmacy
        ? m(
            'This pharmacy can’t receive prescriptions electronically or by fax.'
          )
        : m('Choose a pharmacy to transmit.')
      : undefined;
  // A saved Transmit waits for the pharmacy lookup (which may be slow or
  // fail); the editor won't save it until the route is confirmed.
  const pendingNote =
    choice === 'transmit' && !route
      ? m(
          'Transmit can be saved once the pharmacy is confirmed. Choose Print or None to save now.'
        )
      : '';

  return (
    <>
      <PharmacyField
        source={config.source}
        patId={config.patId}
        initialPharmId={pharmacyId}
        onValueChange={handlePharmacy}
        showIds={config.showIds}
        stateOptions={config.stateOptions}
        canMakePreferred={config.canMakePreferred}
        initialFilters={config.initialFilters}
        onFiltersChange={config.onFiltersChange}
      />
      <RadioGroup
        name="med-transmission"
        label={m('Transmission')}
        value={choice}
        onValueChange={(value) => {
          setAnnouncement('');
          onChange({ transmission: value as MedicationTransmission });
        }}
        orientation="horizontal"
        size="sm"
      >
        <Radio
          value="transmit"
          label={transmitLabel}
          disabled={!route}
          description={transmitReason}
        />
        <Radio value="print" label={m('Print')} />
        <Radio value="none" label={m('None')} />
      </RadioGroup>
      <p
        role="status"
        aria-live="polite"
        className="text-muted-foreground text-xs empty:hidden"
      >
        {announcement}
      </p>
      <p
        id={TRANSMISSION_NOTE_ID}
        role="status"
        aria-live="polite"
        className="text-muted-foreground text-xs empty:hidden"
      >
        {pendingNote}
      </p>
    </>
  );
}
