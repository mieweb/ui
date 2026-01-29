'use client';

import * as React from 'react';
import { Button } from '../Button/Button';
import { Badge } from '../Badge/Badge';

export interface OrderSidebarProps {
  /** Order ID */
  orderId?: string;
  /** Current order status */
  status?: string;
  /** Patient/Employee name */
  patientName?: string;
  /** Employer name */
  employerName?: string;
  /** Service name */
  serviceName?: string;
  /** Order creation date */
  createdAt?: Date | string;
  /** Scheduled date */
  scheduledDate?: Date | string;
  /** Priority level */
  priority?: 'normal' | 'urgent' | 'stat';
  /** Notes about the order */
  notes?: string;
  /** Whether the sidebar is open */
  open?: boolean;
  /** Handler for closing the sidebar */
  onClose?: () => void;
  /** Actions available for this order */
  actions?: Array<{
    id: string;
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    disabled?: boolean;
  }>;
  /** Additional content to render */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * OrderSidebar displays order details in a slide-out panel.
 */
export function OrderSidebar({
  orderId,
  status,
  patientName,
  employerName,
  serviceName,
  createdAt,
  scheduledDate,
  priority = 'normal',
  notes,
  open = false,
  onClose,
  actions = [],
  children,
  className = '',
}: OrderSidebarProps) {
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'Not set';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusVariant = (
    s?: string
  ): 'default' | 'secondary' | 'success' | 'warning' | 'danger' => {
    switch (s?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
      case 'in progress':
        return 'warning';
      case 'cancelled':
      case 'rejected':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'stat':
        return 'text-red-600 dark:text-red-400';
      case 'urgent':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-gray-900
          shadow-xl z-50 transform transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}
          ${className}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Order details"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Order Details
            </h2>
            {orderId && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                #{orderId}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close sidebar"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto h-[calc(100%-8rem)]">
          {/* Status & Priority */}
          <div className="flex items-center gap-2 mb-4">
            {status && (
              <Badge variant={getStatusVariant(status)}>{status}</Badge>
            )}
            {priority !== 'normal' && (
              <span className={`text-xs font-medium uppercase ${getPriorityColor()}`}>
                {priority}
              </span>
            )}
          </div>

          {/* Details */}
          <dl className="space-y-4">
            {patientName && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Patient
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {patientName}
                </dd>
              </div>
            )}

            {employerName && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Employer
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {employerName}
                </dd>
              </div>
            )}

            {serviceName && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Service
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {serviceName}
                </dd>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Created
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(createdAt)}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Scheduled
                </dt>
                <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                  {formatDate(scheduledDate)}
                </dd>
              </div>
            </div>

            {notes && (
              <div>
                <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Notes
                </dt>
                <dd className="mt-1 text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {notes}
                </dd>
              </div>
            )}
          </dl>

          {/* Additional content */}
          {children && <div className="mt-6">{children}</div>}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex flex-wrap gap-2">
              {actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'primary'}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="flex-1"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default OrderSidebar;
