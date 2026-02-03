'use client';

import * as React from 'react';
import { Avatar } from '../Avatar/Avatar';
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
  {
    label: string;
    variant: 'default' | 'success' | 'warning' | 'danger' | 'secondary';
  }
> = {
  pending: { label: 'Pending', variant: 'warning' },
  active: { label: 'Active', variant: 'default' },
  scheduled: { label: 'Scheduled', variant: 'default' },
  'in-progress': { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'danger' },
  invoiced: { label: 'Invoiced', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
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
      className={`transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} ${selected ? 'ring-primary ring-2' : ''} ${className} `.trim()}
      onClick={onClick ? handleCardClick : undefined}
    >
      <div className="p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-foreground font-semibold">
                #{orderNumber}
              </span>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <p
              className="text-muted-foreground mt-1 text-sm"
              title={formatDate(createdAt)}
            >
              {formatRelativeTime(createdAt)}
            </p>
          </div>
          {totalAmount !== undefined && (
            <div className="flex-shrink-0 text-right">
              <p className="text-foreground font-semibold">
                {formatCurrency(totalAmount, currency)}
              </p>
            </div>
          )}
        </div>

        {/* Employee Info */}
        <div className="mb-3">
          <div className="flex items-center gap-2">
            <Avatar
              name={`${employee.firstName} ${employee.lastName}`}
              size="sm"
            />
            <div className="min-w-0">
              <p className="text-foreground truncate font-medium">
                {employee.firstName} {employee.lastName}
              </p>
              {employer && (
                <p className="text-muted-foreground truncate text-sm">
                  {employer.name}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="mb-3">
          <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase">
            Services ({services.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {services.slice(0, 3).map((service) => (
              <span
                key={service.id}
                className="bg-muted text-foreground inline-flex items-center rounded px-2 py-0.5 text-xs font-medium"
              >
                {service.name}
              </span>
            ))}
            {services.length > 3 && (
              <span className="bg-muted text-muted-foreground inline-flex items-center rounded px-2 py-0.5 text-xs font-medium">
                +{services.length - 3} more
              </span>
            )}
          </div>
        </div>

        {/* Scheduled Date */}
        {scheduledDate && (
          <div className="text-muted-foreground mb-3 flex items-center gap-2 text-sm">
            <svg
              className="h-4 w-4"
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
          <div className="bg-destructive/10 text-destructive mb-3 rounded p-2 text-sm">
            <span className="font-medium">Reason:</span> {rejectionReason}
          </div>
        )}

        {/* Actions */}
        <div className="border-border flex items-center justify-between border-t pt-3">
          {onView && (
            <button
              type="button"
              onClick={handleViewClick}
              className="text-primary hover:text-primary/80 text-sm font-medium"
            >
              View Details
            </button>
          )}
          {showActions && (
            <div className="ml-auto flex gap-2">
              {onReject && (
                <button
                  type="button"
                  onClick={handleRejectClick}
                  className="text-destructive hover:bg-destructive/10 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  Reject
                </button>
              )}
              {onAccept && (
                <button
                  type="button"
                  onClick={handleAcceptClick}
                  className="bg-primary hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors"
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
