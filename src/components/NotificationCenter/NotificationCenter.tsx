'use client';

import * as React from 'react';
import { Badge } from '../Badge/Badge';
import { Button } from '../Button/Button';
import { Avatar } from '../Avatar/Avatar';

export interface Notification {
  id: string;
  type: 'order' | 'invoice' | 'claim' | 'message' | 'system' | 'alert';
  title: string;
  message: string;
  timestamp: Date | string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  senderName?: string;
  senderAvatar?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface NotificationCenterProps {
  /** List of notifications */
  notifications: Notification[];
  /** Handler for marking notification as read */
  onMarkRead?: (notificationId: string) => void;
  /** Handler for marking all as read */
  onMarkAllRead?: () => void;
  /** Handler for clicking a notification */
  onNotificationClick?: (notification: Notification) => void;
  /** Handler for dismissing a notification */
  onDismiss?: (notificationId: string) => void;
  /** Handler for clearing all notifications */
  onClearAll?: () => void;
  /** Whether data is loading */
  isLoading?: boolean;
  /** Maximum notifications to show before "See all" */
  maxVisible?: number;
  /** Handler for "See all" click */
  onSeeAll?: () => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * NotificationCenter displays a list of notifications with actions.
 */
export function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNotificationClick,
  onDismiss,
  onClearAll,
  isLoading = false,
  maxVisible,
  onSeeAll,
  emptyMessage = 'No new notifications',
  className = '',
}: NotificationCenterProps) {
  const formatTimestamp = (timestamp: Date | string) => {
    const date =
      typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'order':
        return (
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        );
      case 'invoice':
        return (
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        );
      case 'claim':
        return (
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        );
      case 'message':
        return (
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
      case 'alert':
        return (
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
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      default:
        return (
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
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
        );
    }
  };

  const getTypeColor = (
    type: Notification['type'],
    priority?: Notification['priority']
  ) => {
    if (priority === 'urgent')
      return 'text-red-500 bg-red-100 dark:bg-red-900/30';
    if (priority === 'high')
      return 'text-orange-500 bg-orange-100 dark:bg-orange-900/30';

    switch (type) {
      case 'order':
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      case 'invoice':
        return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case 'claim':
        return 'text-purple-500 bg-purple-100 dark:bg-purple-900/30';
      case 'message':
        return 'text-cyan-500 bg-cyan-100 dark:bg-cyan-900/30';
      case 'alert':
        return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const visibleNotifications = maxVisible
    ? notifications.slice(0, maxVisible)
    : notifications;
  const hasMore = maxVisible && notifications.length > maxVisible;

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Notifications
          </h2>
          {unreadCount > 0 && <Badge variant="default">{unreadCount}</Badge>}
        </div>
        <div className="flex items-center gap-2">
          {onMarkAllRead && unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
              Mark all read
            </Button>
          )}
          {onClearAll && notifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={onClearAll}>
              Clear all
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="py-12 text-center">
          <svg
            className="mx-auto mb-3 h-12 w-12 text-gray-400 dark:text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      ) : (
        <div className="max-h-[400px] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
          {visibleNotifications.map((notification) => (
            <div
              key={notification.id}
              role="button"
              tabIndex={0}
              className={`cursor-pointer px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
              }`}
              onClick={() => {
                if (onNotificationClick) {
                  onNotificationClick(notification);
                }
                if (onMarkRead && !notification.isRead) {
                  onMarkRead(notification.id);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (onNotificationClick) {
                    onNotificationClick(notification);
                  }
                  if (onMarkRead && !notification.isRead) {
                    onMarkRead(notification.id);
                  }
                }
              }}
            >
              <div className="flex gap-3">
                {/* Icon or Avatar */}
                {notification.senderAvatar || notification.senderName ? (
                  <Avatar
                    src={notification.senderAvatar}
                    name={notification.senderName}
                    size="sm"
                  />
                ) : (
                  <div
                    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${getTypeColor(notification.type, notification.priority)}`}
                  >
                    {getTypeIcon(notification.type)}
                  </div>
                )}

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        !notification.isRead
                          ? 'font-semibold text-gray-900 dark:text-white'
                          : 'font-medium text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {notification.title}
                    </p>
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {notification.priority === 'urgent' && (
                        <Badge variant="danger">Urgent</Badge>
                      )}
                      {notification.priority === 'high' && (
                        <Badge variant="warning">High</Badge>
                      )}
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-gray-500 dark:text-gray-400">
                    {notification.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                    <div className="flex items-center gap-2">
                      {notification.actionLabel && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onNotificationClick) {
                              onNotificationClick(notification);
                            }
                          }}
                        >
                          {notification.actionLabel}
                        </Button>
                      )}
                      {onDismiss && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-1 text-xs opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(notification.id);
                          }}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {hasMore && onSeeAll && (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <Button variant="ghost" className="w-full" onClick={onSeeAll}>
            See all notifications
          </Button>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
