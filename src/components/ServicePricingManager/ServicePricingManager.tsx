'use client';

import * as React from 'react';
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
}

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
  /** Additional CSS classes */
  className?: string;
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
  className = '',
}: ServicePricingManagerProps) {
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
      <div className={`animate-pulse space-y-4 ${className}`}>
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
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Service Pricing
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
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

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Services ({filteredServices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredServices.length === 0 ? (
            <p className="py-8 text-center text-gray-500 dark:text-gray-400">
              No services found
            </p>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {/* Desktop header */}
              <div className="hidden gap-4 py-3 text-xs font-medium text-gray-500 uppercase md:grid md:grid-cols-6 dark:text-gray-400">
                <div className="col-span-2">Service</div>
                <div className="text-right">Base Price</div>
                <div className="text-right">Employer Price</div>
                <div className="text-center">Status</div>
                <div className="text-right">Actions</div>
              </div>

              {filteredServices.map((service) => (
                <div
                  key={service.id}
                  className="items-center gap-4 py-4 md:grid md:grid-cols-6"
                >
                  {/* Service info */}
                  <div className="col-span-2 mb-2 md:mb-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {service.serviceName}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      {service.serviceCode && (
                        <span>{service.serviceCode}</span>
                      )}
                      {service.category && (
                        <Badge variant="secondary">{service.category}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Base price */}
                  <div className="mb-2 flex items-center justify-between md:mb-0 md:block">
                    <span className="text-sm text-gray-500 md:hidden">
                      Base:
                    </span>
                    <p className="text-right font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(service.basePrice)}
                    </p>
                  </div>

                  {/* Employer price */}
                  <div className="mb-2 flex items-center justify-between md:mb-0 md:block">
                    <span className="text-sm text-gray-500 md:hidden">
                      Employer:
                    </span>
                    <p className="text-right text-gray-600 dark:text-gray-300">
                      {service.employerPrice
                        ? formatCurrency(service.employerPrice)
                        : '—'}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="mb-2 flex items-center md:mb-0 md:justify-center">
                    <span className="mr-2 text-sm text-gray-500 md:hidden">
                      Status:
                    </span>
                    <Badge variant={service.isActive ? 'success' : 'secondary'}>
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
                        onClick={() => handleEditClick(service)}
                      >
                        <PencilIcon className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
          <p className="text-sm text-gray-500 dark:text-gray-400">
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
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
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
