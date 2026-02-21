'use client';

import * as React from 'react';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '../Modal/Modal';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Switch } from '../Switch/Switch';

export interface EmployerServiceModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler for closing the modal */
  onOpenChange: (open: boolean) => void;
  /** Handler for saving the configuration */
  onSave?: (data: EmployerServiceConfig) => void;
  /** Employer information */
  employer?: {
    id: string;
    name: string;
  };
  /** Service being configured */
  service?: {
    id: string;
    name: string;
    basePrice: number;
  };
  /** Existing configuration (for editing) */
  existingConfig?: Partial<EmployerServiceConfig>;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Error message to display */
  errorMessage?: string;
}

export interface EmployerServiceConfig {
  serviceId: string;
  employerId: string;
  customPrice?: number;
  useBasePrice: boolean;
  autoAccept: boolean;
  requiresApproval: boolean;
  notifyOnOrder: boolean;
  notificationEmail?: string;
  notes?: string;
  billingCode?: string;
}

/**
 * EmployerServiceModal configures a service for a specific employer.
 */
export function EmployerServiceModal({
  open,
  onOpenChange,
  onSave,
  employer,
  service,
  existingConfig,
  isSubmitting = false,
  errorMessage,
}: EmployerServiceModalProps) {
  const [config, setConfig] = React.useState<EmployerServiceConfig>({
    serviceId: service?.id || '',
    employerId: employer?.id || '',
    customPrice: existingConfig?.customPrice,
    useBasePrice: existingConfig?.useBasePrice ?? true,
    autoAccept: existingConfig?.autoAccept ?? false,
    requiresApproval: existingConfig?.requiresApproval ?? false,
    notifyOnOrder: existingConfig?.notifyOnOrder ?? true,
    notificationEmail: existingConfig?.notificationEmail,
    notes: existingConfig?.notes,
    billingCode: existingConfig?.billingCode,
  });

  // Update config when props change
  React.useEffect(() => {
    setConfig({
      serviceId: service?.id || '',
      employerId: employer?.id || '',
      customPrice: existingConfig?.customPrice,
      useBasePrice: existingConfig?.useBasePrice ?? true,
      autoAccept: existingConfig?.autoAccept ?? false,
      requiresApproval: existingConfig?.requiresApproval ?? false,
      notifyOnOrder: existingConfig?.notifyOnOrder ?? true,
      notificationEmail: existingConfig?.notificationEmail,
      notes: existingConfig?.notes,
      billingCode: existingConfig?.billingCode,
    });
  }, [service, employer, existingConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) return;
    onSave(config);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>
            Configure Service for {employer?.name || 'Employer'}
          </ModalTitle>
        </ModalHeader>

        <ModalBody className="space-y-4">
          {/* Error message */}
          {errorMessage && (
            <div className="border-destructive/30 bg-destructive/10 rounded-lg border p-3">
              <p className="text-destructive text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Service info */}
          {service && (
            <div className="border-primary/30 bg-primary/10 rounded-lg border p-3">
              <p className="text-primary-900 dark:text-primary-300 text-sm font-medium">{service.name}</p>
              <p className="text-primary-800 dark:text-primary-400 text-xs">
                Base price: ${service.basePrice.toFixed(2)}
              </p>
            </div>
          )}

          {/* Pricing section */}
          <div className="space-y-3">
            <p className="text-foreground text-sm font-medium">Pricing</p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm">Use Base Price</p>
                <p className="text-muted-foreground text-xs">
                  Use the service&apos;s default pricing
                </p>
              </div>
              <Switch
                checked={config.useBasePrice}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({
                    ...prev,
                    useBasePrice: checked,
                    customPrice: checked ? undefined : prev.customPrice,
                  }))
                }
              />
            </div>

            {!config.useBasePrice && (
              <div className="border-border ml-4 border-l-2 pl-4">
                <label
                  htmlFor="custom-price"
                  className="text-foreground mb-1 block text-sm font-medium"
                >
                  Custom Price
                </label>
                <div className="relative w-40">
                  <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
                    $
                  </span>
                  <input
                    id="custom-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="border-input bg-background text-foreground focus:ring-ring w-full rounded-md border py-2 pr-4 pl-7 shadow-sm focus:ring-2 focus:outline-none"
                    value={config.customPrice ?? ''}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        customPrice: parseFloat(e.target.value) || undefined,
                      }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Billing code */}
          <Input
            label="Billing Code (Optional)"
            value={config.billingCode || ''}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, billingCode: e.target.value }))
            }
            placeholder="e.g., ACME-001"
          />

          {/* Order handling */}
          <div className="space-y-3">
            <p className="text-foreground text-sm font-medium">
              Order Handling
            </p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm">Auto-Accept Orders</p>
                <p className="text-muted-foreground text-xs">
                  Automatically accept orders from this employer
                </p>
              </div>
              <Switch
                checked={config.autoAccept}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, autoAccept: checked }))
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm">Requires Approval</p>
                <p className="text-muted-foreground text-xs">
                  Orders need manual approval before processing
                </p>
              </div>
              <Switch
                checked={config.requiresApproval}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, requiresApproval: checked }))
                }
              />
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <p className="text-foreground text-sm font-medium">Notifications</p>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground text-sm">Notify on New Orders</p>
                <p className="text-muted-foreground text-xs">
                  Send email when orders are placed
                </p>
              </div>
              <Switch
                checked={config.notifyOnOrder}
                onCheckedChange={(checked) =>
                  setConfig((prev) => ({ ...prev, notifyOnOrder: checked }))
                }
              />
            </div>

            {config.notifyOnOrder && (
              <div className="border-border ml-4 border-l-2 pl-4">
                <Input
                  label="Notification Email"
                  type="email"
                  value={config.notificationEmail || ''}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      notificationEmail: e.target.value,
                    }))
                  }
                  placeholder="notifications@example.com"
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="employer-service-notes"
              className="text-foreground mb-1 block text-sm font-medium"
            >
              Internal Notes
            </label>
            <textarea
              id="employer-service-notes"
              className="border-input bg-background text-foreground focus:ring-ring w-full rounded-md border px-3 py-2 shadow-sm focus:ring-2 focus:outline-none"
              rows={3}
              value={config.notes || ''}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder="Notes about this employer's service configuration..."
            />
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg
                  className="mr-2 -ml-1 h-4 w-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default EmployerServiceModal;
