'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { useMessages } from '../../utils/messages';
import { ShieldCheckIcon, TruckIcon, ZapIcon } from '../Icons';
import { classifyPharmacy, pharmacyTypeLabel, type Pharmacy } from './pharmacy';

export interface PharmacyTypeIconProps {
  pharmacy: Pick<Pharmacy, 'ncpdpid' | 'npi' | 'serviceLevel' | 'mailOrder'>;
  className?: string;
}

/**
 * Icons for how a pharmacy receives prescriptions: electronic (bolt),
 * EPCS (shield) and mail order (truck), with one text alternative. Renders
 * nothing for local fax-only and print-only pharmacies.
 */
export function PharmacyTypeIcon({
  pharmacy,
  className,
}: PharmacyTypeIconProps) {
  const m = useMessages();
  const classification = classifyPharmacy(pharmacy);
  const label = pharmacyTypeLabel(classification, m);
  if (!label) return null;

  const { kind, epcs, mailOrder } = classification;
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      data-slot="pharmacy-type-icon"
      data-kind={kind}
      className={cn(
        'text-muted-foreground inline-flex shrink-0 items-center gap-0.5',
        className
      )}
    >
      {mailOrder && <TruckIcon size={14} aria-hidden="true" />}
      {kind === 'electronic' && (
        <ZapIcon
          size={14}
          aria-hidden="true"
          className="text-primary-600 dark:text-primary-400"
        />
      )}
      {epcs && (
        <ShieldCheckIcon
          size={14}
          aria-hidden="true"
          className="text-primary-600 dark:text-primary-400"
        />
      )}
    </span>
  );
}
