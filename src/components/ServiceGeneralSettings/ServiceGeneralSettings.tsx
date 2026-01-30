'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card/Card';
import { Input } from '../Input/Input';
import { Select } from '../Select/Select';
import { Switch } from '../Switch/Switch';
import { Button } from '../Button/Button';

export interface ServiceGeneralSettingsProps {
  /** Service name */
  name?: string;
  /** Handler for name change */
  onNameChange?: (value: string) => void;
  /** Service description */
  description?: string;
  /** Handler for description change */
  onDescriptionChange?: (value: string) => void;
  /** Service code/SKU */
  serviceCode?: string;
  /** Handler for service code change */
  onServiceCodeChange?: (value: string) => void;
  /** Selected category ID */
  categoryId?: string;
  /** Handler for category change */
  onCategoryChange?: (categoryId: string) => void;
  /** Available categories */
  categories?: Array<{ id: string; name: string }>;
  /** Base price */
  basePrice?: number;
  /** Handler for price change */
  onBasePriceChange?: (value: number) => void;
  /** Whether service is active */
  isActive?: boolean;
  /** Handler for active toggle */
  onIsActiveChange?: (active: boolean) => void;
  /** Whether service is featured */
  isFeatured?: boolean;
  /** Handler for featured toggle */
  onIsFeaturedChange?: (featured: boolean) => void;
  /** Turnaround time in days */
  turnaroundDays?: number;
  /** Handler for turnaround change */
  onTurnaroundDaysChange?: (days: number) => void;
  /** CPT code */
  cptCode?: string;
  /** Handler for CPT code change */
  onCptCodeChange?: (value: string) => void;
  /** Handler for saving settings */
  onSave?: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ServiceGeneralSettings manages general configuration for a service.
 */
export function ServiceGeneralSettings({
  name = '',
  onNameChange,
  description = '',
  onDescriptionChange,
  serviceCode = '',
  onServiceCodeChange,
  categoryId,
  onCategoryChange,
  categories = [],
  basePrice = 0,
  onBasePriceChange,
  isActive = true,
  onIsActiveChange,
  isFeatured = false,
  onIsFeaturedChange,
  turnaroundDays,
  onTurnaroundDaysChange,
  cptCode = '',
  onCptCodeChange,
  onSave,
  isSaving = false,
  errorMessage,
  className = '',
}: ServiceGeneralSettingsProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">General Settings</CardTitle>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Basic service information and configuration
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Error message */}
        {errorMessage && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm text-red-600 dark:text-red-400">
              {errorMessage}
            </p>
          </div>
        )}

        {/* Status toggles */}
        <div className="flex flex-wrap gap-6 border-b border-gray-200 pb-4 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Switch checked={isActive} onCheckedChange={onIsActiveChange} />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Active
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Service is available for orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={isFeatured} onCheckedChange={onIsFeaturedChange} />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                Featured
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Show prominently in listings
              </p>
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div className="space-y-4">
          <Input
            label="Service Name"
            value={name}
            onChange={(e) => onNameChange?.(e.target.value)}
            placeholder="Enter service name"
            required
          />

          <div>
            <label
              htmlFor="service-description"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </label>
            <textarea
              id="service-description"
              className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              rows={3}
              value={description}
              onChange={(e) => onDescriptionChange?.(e.target.value)}
              placeholder="Describe the service..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Service Code / SKU"
              value={serviceCode}
              onChange={(e) => onServiceCodeChange?.(e.target.value)}
              placeholder="e.g., DOT-5P"
            />

            {categories.length > 0 && (
              <Select
                label="Category"
                value={categoryId || ''}
                onValueChange={(value) => onCategoryChange?.(value)}
                placeholder="Select category..."
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
              />
            )}
          </div>
        </div>

        {/* Pricing and timing */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Pricing & Timing
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="base-price"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Base Price
              </label>
              <div className="relative">
                <span className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  id="base-price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-7 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  value={basePrice}
                  onChange={(e) =>
                    onBasePriceChange?.(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="turnaround-days"
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Turnaround Time
              </label>
              <div className="relative">
                <input
                  id="turnaround-days"
                  type="number"
                  min="0"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 pr-16 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  value={turnaroundDays ?? ''}
                  onChange={(e) =>
                    onTurnaroundDaysChange?.(parseInt(e.target.value) || 0)
                  }
                  placeholder="0"
                />
                <span className="absolute top-1/2 right-3 -translate-y-1/2 text-sm text-gray-500">
                  days
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Billing codes */}
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Billing Information
          </p>

          <Input
            label="CPT Code"
            value={cptCode}
            onChange={(e) => onCptCodeChange?.(e.target.value)}
            placeholder="e.g., 80305"
          />
        </div>

        {/* Save button */}
        {onSave && (
          <div className="flex justify-end border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ServiceGeneralSettings;
