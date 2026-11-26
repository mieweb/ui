'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { useMessages } from '../../utils/messages';
import { formatPhoneNumber } from '../../utils/phone';
import { buttonVariants } from '../Button';
import { PhoneIcon } from '../Icons';
import { PharmacyHelp } from './PharmacyHelp';
import { PharmacyTypeIcon } from './PharmacyTypeIcon';
import { serviceLevelFlags, type Pharmacy } from './pharmacy';

export interface PharmacyInfoProps {
  /** The pharmacy to show, or `null` when none is selected. */
  pharmacy: Pharmacy | null;
  /** Shows a loading message while the host looks the pharmacy up. */
  loading?: boolean;
  className?: string;
}

/**
 * Read-only details of one pharmacy: name, address, phone with a Call link,
 * fax and what the pharmacy can receive. Announces changes politely so a
 * screen reader hears each new selection.
 */
export function PharmacyInfo({
  pharmacy,
  loading,
  className,
}: PharmacyInfoProps) {
  const m = useMessages();
  return (
    <section
      data-slot="pharmacy-info"
      aria-label={m('Pharmacy details')}
      aria-live="polite"
      aria-busy={loading || undefined}
      className={cn(
        'border-border bg-muted/40 rounded-lg border p-3 text-sm',
        className
      )}
    >
      {loading ? (
        <p className="text-muted-foreground">{m('Loading pharmacy…')}</p>
      ) : pharmacy ? (
        <PharmacyDetails pharmacy={pharmacy} />
      ) : (
        <p className="text-muted-foreground">{m('No pharmacy selected.')}</p>
      )}
    </section>
  );
}

function PharmacyDetails({ pharmacy }: { pharmacy: Pharmacy }) {
  const m = useMessages();
  const place = [
    [pharmacy.city, pharmacy.state].filter(Boolean).join(', '),
    pharmacy.zip,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <dl
      data-slot="pharmacy-info-fields"
      className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-[8rem_1fr]"
    >
      <Field label={m('Name')}>
        <span className="inline-flex items-center gap-1.5 font-medium">
          {/* Pharmacy data keeps its own direction inside RTL layouts. */}
          <bdi>{pharmacy.storeName}</bdi>
          <PharmacyTypeIcon pharmacy={pharmacy} />
        </span>
      </Field>
      <Field label={m('Address')}>
        <address className="not-italic">
          <bdi>{pharmacy.addressLine1}</bdi>
          {pharmacy.addressLine2 && (
            <>
              <br />
              <bdi>{pharmacy.addressLine2}</bdi>
            </>
          )}
          {place && (
            <>
              <br />
              <bdi>{place}</bdi>
            </>
          )}
        </address>
      </Field>
      <Field label={m('Phone')}>
        {pharmacy.phone && (
          <span className="inline-flex flex-wrap items-center gap-2">
            {/* Phone numbers keep LTR digit order in RTL layouts. */}
            <span dir="ltr">{formatPhoneNumber(pharmacy.phone)}</span>
            <a
              href={`tel:${pharmacy.phone}`}
              data-slot="pharmacy-info-call"
              aria-label={m('Call {name}', { name: pharmacy.storeName })}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <PhoneIcon size={14} aria-hidden="true" />
              <span className="ms-1">{m('Call')}</span>
            </a>
          </span>
        )}
      </Field>
      <Field label={m('Fax')}>
        {pharmacy.fax && (
          // Fax numbers keep LTR digit order in RTL layouts.
          <span dir="ltr">{formatPhoneNumber(pharmacy.fax)}</span>
        )}
      </Field>
      <Field label={m('Service level')}>
        <ServiceLevel pharmacy={pharmacy} />
      </Field>
    </dl>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt className="text-muted-foreground font-medium">{label}</dt>
      <dd className="text-foreground min-w-0 break-words">{children}</dd>
    </>
  );
}

function ServiceLevel({ pharmacy }: { pharmacy: Pharmacy }) {
  const m = useMessages();
  const { newRx, refillRequest, epcs } = serviceLevelFlags(pharmacy);

  if (!newRx) {
    return pharmacy.fax ? (
      <HelpItem
        label={m('Fax Only')}
        help={m('New scripts can be faxed to this pharmacy')}
      />
    ) : (
      <HelpItem
        label={m('Print Only')}
        help={m('This pharmacy cannot receive scripts electronically')}
      />
    );
  }

  return (
    <ul
      data-slot="pharmacy-info-service"
      className="flex flex-wrap gap-x-4 gap-y-1"
    >
      <li>
        <HelpItem
          label={m('New')}
          help={m('New scripts can be e-sent to this pharmacy')}
        />
      </li>
      {refillRequest && (
        <li>
          <HelpItem
            label={m('Refill')}
            help={m('This pharmacy can send e-refill requests')}
          />
        </li>
      )}
      {epcs && (
        <li>
          <HelpItem
            label={m('EPCS')}
            help={m(
              'Electronic prescriptions for controlled substances can be e-sent to this pharmacy'
            )}
          />
        </li>
      )}
    </ul>
  );
}

function HelpItem({ label, help }: { label: string; help: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <PharmacyHelp topic={label}>{help}</PharmacyHelp>
    </span>
  );
}
