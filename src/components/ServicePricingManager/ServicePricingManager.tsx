'use client';

import * as React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../Card/Card';
import { Input } from '../Input/Input';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '../Modal/Modal';
import { PencilIcon } from '../Icons';

export interface ServicePrice {
  id: string;
  serviceName: string;
  serviceCode?: string;
  category?: string;
  basePrice: number;
  employerPrice?: number;
  isActive: boolean;
  lastUpdated?: Date | string;
  /** Free-text note shown under the service name */
  note?: string;
  /** Entered by hand rather than picked from the services catalog */
  isCustom?: boolean;
}

export interface ServicePricingManagerLabels {
  custom: string;
  customDescription: string;
  addNote: string;
  notePlaceholder: string;
  noteLabel: (serviceName: string) => string;
  noteSaveError: string;
  viewInCatalog: (serviceName: string) => string;
  showDetails: (serviceName: string) => string;
  hideDetails: (serviceName: string) => string;
}

export const DEFAULT_SERVICE_PRICING_MANAGER_LABELS: ServicePricingManagerLabels =
  {
    custom: 'Custom',
    customDescription: 'Not in the services catalog',
    addNote: 'Add note',
    notePlaceholder: 'Add note…',
    noteLabel: (name) => `Note for ${name}`,
    noteSaveError: "Couldn't save the note. Try again.",
    viewInCatalog: (name) => `View ${name} in the catalog`,
    showDetails: (name) => `Show details for ${name}`,
    hideDetails: (name) => `Hide details for ${name}`,
  };

export interface ServicePricingManagerProps {
  /** List of service prices */
  services: ServicePrice[];
  /** Handler for updating a service price */
  onUpdatePrice?: (
    serviceId: string,
    newPrice: number,
    priceType: 'base' | 'employer'
  ) => void;
  /** Handler for toggling service status */
  onToggleStatus?: (serviceId: string, isActive: boolean) => void;
  /** Handler for bulk update */
  onBulkUpdate?: (
    updates: {
      serviceId: string;
      price: number;
      priceType: 'base' | 'employer';
    }[]
  ) => void;
  /** Whether changes are being saved */
  isSaving?: boolean;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Filter by category */
  categories?: string[];
  /** Enables inline note editing; a rejected promise restores the previous note */
  onNoteChange?: (serviceId: string, note: string) => void | Promise<void>;
  /** Link to the service's catalog entry; return undefined to omit it */
  getServiceHref?: (service: ServicePrice) => string | undefined;
  /** Adds an expand toggle per row revealing this content */
  renderServiceDetails?: (service: ServicePrice) => React.ReactNode;
  /** Override user-facing strings for notes, custom badge, catalog link and details */
  labels?: Partial<ServicePricingManagerLabels>;
  /** Additional CSS classes */
  className?: string;
}

interface ServiceNoteProps {
  service: ServicePrice;
  onNoteChange?: ServicePricingManagerProps['onNoteChange'];
  labels: ServicePricingManagerLabels;
}

/** Note display with optional inline edit; optimistic while `onNoteChange` is pending. */
function ServiceNote({ service, onNoteChange, labels }: ServiceNoteProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState('');
  const [pending, setPending] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const cancelRef = React.useRef(false);
  const refocusRef = React.useRef(false);
  const note = pending ?? service.note ?? '';

  React.useEffect(() => {
    if (editing) inputRef.current?.focus();
    else if (refocusRef.current) {
      refocusRef.current = false;
      buttonRef.current?.focus();
    }
  }, [editing]);

  if (!onNoteChange) {
    return note ? (
      <p className="text-muted-foreground text-sm">{note}</p>
    ) : null;
  }

  const commit = async () => {
    setEditing(false);
    const next = draft.trim();
    if (cancelRef.current || next === (service.note ?? '')) {
      cancelRef.current = false;
      return;
    }
    setPending(next);
    setFailed(false);
    try {
      await onNoteChange(service.id, next);
    } catch {
      setFailed(true);
    } finally {
      setPending(null);
    }
  };

  return (
    <div data-slot="service-pricing-note" className="mt-1">
      {editing ? (
        <Input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== 'Escape') return;
            e.preventDefault();
            cancelRef.current = e.key === 'Escape';
            refocusRef.current = true;
            e.currentTarget.blur();
          }}
          placeholder={labels.notePlaceholder}
          aria-label={labels.noteLabel(service.serviceName)}
          size="sm"
        />
      ) : (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (pending !== null) return;
            setDraft(note);
            setEditing(true);
          }}
          // aria-disabled (not disabled) keeps focus on the button while saving
          aria-disabled={pending !== null}
          aria-busy={pending !== null}
          aria-label={`${labels.noteLabel(service.serviceName)}: ${note || labels.addNote}`}
          className={cn(
            'w-full truncate rounded text-start text-sm',
            'hover:text-primary-600 dark:hover:text-primary-400',
            'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
            'aria-disabled:opacity-60',
            note ? 'text-muted-foreground' : 'text-muted-foreground text-xs'
          )}
        >
          {note || labels.addNote}
        </button>
      )}
      {failed && (
        <p
          role="alert"
          className="text-destructive-700 dark:text-destructive-400 text-xs"
        >
          {labels.noteSaveError}
        </p>
      )}
    </div>
  );
}

/**
 * ServicePricingManager displays and manages service pricing for providers.
 */
export function ServicePricingManager({
  services,
  onUpdatePrice,
  onToggleStatus,
  onBulkUpdate,
  isSaving = false,
  isLoading = false,
  categories: _categories = [],
  onNoteChange,
  getServiceHref,
  renderServiceDetails,
  labels: labelsProp,
  className = '',
}: ServicePricingManagerProps) {
  const labels = { ...DEFAULT_SERVICE_PRICING_MANAGER_LABELS, ...labelsProp };
  const detailsIdPrefix = React.useId();
  const [expandedIds, setExpandedIds] = React.useState<ReadonlySet<string>>(
    () => new Set()
  );
  const toggleExpanded = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(
    null
  );
  const [editingService, setEditingService] =
    React.useState<ServicePrice | null>(null);
  const [editPrice, setEditPrice] = React.useState<string>('');
  const [editEmployerPrice, setEditEmployerPrice] = React.useState<string>('');
  const [showBulkModal, setShowBulkModal] = React.useState(false);
  const [bulkAdjustment, setBulkAdjustment] = React.useState<string>('');
  const [bulkAdjustmentType, setBulkAdjustmentType] = React.useState<
    'percent' | 'fixed'
  >('percent');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Filter services
  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.serviceCode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || service.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Unique categories from services
  const uniqueCategories = Array.from(
    new Set(
      services
        .map((s) => s.category)
        .filter((c): c is string => c !== undefined)
    )
  );

  const handleEditClick = (service: ServicePrice) => {
    setEditingService(service);
    setEditPrice(service.basePrice.toString());
    setEditEmployerPrice(service.employerPrice?.toString() || '');
  };

  const handleSaveEdit = () => {
    if (!editingService || !onUpdatePrice) return;

    const newBasePrice = parseFloat(editPrice);
    if (!isNaN(newBasePrice) && newBasePrice !== editingService.basePrice) {
      onUpdatePrice(editingService.id, newBasePrice, 'base');
    }

    const newEmployerPrice = parseFloat(editEmployerPrice);
    if (
      !isNaN(newEmployerPrice) &&
      newEmployerPrice !== editingService.employerPrice
    ) {
      onUpdatePrice(editingService.id, newEmployerPrice, 'employer');
    }

    setEditingService(null);
  };

  const handleBulkAdjust = () => {
    if (!onBulkUpdate || !bulkAdjustment) return;

    const adjustment = parseFloat(bulkAdjustment);
    if (isNaN(adjustment)) return;

    const updates = filteredServices.map((service) => {
      let newPrice = service.basePrice;
      if (bulkAdjustmentType === 'percent') {
        newPrice = service.basePrice * (1 + adjustment / 100);
      } else {
        newPrice = service.basePrice + adjustment;
      }
      return {
        serviceId: service.id,
        price: Math.max(0, Math.round(newPrice * 100) / 100),
        priceType: 'base' as const,
      };
    });

    onBulkUpdate(updates);
    setShowBulkModal(false);
    setBulkAdjustment('');
  };

  if (isLoading) {
    return (
      <div
        data-slot="service-pricing-manager"
        className={cn('animate-pulse space-y-4', className)}
      >
        <div className="h-12 w-1/2 rounded-lg bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 rounded-lg bg-gray-200 dark:bg-gray-700" />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      data-slot="service-pricing-manager"
      className={cn('space-y-6', className)}
    >
      {/* Header */}
      <div
        data-slot="service-pricing-header"
        className="flex flex-col justify-between gap-4 md:flex-row md:items-center"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Service Pricing
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage pricing for {services.length} services
          </p>
        </div>
        {onBulkUpdate && (
          <Button variant="outline" onClick={() => setShowBulkModal(true)}>
            Bulk Adjust Prices
          </Button>
        )}
      </div>

      {/* Filters */}
      <div data-slot="service-pricing-filters">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex-1">
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              {uniqueCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === null ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                  >
                    All
                  </Button>
                  {uniqueCategories.map((category) => (
                    <Button
                      key={category}
                      variant={
                        selectedCategory === category ? 'primary' : 'ghost'
                      }
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services List */}
      <div data-slot="service-pricing-table">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Services ({filteredServices.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredServices.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center">
                No services found
              </p>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Desktop header */}
                <div className="text-muted-foreground hidden gap-4 py-3 text-xs font-medium uppercase md:grid md:grid-cols-6">
                  <div className="col-span-2">Service</div>
                  <div className="text-end">Base Price</div>
                  <div className="text-end">Employer Price</div>
                  <div className="text-center">Status</div>
                  <div className="text-end">Actions</div>
                </div>

                {filteredServices.map((service, index) => {
                  const href = getServiceHref?.(service);
                  const expanded = expandedIds.has(service.id);
                  // Row position, not `service.id`: an ID with whitespace would
                  // turn the `aria-controls` IDREF into a multi-ID list.
                  const detailsId = `${detailsIdPrefix}-details-${index}`;
                  return (
                    <div
                      key={service.id}
                      data-slot="service-pricing-row"
                      className="items-center gap-4 py-4 md:grid md:grid-cols-6"
                    >
                      {/* Service info */}
                      <div className="col-span-2 mb-2 min-w-0 md:mb-0">
                        <div className="flex items-center gap-2">
                          {renderServiceDetails && (
                            <button
                              type="button"
                              onClick={() => toggleExpanded(service.id)}
                              aria-expanded={expanded}
                              aria-controls={detailsId}
                              aria-label={(expanded
                                ? labels.hideDetails
                                : labels.showDetails)(service.serviceName)}
                              className="text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-ring flex h-6 w-6 shrink-0 items-center justify-center rounded focus-visible:ring-2 focus-visible:outline-none"
                            >
                              <ChevronRight
                                aria-hidden
                                className={cn(
                                  'h-4 w-4 transition-transform motion-reduce:transition-none rtl:-scale-x-100',
                                  expanded && 'rotate-90 rtl:-rotate-90'
                                )}
                              />
                            </button>
                          )}
                          <p className="font-medium text-gray-900 dark:text-white">
                            {service.serviceName}
                          </p>
                          {service.isCustom && (
                            <Badge
                              variant="warning"
                              size="sm"
                              title={labels.customDescription}
                            >
                              {labels.custom}
                              <span className="sr-only">
                                {`: ${labels.customDescription}`}
                              </span>
                            </Badge>
                          )}
                          {href && (
                            <a
                              href={href}
                              aria-label={labels.viewInCatalog(
                                service.serviceName
                              )}
                              title={labels.viewInCatalog(service.serviceName)}
                              className="text-muted-foreground hover:text-primary-600 dark:hover:text-primary-400 focus-visible:ring-ring rounded focus-visible:ring-2 focus-visible:outline-none"
                            >
                              <ExternalLink
                                aria-hidden
                                className="h-3.5 w-3.5"
                              />
                            </a>
                          )}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 text-sm">
                          {service.serviceCode && (
                            <span>{service.serviceCode}</span>
                          )}
                          {service.category && (
                            <Badge variant="secondary">
                              {service.category}
                            </Badge>
                          )}
                        </div>
                        <ServiceNote
                          service={service}
                          onNoteChange={onNoteChange}
                          labels={labels}
                        />
                      </div>

                      {/* Base price */}
                      <div className="mb-2 flex items-center justify-between md:mb-0 md:block">
                        <span className="text-muted-foreground text-sm md:hidden">
                          Base:
                        </span>
                        <p className="text-end font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(service.basePrice)}
                        </p>
                      </div>

                      {/* Employer price */}
                      <div className="mb-2 flex items-center justify-between md:mb-0 md:block">
                        <span className="text-muted-foreground text-sm md:hidden">
                          Employer:
                        </span>
                        <p className="text-muted-foreground text-end">
                          {service.employerPrice
                            ? formatCurrency(service.employerPrice)
                            : '—'}
                        </p>
                      </div>

                      {/* Status */}
                      <div className="mb-2 flex items-center md:mb-0 md:justify-center">
                        <span className="text-muted-foreground me-2 text-sm md:hidden">
                          Status:
                        </span>
                        <Badge
                          variant={service.isActive ? 'success' : 'secondary'}
                        >
                          {service.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end gap-2">
                        {onToggleStatus && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onToggleStatus(service.id, !service.isActive)
                            }
                          >
                            {service.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                        {onUpdatePrice && (
                          <Button
                            variant="ghost"
                            size="sm"
                            leftIcon={<PencilIcon className="h-3.5 w-3.5" />}
                            onClick={() => handleEditClick(service)}
                          >
                            Edit
                          </Button>
                        )}
                      </div>

                      {renderServiceDetails && (
                        <div
                          id={detailsId}
                          data-slot="service-pricing-details"
                          hidden={!expanded}
                          className="bg-muted/40 mt-3 rounded-md p-3 text-sm md:col-span-6 md:mt-0"
                        >
                          {expanded && renderServiceDetails(service)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Price Modal */}
      <Modal
        open={!!editingService}
        onOpenChange={() => setEditingService(null)}
      >
        <ModalHeader>
          <ModalTitle>Edit Service Price</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <p className="font-medium text-gray-900 dark:text-white">
            {editingService?.serviceName}
          </p>
          <div>
            <label
              htmlFor="edit-base-price"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Base Price
            </label>
            <Input
              id="edit-base-price"
              type="number"
              step="0.01"
              min="0"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
            />
          </div>
          <div>
            <label
              htmlFor="edit-employer-price"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Employer Price (optional)
            </label>
            <Input
              id="edit-employer-price"
              type="number"
              step="0.01"
              min="0"
              value={editEmployerPrice}
              onChange={(e) => setEditEmployerPrice(e.target.value)}
              placeholder="Leave empty for default"
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setEditingService(null)}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </ModalFooter>
      </Modal>

      {/* Bulk Adjust Modal */}
      <Modal open={showBulkModal} onOpenChange={setShowBulkModal}>
        <ModalHeader>
          <ModalTitle>Bulk Price Adjustment</ModalTitle>
        </ModalHeader>
        <ModalBody className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Apply adjustment to {filteredServices.length} filtered services
          </p>
          <div className="flex gap-2">
            <Button
              variant={bulkAdjustmentType === 'percent' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setBulkAdjustmentType('percent')}
            >
              Percentage
            </Button>
            <Button
              variant={bulkAdjustmentType === 'fixed' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setBulkAdjustmentType('fixed')}
            >
              Fixed Amount
            </Button>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {bulkAdjustmentType === 'percent'
                ? 'Percentage Change (%)'
                : 'Amount Change ($)'}
            </label>
            <Input
              type="number"
              step={bulkAdjustmentType === 'percent' ? '1' : '0.01'}
              value={bulkAdjustment}
              onChange={(e) => setBulkAdjustment(e.target.value)}
              placeholder={
                bulkAdjustmentType === 'percent' ? 'e.g., 5' : 'e.g., 10.00'
              }
            />
            <p className="text-muted-foreground mt-1 text-xs">
              Use negative values to decrease prices
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowBulkModal(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleBulkAdjust}
            disabled={isSaving || !bulkAdjustment}
          >
            {isSaving ? 'Applying...' : 'Apply Adjustment'}
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

export default ServicePricingManager;
