'use client';

import * as React from 'react';
import { cn } from '../../utils';

export interface RecurringService {
  /** Service ID */
  id: string;
  /** Service name */
  serviceName: string;
  /** Service ID reference */
  serviceId: string;
  /** Provider name (optional, for non-branded portals) */
  providerName?: string;
  /** Provider ID reference */
  providerId?: string;
  /** Occurrence frequency */
  occurrence: 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | string;
  /** Next scheduled order date */
  nextOrder?: Date | string;
  /** Whether consent is overridden (no email to employee) */
  overrideConsent?: boolean;
}

/** Card state variants */
export type RecurringServiceCardState =
  | 'default'
  | 'success'
  | 'primary'
  | 'warning'
  | 'error'
  | 'disabled';

export interface RecurringServiceCardProps {
  /** The recurring service data */
  service: RecurringService;
  /** Callback when delete is clicked */
  onDelete?: (service: RecurringService) => void;
  /** Callback when card is clicked for editing */
  onEdit?: (service: RecurringService) => void;
  /** Whether to show provider name */
  showProvider?: boolean;
  /** Card state - controls border color and status icon */
  state?: RecurringServiceCardState;
  /** Custom class name */
  className?: string;
  /** Labels */
  labels?: {
    provider?: string;
    occurrence?: string;
    nextOrder?: string;
    consentNote?: string;
    delete?: string;
  };
}

const occurrenceLabels: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  'semi-annually': 'Semi-Annually',
  annually: 'Annually',
};

export function RecurringServiceCard({
  service,
  onDelete,
  onEdit,
  showProvider = true,
  state,
  className,
  labels = {},
}: RecurringServiceCardProps) {
  // Guard against undefined service
  if (!service) {
    return null;
  }

  const {
    provider = 'Provider',
    occurrence = 'Occurrence',
    nextOrder = 'Next Order',
    consentNote = 'Email will be sent to employee for consent',
    delete: deleteLabel = 'Delete',
  } = labels;

  const formatDate = (date?: Date | string) => {
    if (!date) return '--';
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();

    // Check if date is in the past
    if (d < now) {
      return '--';
    }

    // Format as relative time
    const diffDays = Math.ceil(
      (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return d.toLocaleDateString();
  };

  const getOccurrenceLabel = (occ: string) => {
    return occurrenceLabels[occ] || occ;
  };

  // Determine effective state - explicit state prop takes precedence
  // Otherwise use neutral 'default' styling (gray, no icon)
  const effectiveState: RecurringServiceCardState = state ?? 'default';

  // State-based styling
  const stateStyles: Record<
    RecurringServiceCardState,
    { border: string; icon: React.ReactNode; showNote: boolean }
  > = {
    default: {
      border: 'border-border',
      icon: null,
      showNote: !service?.overrideConsent, // Still show consent note if needed
    },
    success: {
      border: 'border-success/30',
      icon: (
        <span className="bg-success text-success-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      ),
      showNote: false,
    },
    primary: {
      border: 'border-primary/30',
      icon: (
        <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
      ),
      showNote: false,
    },
    warning: {
      border: 'border-warning/30',
      icon: (
        <span className="bg-warning text-warning-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="currentColor" />
            <circle cx="12" cy="12" r="4" className="fill-warning" />
          </svg>
        </span>
      ),
      showNote: true,
    },
    error: {
      border: 'border-destructive/30',
      icon: (
        <span className="bg-destructive text-destructive-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full">
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
      ),
      showNote: true,
    },
    disabled: {
      border: 'border-border',
      icon: null,
      showNote: false,
    },
  };

  const currentStyle = stateStyles[effectiveState];
  const isDisabled = effectiveState === 'disabled';

  return (
    <div
      className={cn(
        'bg-card text-card-foreground rounded-xl border-2 shadow-sm',
        currentStyle.border,
        isDisabled && 'opacity-50',
        onEdit &&
          !isDisabled &&
          'cursor-pointer transition-shadow hover:shadow-md',
        className
      )}
      onClick={() => !isDisabled && onEdit?.(service)}
      role={onEdit && !isDisabled ? 'button' : undefined}
      tabIndex={onEdit && !isDisabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (onEdit && !isDisabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onEdit(service);
        }
      }}
    >
      {/* Card Header - matches CSVColumnMapper style */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* Status Icon */}
        {currentStyle.icon}
        <h6
          className="truncate text-sm font-semibold"
          title={service.serviceName}
        >
          {service.serviceName}
        </h6>
      </div>

      {/* Card Body - matches CSVColumnMapper style */}
      <div className="space-y-4 px-4 pb-4">
        {/* Provider */}
        {showProvider && service.providerName && (
          <div>
            <span className="text-muted-foreground mb-1 block text-xs font-semibold tracking-wider uppercase">
              {provider}
            </span>
            <div className="bg-muted truncate rounded-md px-3 py-2 text-sm">
              {service.providerName}
            </div>
          </div>
        )}

        {/* Occurrence */}
        <div>
          <span className="text-muted-foreground mb-1 block text-xs font-semibold tracking-wider uppercase">
            {occurrence}
          </span>
          <div className="bg-muted rounded-md px-3 py-2 text-sm">
            {getOccurrenceLabel(service.occurrence)}
          </div>
        </div>

        {/* Next Order */}
        <div>
          <span className="text-muted-foreground mb-1 block text-xs font-semibold tracking-wider uppercase">
            {nextOrder}
          </span>
          <div
            className="bg-muted rounded-md px-3 py-2 text-sm"
            title={service.nextOrder?.toString()}
          >
            {formatDate(service.nextOrder)}
          </div>
        </div>

        {/* State-based note */}
        {effectiveState === 'warning' && (
          <div className="bg-warning/10 text-warning-800 dark:text-warning-200 rounded-md px-3 py-2 text-xs">
            <i className="fas fa-exclamation-triangle mr-1" />
            {consentNote}
          </div>
        )}
        {effectiveState === 'error' && (
          <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-xs">
            <i className="fas fa-times-circle mr-1" />
            {consentNote}
          </div>
        )}

        {/* Delete Action - matches CSVColumnMapper "Ignore Column" style */}
        {!isDisabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(service);
            }}
            className="text-muted-foreground hover:text-destructive mx-auto flex items-center gap-1 text-xs transition-colors"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            {deleteLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/* Add New Card Placeholder */

export interface RecurringServiceAddCardProps {
  /** Callback when clicked */
  onClick?: () => void;
  /** Custom class name */
  className?: string;
  /** Label text */
  label?: string;
}

export function RecurringServiceAddCard({
  onClick,
  className,
  label = 'Setup Recurring Service',
}: RecurringServiceAddCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary border-border bg-muted/50 flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors',
        className
      )}
    >
      <i className="fas fa-calendar-plus mb-2 text-2xl" />
      <span>{label}</span>
    </button>
  );
}

/* Setup Modal */

export interface RecurringServiceSetupModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback when service is saved */
  onSave: (data: RecurringServiceFormData) => void;
  /** Available providers */
  providers?: Array<{ id: string; name: string }>;
  /** Available services */
  services?: Array<{ id: string; name: string }>;
  /** Initial data for editing */
  initialData?: RecurringServiceFormData;
  /** Whether saving is in progress */
  saving?: boolean;
  /** Whether to show provider selector (hide for branded portals) */
  showProviderSelector?: boolean;
  /** Custom class name */
  className?: string;
  /** Labels */
  labels?: {
    title?: string;
    provider?: string;
    service?: string;
    occurrence?: string;
    overrideConsent?: string;
    overrideConsentNote?: string;
    cancel?: string;
    save?: string;
  };
}

export interface RecurringServiceFormData {
  providerId?: string;
  serviceId: string;
  occurrence: string;
  overrideConsent: boolean;
}

export function RecurringServiceSetupModal({
  open,
  onClose,
  onSave,
  providers = [],
  services = [],
  initialData,
  saving = false,
  showProviderSelector = true,
  className,
  labels = {},
}: RecurringServiceSetupModalProps) {
  const {
    title = 'Setup Recurring Service',
    provider = 'Provider Name',
    service = 'Service',
    occurrence = 'Occurrence',
    overrideConsent = 'Override Consent',
    overrideConsentNote = 'Check to skip employee consent email',
    cancel = 'Cancel',
    save = 'Save',
  } = labels;

  const [formData, setFormData] = React.useState<RecurringServiceFormData>(
    initialData || {
      providerId: '',
      serviceId: '',
      occurrence: 'monthly',
      overrideConsent: false,
    }
  );

  React.useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        providerId: '',
        serviceId: '',
        occurrence: 'monthly',
        overrideConsent: false,
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!open) return null;

  return (
    <div className="bg-foreground/50 fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={cn(
          'bg-card text-card-foreground w-full max-w-lg rounded-lg shadow-xl',
          className
        )}
      >
        {/* Header */}
        <div className="bg-primary text-primary-foreground flex items-center justify-between p-4">
          <h4 className="text-lg font-semibold">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none hover:opacity-80"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Provider Select */}
          {showProviderSelector && (
            <div className="mb-4">
              <label className="text-muted-foreground mb-1 block text-xs font-semibold tracking-wider uppercase">
                {provider}
              </label>
              <select
                value={formData.providerId}
                onChange={(e) =>
                  setFormData({ ...formData, providerId: e.target.value })
                }
                className="bg-card border-input focus:ring-primary w-full rounded-lg border p-2 focus:ring-2 focus:outline-none"
                required={showProviderSelector}
              >
                <option value="">Select provider...</option>
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Service Select */}
          <div className="mb-4">
            <label className="text-muted-foreground mb-1 block text-xs font-semibold tracking-wider uppercase">
              {service}
            </label>
            <select
              value={formData.serviceId}
              onChange={(e) =>
                setFormData({ ...formData, serviceId: e.target.value })
              }
              className="bg-card border-input focus:ring-primary w-full rounded-lg border p-2 focus:ring-2 focus:outline-none"
              required
            >
              <option value="">Select service...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Occurrence Select */}
          <div className="mb-4">
            <label className="text-muted-foreground mb-1 block text-xs font-semibold tracking-wider uppercase">
              {occurrence}
            </label>
            <select
              value={formData.occurrence}
              onChange={(e) =>
                setFormData({ ...formData, occurrence: e.target.value })
              }
              className="bg-card border-input focus:ring-primary w-full rounded-lg border p-2 focus:ring-2 focus:outline-none"
              required
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="semi-annually">Semi-Annually</option>
              <option value="annually">Annually</option>
            </select>
          </div>

          {/* Override Consent */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.overrideConsent}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    overrideConsent: e.target.checked,
                  })
                }
                className="border-input accent-primary h-4 w-4 rounded"
              />
              <span className="text-sm">{overrideConsent}</span>
            </label>
            <p className="text-muted-foreground ml-6 text-xs">
              {overrideConsentNote}
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border-border text-muted-foreground hover:bg-muted rounded-lg border px-4 py-2 transition-colors"
            >
              {cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground rounded-lg px-4 py-2 transition-colors"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <i className="fas fa-spinner fa-spin" />
                  Saving...
                </span>
              ) : (
                save
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* Grid Container */

export interface RecurringServiceGridProps {
  /** List of recurring services */
  services: RecurringService[];
  /** Callback when service is deleted */
  onDelete?: (service: RecurringService) => void;
  /** Callback when service is edited */
  onEdit?: (service: RecurringService) => void;
  /** Callback when add is clicked */
  onAdd?: () => void;
  /** Whether to show provider names */
  showProvider?: boolean;
  /** Custom class name */
  className?: string;
}

export function RecurringServiceGrid({
  services,
  onDelete,
  onEdit,
  onAdd,
  showProvider = true,
  className,
}: RecurringServiceGridProps) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 md:grid-cols-2', className)}>
      {/* Add Card */}
      <RecurringServiceAddCard onClick={onAdd} />

      {/* Service Cards */}
      {services.map((service) => (
        <RecurringServiceCard
          key={service.id}
          service={service}
          onDelete={onDelete}
          onEdit={onEdit}
          showProvider={showProvider}
        />
      ))}
    </div>
  );
}

export default RecurringServiceCard;
