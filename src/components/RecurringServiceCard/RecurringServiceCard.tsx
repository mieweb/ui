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

export interface RecurringServiceCardProps {
  /** The recurring service data */
  service: RecurringService;
  /** Callback when delete is clicked */
  onDelete?: (service: RecurringService) => void;
  /** Callback when card is clicked for editing */
  onEdit?: (service: RecurringService) => void;
  /** Whether to show provider name */
  showProvider?: boolean;
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
  className,
  labels = {},
}: RecurringServiceCardProps) {
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
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return d.toLocaleDateString();
  };

  const getOccurrenceLabel = (occ: string) => {
    return occurrenceLabels[occ] || occ;
  };

  return (
    <div
      className={cn(
        'rounded-lg border bg-white shadow-sm',
        onEdit && 'cursor-pointer transition-shadow hover:shadow-md',
        className
      )}
      onClick={() => onEdit?.(service)}
      role={onEdit ? 'button' : undefined}
      tabIndex={onEdit ? 0 : undefined}
      onKeyDown={(e) => {
        if (onEdit && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onEdit(service);
        }
      }}
    >
      {/* Card Header */}
      <div className="border-b bg-gray-50 px-4 py-3">
        <h6 className="font-medium">{service.serviceName}</h6>
      </div>

      {/* Card Body */}
      <div className="p-4">
        {/* Provider */}
        {showProvider && service.providerName && (
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{provider}</span>
            <span>{service.providerName}</span>
          </div>
        )}

        {/* Occurrence */}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{occurrence}</span>
          <span>{getOccurrenceLabel(service.occurrence)}</span>
        </div>

        <hr className="my-3" />

        {/* Next Order */}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{nextOrder}</span>
          <span title={service.nextOrder?.toString()}>
            {formatDate(service.nextOrder)}
          </span>
        </div>

        {/* Consent Note */}
        {!service.overrideConsent && (
          <div className="mt-2 text-right text-xs text-red-600">
            {consentNote}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="border-t bg-gray-50 px-4 py-3 text-right">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(service);
          }}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
        >
          <i className="fas fa-trash mr-1" />
          {deleteLabel}
        </button>
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
        'flex min-h-[200px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-muted-foreground transition-colors hover:border-primary hover:bg-primary/5 hover:text-primary',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={cn('w-full max-w-lg rounded-lg bg-white shadow-xl', className)}>
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-primary p-4 text-white">
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
              <label className="mb-1 block text-sm font-medium">{provider}</label>
              <select
                value={formData.providerId}
                onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                className="w-full rounded-lg border border-gray-300 p-2"
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
            <label className="mb-1 block text-sm font-medium">{service}</label>
            <select
              value={formData.serviceId}
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2"
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
            <label className="mb-1 block text-sm font-medium">{occurrence}</label>
            <select
              value={formData.occurrence}
              onChange={(e) => setFormData({ ...formData, occurrence: e.target.value })}
              className="w-full rounded-lg border border-gray-300 p-2"
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
                onChange={(e) => setFormData({ ...formData, overrideConsent: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm">{overrideConsent}</span>
            </label>
            <p className="ml-6 text-xs text-muted-foreground">{overrideConsentNote}</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
            >
              {cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-primary/90 disabled:bg-gray-300"
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
