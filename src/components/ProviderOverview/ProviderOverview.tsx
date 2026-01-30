'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../Card/Card';
import { Badge } from '../Badge/Badge';

export interface ProviderStats {
  pendingOrders: number;
  completedToday: number;
  upcomingAppointments: number;
  linkedEmployers: number;
  pendingInvoices?: number;
  revenue?: number;
}

export interface QuickAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'appointment' | 'invoice' | 'employer' | 'user';
  title: string;
  description?: string;
  timestamp: Date | string;
  status?: 'pending' | 'completed' | 'cancelled';
}

export interface ProviderOverviewProps {
  /** Provider name */
  providerName: string;
  /** Provider logo URL */
  logoUrl?: string;
  /** Statistics to display */
  stats: ProviderStats;
  /** Quick action buttons */
  quickActions?: QuickAction[];
  /** Recent activity items */
  recentActivity?: RecentActivity[];
  /** Handler for clicking a stat */
  onStatClick?: (stat: keyof ProviderStats) => void;
  /** Handler for clicking a quick action */
  onQuickActionClick?: (action: QuickAction) => void;
  /** Handler for clicking an activity item */
  onActivityClick?: (activity: RecentActivity) => void;
  /** Currency symbol for revenue */
  currency?: string;
  /** Whether the data is loading */
  isLoading?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * ProviderOverview displays a dashboard overview for providers.
 */
export function ProviderOverview({
  providerName,
  logoUrl,
  stats,
  quickActions = [],
  recentActivity = [],
  onStatClick,
  onQuickActionClick,
  onActivityClick,
  currency: _currency = '$',
  isLoading = false,
  className = '',
}: ProviderOverviewProps) {
  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'order':
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        );
      case 'appointment':
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        );
      case 'invoice':
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case 'employer':
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        );
      case 'user':
        return (
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header skeleton */}
        <div className="flex animate-pulse items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={providerName}
            className="h-12 w-12 rounded-lg border border-gray-200 bg-white object-contain dark:border-gray-700 dark:bg-gray-800"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {providerName.charAt(0)}
            </span>
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {providerName}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dashboard Overview
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Pending Orders"
          value={stats.pendingOrders}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="orange"
          onClick={() => onStatClick?.('pendingOrders')}
        />
        <StatCard
          label="Completed Today"
          value={stats.completedToday}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          color="green"
          onClick={() => onStatClick?.('completedToday')}
        />
        <StatCard
          label="Upcoming"
          value={stats.upcomingAppointments}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          color="blue"
          onClick={() => onStatClick?.('upcomingAppointments')}
        />
        <StatCard
          label="Employers"
          value={stats.linkedEmployers}
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          }
          color="purple"
          onClick={() => onStatClick?.('linkedEmployers')}
        />
      </div>

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={() => {
                    action.onClick?.();
                    onQuickActionClick?.(action);
                  }}
                  className="flex flex-col items-center gap-2 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  <span className="text-gray-500 dark:text-gray-400">
                    {action.icon || (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                  </span>
                  <span className="text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  role={onActivityClick ? 'button' : undefined}
                  tabIndex={onActivityClick ? 0 : undefined}
                  onClick={() => onActivityClick?.(activity)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && onActivityClick?.(activity)
                  }
                  className={`flex items-start gap-3 rounded-lg p-2 ${onActivityClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''} `}
                >
                  <div className="rounded-full bg-gray-100 p-2 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {activity.title}
                      </p>
                      {activity.status && (
                        <Badge
                          variant={
                            activity.status === 'completed'
                              ? 'success'
                              : activity.status === 'cancelled'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {activity.status}
                        </Badge>
                      )}
                    </div>
                    {activity.description && (
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {activity.description}
                      </p>
                    )}
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                      {formatTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
  onClick?: () => void;
}

function StatCard({ label, value, icon, color, onClick }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green:
      'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    orange:
      'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    purple:
      'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={`rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 ${onClick ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600' : ''} `}
    >
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2 ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default ProviderOverview;
