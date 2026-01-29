'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card/Card';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';

export interface PricingTier {
  id: string;
  name: string;
  price: number;
  minQuantity?: number;
  maxQuantity?: number;
  description?: string;
  isDefault?: boolean;
}

export interface EmployerPricingCardProps {
  /** Service or product name */
  serviceName: string;
  /** Base price when no tier applies */
  basePrice: number;
  /** Pricing tiers for this service */
  tiers?: PricingTier[];
  /** Currency symbol */
  currency?: string;
  /** Handler for editing pricing */
  onEdit?: () => void;
  /** Handler for removing pricing */
  onRemove?: () => void;
  /** Whether editing is allowed */
  editable?: boolean;
  /** Whether the pricing is active */
  isActive?: boolean;
  /** Custom notes about pricing */
  notes?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * EmployerPricingCard displays service pricing for a specific employer.
 */
export function EmployerPricingCard({
  serviceName,
  basePrice,
  tiers = [],
  currency = '$',
  onEdit,
  onRemove,
  editable = true,
  isActive = true,
  notes,
  className = '',
}: EmployerPricingCardProps) {
  const formatPrice = (price: number) => {
    return `${currency}${price.toFixed(2)}`;
  };

  const formatQuantityRange = (tier: PricingTier) => {
    if (tier.minQuantity !== undefined && tier.maxQuantity !== undefined) {
      return `${tier.minQuantity}-${tier.maxQuantity}`;
    }
    if (tier.minQuantity !== undefined) {
      return `${tier.minQuantity}+`;
    }
    return 'Any quantity';
  };

  return (
    <Card
      className={`${className} ${!isActive ? 'opacity-60' : ''}`}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex-1">
          <CardTitle className="text-base font-semibold">
            {serviceName}
          </CardTitle>
          {!isActive && (
            <Badge variant="secondary" className="mt-1">
              Inactive
            </Badge>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatPrice(basePrice)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">base price</p>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Pricing tiers */}
        {tiers.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Volume Pricing
            </p>
            <div className="space-y-1">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {tier.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({formatQuantityRange(tier)})
                    </span>
                    {tier.isDefault && (
                      <Badge variant="outline" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatPrice(tier.price)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {notes && (
          <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              <span className="font-medium">Note:</span> {notes}
            </p>
          </div>
        )}

        {/* Actions */}
        {editable && (
          <div className="mt-4 flex gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <svg
                  className="w-3.5 h-3.5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                Edit Pricing
              </Button>
            )}
            {onRemove && (
              <Button variant="ghost" size="sm" onClick={onRemove}>
                <svg
                  className="w-3.5 h-3.5 mr-1 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Remove
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EmployerPricingCard;
