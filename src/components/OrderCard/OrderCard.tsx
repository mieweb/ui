'use client';

import * as React from 'react';
import { Badge } from '../Badge/Badge';
import { Card } from '../Card/Card';

export type OrderStatus =
  | 'pending'
  | 'active'
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'rejected'
  | 'invoiced'
  | 'cancelled';

export interface OrderService {
  id: string;
  name: string;
  price?: number;
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface OrderEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface OrderEmployer {
  id: string;
  name: string;
}

export interface OrderCardProps {
  /** Unique order ID */
  id: string;
  /** Order number for display */
  orderNumber: string;
  /** Current order status */
  status: OrderStatus;
  /** Employee associated with the order */
  employee: OrderEmployee;
  /** Employer who placed the order */
  employer?: OrderEmployer;
  /** Services included in the order */
  services: OrderService[];
  /** Order creation date */
  createdAt: Date;
  /** Scheduled appointment date */
  scheduledDate?: Date;
  /** Completed date */
  completedDate?: Date;
  /** Total order amount */
  totalAmount?: number;
  /** Rejection reason if rejected */
  rejectionReason?: string;
  /** Whether the card is selected */
  selected?: boolean;
  /** Click handler for the card */
  onClick?: (id: string) => void;
  /** Click handler for view action */
  onView?: (id: string) => void;
  /** Click handler for accept action */
  onAccept?: (id: string) => void;
  /** Click handler for reject action */
  onReject?: (id: string) => void;
  /** Additional CSS classes */
  className?: string;
  /** Currency code for formatting */
  currency?: string;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  active: { label: 'Active', variant: 'info' },
  scheduled: { label: 'Scheduled', variant: 'info' },
  'in-progress': { label: 'In Progress', variant: 'info' },
  completed: { label: 'Completed', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'error' },
  invoiced: { label: 'Invoiced', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'default' },
};

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  return formatDate(date);
}

function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * OrderCard displays a summary of an order/referral with employee info,
 * services, status, and quick actions.
 */
export function OrderCard({
  id,
  orderNumber,
  status,
  employee,
  employer,
  services,
  createdAt,
  scheduledDate,
  totalAmount,
  rejectionReason,
  selected = false,
  onClick,
  onView,
  onAccept,
  onReject,
  className = '',
  currency = 'USD',
}: OrderCardProps) {
  const statusInfo = statusConfig[status];
  const showActions = status === 'pending' && (onAccept || onReject);

  const handleCardClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  const handleViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onView) {
      onView(id);
    }
  };

  const handleAcceptClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAccept) {
      onAccept(id);
    }
  };

  const handleRejectClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReject) {
      onReject(id);
    }
  };

  return (
    <Card
      className={`
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${selected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}
        ${className}
      `.trim()}
      onClick={onClick ? handleCardClick : undefined}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                #{orderNumber}
              </span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p
              className="text-sm text-gray-500 dark:text-gray-400 mt-1"
              title={formatDate(createdAt)}
            >
              {formatRelativeTime(createdAt)}
            </p>
          </div>
          {totalAmount !== undefined && (
            <div className="text-right flex-shrink-0">
              <p className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(totalAmount, currency)}
              </p>
            </div>
          )}
        </div>

        {/* Employee Info */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {employee.firstName[0]}
                {employee.lastName[0]}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {employee.firstName} {employee.lastName}
              </p>
              {employer && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {employer.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            Services ({services.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {services.slice(0, 3).map((service) => (
              <span
                key={service.id}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                {service.name}
              </span>
            ))}
            {services.length > 3 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                +{services.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Scheduled Date */}
        {scheduledDate && (
          <div className="mb-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Scheduled: {formatDate(scheduledDate)}</span>
          </div>
        )}

        {/* Rejection Reason */}
        {status === 'rejected' && rejectionReason && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded text-sm text-red-700 dark:text-red-300">
            <span className="font-medium">Reason:</span> {rejectionReason}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          {onView && (
            <button
              type="button"
              onClick={handleViewClick}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
            >
              View Details
            </button>
          )}
          {showActions && (
            <div className="flex gap-2 ml-auto">
              {onReject && (
                <button
                  type="button"
                  onClick={handleRejectClick}
                  className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                >
                  Reject
                </button>
              )}
              {onAccept && (
                <button
                  type="button"
                  onClick={handleAcceptClick}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  Accept
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default OrderCard;
