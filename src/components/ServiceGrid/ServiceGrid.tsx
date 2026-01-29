'use client';

import * as React from 'react';
import { cn } from '../../utils/cn';
import { ServiceCard, AddServiceCard, ServiceCardProps } from '../ServiceCard/ServiceCard';

export interface ServiceGridProps {
  /** Array of services to display */
  services: Omit<ServiceCardProps, 'onEdit' | 'onManage' | 'onDelete'>[];
  /** Handler for editing a service */
  onEdit?: (serviceId: string) => void;
  /** Handler for managing a service (inventory, pricing, etc.) */
  onManage?: (serviceId: string) => void;
  /** Handler for deleting a service */
  onDelete?: (serviceId: string) => void;
  /** Handler for adding a new service */
  onAdd?: () => void;
  /** Whether to show the add card */
  showAddCard?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Number of skeleton cards to show when loading */
  skeletonCount?: number;
  /** Empty state message */
  emptyMessage?: string;
  /** Grid columns */
  columns?: 1 | 2 | 3 | 4;
  /** Gap between cards */
  gap?: 'sm' | 'md' | 'lg';
  /** Additional class name */
  className?: string;
}

function ServiceSkeleton() {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
    </div>
  );
}

/**
 * ServiceGrid provides a grid layout for displaying service cards with add functionality.
 */
export function ServiceGrid({
  services,
  onEdit,
  onManage,
  onDelete,
  onAdd,
  showAddCard = true,
  isLoading = false,
  skeletonCount = 6,
  emptyMessage = 'No services available',
  columns = 3,
  gap = 'md',
  className,
}: ServiceGridProps) {
  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  if (isLoading) {
    return (
      <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <ServiceSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (services.length === 0 && !showAddCard) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="w-12 h-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('grid', columnClasses[columns], gapClasses[gap], className)}>
      {/* Add card first if enabled */}
      {showAddCard && onAdd && (
        <AddServiceCard onClick={onAdd} />
      )}

      {/* Service cards */}
      {services.map((service) => (
        <ServiceCard
          key={service.id}
          {...service}
          onEdit={onEdit ? () => onEdit(service.id) : undefined}
          onManage={onManage ? () => onManage(service.id) : undefined}
          onDelete={onDelete ? () => onDelete(service.id) : undefined}
        />
      ))}
    </div>
  );
}

export default ServiceGrid;
