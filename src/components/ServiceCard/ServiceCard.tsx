'use client';

import { Pencil, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import * as React from 'react';

import { Badge } from '../Badge/Badge';
import { Card } from '../Card/Card';

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
      className={`h-full transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${selected ? 'ring-primary ring-2' : ''} ${!currentlyOffered ? 'opacity-60' : ''} ${className} `.trim()}
      onClick={onClick ? handleCardClick : undefined}
    >
      <div className="flex h-full flex-col p-4">
        {/* Header */}
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground">{name}</h3>
            {category && (
              <p className="mt-0.5 text-xs text-muted-foreground">{category}</p>
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
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-xs text-muted-foreground">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price & Stats */}
        <div className="mt-auto">
          {/* Price */}
          {price !== undefined && (
            <div className="mb-2 flex items-baseline justify-between">
              <span className="text-xs font-medium uppercase text-muted-foreground">
                Base Price
              </span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(price, currency)}
              </span>
            </div>
          )}

          {/* Inventory */}
          {showInventory && (
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Inventory</span>
              <span
                className={`font-medium ${isLowInventory ? 'text-destructive' : 'text-foreground'}`}
              >
                {inventoryCount}
                {inventoryTotal && ` / ${inventoryTotal}`}
              </span>
            </div>
          )}

          {/* Custom Pricing Indicator */}
          {(hasCustomAvailability || customPricingCount > 0) && (
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>
                {customPricingCount > 0
                  ? `${customPricingCount} custom pricing tier${customPricingCount > 1 ? 's' : ''}`
                  : 'Custom availability'}
              </span>
            </div>
          )}

          {/* Actions */}
          {(onEdit || onManage || onDelete) && (
            <div className="flex items-center gap-2 border-t border-border pt-2">
              {onDelete && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="p-1.5 text-muted-foreground transition-colors hover:text-destructive"
                  title="Delete service"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="hover:text-primary p-1.5 text-muted-foreground transition-colors"
                  title="Edit service"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              )}
              {onManage && (
                <button
                  type="button"
                  onClick={handleManageClick}
                  className="text-primary hover:bg-primary/10 ml-auto rounded px-3 py-1 text-sm font-medium transition-colors"
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

export function AddServiceCard({
  onClick,
  className = '',
}: AddServiceCardProps) {
  return (
    <Card
      className={`bg-muted/50 hover:border-primary h-full cursor-pointer border-2 border-dashed border-border transition-all duration-200 hover:bg-muted ${className} `.trim()}
      onClick={onClick}
    >
      <div className="flex h-full min-h-[160px] flex-col items-center justify-center p-4">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Plus className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Add New Service
        </p>
      </div>
    </Card>
  );
}

export default ServiceCard;
