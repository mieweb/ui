'use client';

import * as React from 'react';
import { Card } from '../Card/Card';
import { Badge } from '../Badge/Badge';

export interface ServiceCardProps {
  /** Service ID */
  id: string;
  /** Service name */
  name: string;
  /** Service description */
  description?: string;
  /** Base price */
  price?: number;
  /** Currency code */
  currency?: string;
  /** Whether the service is currently offered */
  currentlyOffered?: boolean;
  /** Whether inventory is limited */
  limitedInventory?: boolean;
  /** Available inventory count */
  inventoryCount?: number;
  /** Total inventory count */
  inventoryTotal?: number;
  /** Whether the service has custom availability */
  hasCustomAvailability?: boolean;
  /** Number of custom pricing tiers */
  customPricingCount?: number;
  /** Service category */
  category?: string;
  /** Tags for the service */
  tags?: string[];
  /** Click handler for card */
  onClick?: (id: string) => void;
  /** Click handler for edit action */
  onEdit?: (id: string) => void;
  /** Click handler for manage action */
  onManage?: (id: string) => void;
  /** Click handler for delete action */
  onDelete?: (id: string) => void;
  /** Whether the card is selected */
  selected?: boolean;
  /** Additional CSS classes */
  className?: string;
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * ServiceCard displays a service with pricing, availability, and inventory information.
 */
export function ServiceCard({
  id,
  name,
  description,
  price,
  currency = 'USD',
  currentlyOffered = true,
  limitedInventory = false,
  inventoryCount,
  inventoryTotal,
  hasCustomAvailability = false,
  customPricingCount = 0,
  category,
  tags = [],
  onClick,
  onEdit,
  onManage,
  onDelete,
  selected = false,
  className = '',
}: ServiceCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(id);
    }
  };

  const handleManageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onManage) {
      onManage(id);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(id);
    }
  };

  const showInventory = limitedInventory && inventoryCount !== undefined;
  const isLowInventory =
    showInventory && inventoryTotal && inventoryCount / inventoryTotal < 0.2;

  return (
    <Card
      className={`
        h-full transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${selected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
        ${!currentlyOffered ? 'opacity-60' : ''}
        ${className}
      `.trim()}
      onClick={onClick ? handleCardClick : undefined}
    >
      <div className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {name}
            </h3>
            {category && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {category}
              </p>
            )}
          </div>
          {!currentlyOffered && (
            <Badge variant="warning" size="sm">
              Not Offered
            </Badge>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price & Stats */}
        <div className="mt-auto">
          {/* Price */}
          {price !== undefined && (
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Base Price
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(price, currency)}
              </span>
            </div>
          )}

          {/* Inventory */}
          {showInventory && (
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500 dark:text-gray-400">Inventory</span>
              <span
                className={`font-medium ${isLowInventory ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}
              >
                {inventoryCount}
                {inventoryTotal && ` / ${inventoryTotal}`}
              </span>
            </div>
          )}

          {/* Custom Pricing Indicator */}
          {(hasCustomAvailability || customPricingCount > 0) && (
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              <span>
                {customPricingCount > 0
                  ? `${customPricingCount} custom pricing tier${customPricingCount > 1 ? 's' : ''}`
                  : 'Custom availability'}
              </span>
            </div>
          )}

          {/* Actions */}
          {(onEdit || onManage || onDelete) && (
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  title="Delete service"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="p-1.5 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
                  title="Edit service"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
              )}
              {onManage && (
                <button
                  type="button"
                  onClick={handleManageClick}
                  className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                >
                  Manage
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

/**
 * AddServiceCard displays a card to add a new service.
 */
export interface AddServiceCardProps {
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

export function AddServiceCard({ onClick, className = '' }: AddServiceCardProps) {
  return (
    <Card
      className={`
        h-full border-2 border-dashed border-gray-300 dark:border-gray-600
        bg-gray-50 dark:bg-gray-800/50
        hover:border-blue-400 dark:hover:border-blue-500
        hover:bg-gray-100 dark:hover:bg-gray-800
        transition-all duration-200 cursor-pointer
        ${className}
      `.trim()}
      onClick={onClick}
    >
      <div className="p-4 flex flex-col items-center justify-center h-full min-h-[160px]">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-3">
          <svg
            className="w-6 h-6 text-gray-500 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Add New Service
        </p>
      </div>
    </Card>
  );
}

export default ServiceCard;
