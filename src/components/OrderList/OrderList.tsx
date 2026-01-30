'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';

export type OrderStatus =
  | 'pending'
  | 'active'
  | 'scheduled'
  | 'in-progress'
  | 'completed'
  | 'rejected'
  | 'invoiced'
  | 'cancelled';

export interface OrderListTab {
  /** Unique identifier for the tab */
  id: string;
  /** Display label */
  label: string;
  /** Count badge number */
  count?: number;
  /** Filter status(es) for this tab */
  statuses?: OrderStatus[];
}

export interface OrderListProps<T> {
  /** List of orders */
  orders: T[];
  /** Currently active tab ID */
  activeTab: string;
  /** Available tabs */
  tabs: OrderListTab[];
  /** Handler for tab change */
  onTabChange?: (tabId: string) => void;
  /** Render function for each order item */
  renderOrder: (order: T, index: number) => React.ReactNode;
  /** Get status from order item */
  getOrderStatus?: (order: T) => OrderStatus;
  /** Loading state */
  isLoading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Empty state icon */
  emptyIcon?: React.ReactNode;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search value */
  searchValue?: string;
  /** Handler for search change */
  onSearchChange?: (value: string) => void;
  /** Whether to show search */
  showSearch?: boolean;
  /** Additional actions slot */
  actions?: React.ReactNode;
  /** Additional class name */
  className?: string;
}

/**
 * OrderList provides a tabbed list view for orders with filtering and search.
 */
export function OrderList<T>({
  orders,
  activeTab,
  tabs,
  onTabChange,
  renderOrder,
  getOrderStatus,
  isLoading = false,
  emptyMessage = 'No orders found',
  emptyIcon,
  searchPlaceholder = 'Search orders...',
  searchValue = '',
  onSearchChange,
  showSearch = false,
  actions,
  className,
}: OrderListProps<T>) {
  // Filter orders by active tab
  const filteredOrders = React.useMemo(() => {
    const activeTabConfig = tabs.find((t) => t.id === activeTab);
    if (!activeTabConfig?.statuses || !getOrderStatus) {
      return orders;
    }
    return orders.filter((order) =>
      activeTabConfig.statuses!.includes(getOrderStatus(order))
    );
  }, [orders, activeTab, tabs, getOrderStatus]);

  // Get counts for each tab
  const tabCounts = React.useMemo(() => {
    if (!getOrderStatus) return {};
    const counts: Record<string, number> = {};
    tabs.forEach((tab) => {
      if (tab.statuses) {
        counts[tab.id] = orders.filter((order) =>
          tab.statuses!.includes(getOrderStatus(order))
        ).length;
      } else {
        counts[tab.id] = orders.length;
      }
    });
    return counts;
  }, [orders, tabs, getOrderStatus]);

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Header with tabs and actions */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-4 px-4 pb-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const count = tab.count ?? tabCounts[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                  )}
                >
                  {tab.label}
                  {count !== undefined && (
                    <span
                      className={cn(
                        'ml-2 rounded-full px-2 py-0.5 text-xs',
                        activeTab === tab.id
                          ? 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions and search */}
          <div className="flex items-center gap-2">
            {showSearch && (
              <div className="relative">
                <svg
                  className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white py-2 pr-4 pl-9 text-sm text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            )}
            {actions}
          </div>
        </div>
      </div>

      {/* Order list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg
              className="h-8 w-8 animate-spin text-blue-500"
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
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            {emptyIcon || (
              <svg
                className="mb-4 h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            )}
            <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredOrders.map((order, index) => (
              <div key={index}>{renderOrder(order, index)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Predefined tabs for common use cases
export const defaultOrderTabs: OrderListTab[] = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending', statuses: ['pending'] },
  {
    id: 'active',
    label: 'Active',
    statuses: ['active', 'scheduled', 'in-progress'],
  },
  { id: 'completed', label: 'Completed', statuses: ['completed'] },
  { id: 'invoiced', label: 'Invoiced', statuses: ['invoiced'] },
  { id: 'rejected', label: 'Rejected', statuses: ['rejected', 'cancelled'] },
];

export default OrderList;
