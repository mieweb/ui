'use client';

import * as React from 'react';

import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import {
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '../Modal/Modal';
import { Select } from '../Select/Select';
import { Switch } from '../Switch/Switch';

export interface ServiceCategory {
  id: string;
  name: string;
}

export interface SetupServiceModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Handler for closing the modal */
  onOpenChange: (open: boolean) => void;
  /** Handler for saving the service */
  onSave?: (data: ServiceFormData) => void;
  /** Available service categories */
  categories?: ServiceCategory[];
  /** Available services to select from */
  availableServices?: Array<{
    id: string;
    name: string;
    defaultPrice?: number;
  }>;
  /** Whether to show service picker (vs free-form entry) */
  showServicePicker?: boolean;
  /** Whether submission is in progress */
  isSubmitting?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Title for the modal */
  title?: string;
}

export interface ServiceFormData {
  serviceId?: string;
  name: string;
  description?: string;
  price: number;
  categoryId?: string;
  currentlyOffered: boolean;
  limitedInventory: boolean;
  initialInventory?: number;
  autoAcceptReferrals: boolean;
}

/**
 * SetupServiceModal provides a form to add or configure a new service.
 */
export function SetupServiceModal({
  open,
  onOpenChange,
  onSave,
  categories = [],
  availableServices = [],
  showServicePicker = false,
  isSubmitting = false,
  errorMessage,
  title = 'Add New Service',
}: SetupServiceModalProps) {
  const [formData, setFormData] = React.useState<ServiceFormData>({
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    currentlyOffered: true,
    limitedInventory: false,
    initialInventory: undefined,
    autoAcceptReferrals: false,
  });

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setFormData({
        name: '',
        description: '',
        price: 0,
        categoryId: '',
        currentlyOffered: true,
        limitedInventory: false,
        initialInventory: undefined,
        autoAcceptReferrals: false,
      });
    }
  }, [open]);

  const handleServiceSelect = (serviceId: string) => {
    const service = availableServices.find((s) => s.id === serviceId);
    if (service) {
      setFormData((prev) => ({
        ...prev,
        serviceId,
        name: service.name,
        price: service.defaultPrice || 0,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || formData.price < 0 || !onSave) return;
    onSave(formData);
  };

  const isValid = formData.name.trim() && formData.price >= 0;

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>{title}</ModalTitle>
        </ModalHeader>

        <ModalBody className="min-w-[320px] space-y-4">
          {/* Error message */}
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </p>
            </div>
          )}

          {/* Service picker */}
          {showServicePicker && availableServices.length > 0 && (
            <Select
              label="Select Service"
              value={formData.serviceId || ''}
              onValueChange={handleServiceSelect}
              placeholder="Choose a service..."
              options={availableServices.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
            />
          )}

          {/* Service name */}
          <Input
            label="Service Name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Enter service name"
            required
            disabled={showServicePicker && !!formData.serviceId}
          />

          {/* Description */}
          <div>
            <label
              htmlFor="setup-service-description"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Description
            </label>
            <textarea
              id="setup-service-description"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe the service..."
            />
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <Select
              label="Category"
              value={formData.categoryId || ''}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, categoryId: value }))
              }
              placeholder="Select category..."
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
          )}

          {/* Price */}
          <div>
            <label
              htmlFor="setup-service-price"
              className="mb-1 block text-sm font-medium text-foreground"
            >
              Base Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <input
                id="setup-service-price"
                type="number"
                min="0"
                step="0.01"
                className="w-full rounded-md border border-input bg-background py-2 pl-7 pr-4 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    price: parseFloat(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Currently Offered
                </p>
                <p className="text-xs text-muted-foreground">
                  Service is available for orders
                </p>
              </div>
              <Switch
                className="flex-shrink-0"
                checked={formData.currentlyOffered}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    currentlyOffered: checked,
                  }))
                }
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Limited Inventory
                </p>
                <p className="text-xs text-muted-foreground">
                  Track inventory for this service
                </p>
              </div>
              <Switch
                className="flex-shrink-0"
                checked={formData.limitedInventory}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    limitedInventory: checked,
                  }))
                }
              />
            </div>

            {formData.limitedInventory && (
              <div className="ml-4 border-l-2 border-border pl-4">
                <Input
                  label="Initial Inventory"
                  type="number"
                  min="0"
                  value={formData.initialInventory || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      initialInventory: parseInt(e.target.value) || undefined,
                    }))
                  }
                  placeholder="Enter quantity"
                />
              </div>
            )}

            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Auto-Accept Referrals
                </p>
                <p className="text-xs text-muted-foreground">
                  Automatically accept incoming referrals
                </p>
              </div>
              <Switch
                className="flex-shrink-0"
                checked={formData.autoAcceptReferrals}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    autoAcceptReferrals: checked,
                  }))
                }
              />
            </div>
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
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <svg
                  className="-ml-1 mr-2 h-4 w-4 animate-spin"
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
              'Add Service'
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default SetupServiceModal;
