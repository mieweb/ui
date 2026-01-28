'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// ============================================================================
// Types
// ============================================================================

/**
 * Individual service item
 */
export interface ServiceItem {
  /** Service name */
  name: string;
  /** URL-friendly slug */
  slug: string;
  /** Optional description */
  description?: string;
  /** Provider count offering this service */
  providerCount?: number;
  /** Icon name or component */
  icon?: string | React.ReactNode;
}

/**
 * Service category with nested sub-services
 */
export interface ServiceCategory {
  /** Category name */
  name: string;
  /** URL-friendly slug */
  slug?: string;
  /** Direct services in this category */
  services?: ServiceItem[];
  /** Sub-categories with their own services */
  subCategories?: ServiceSubCategory[];
  /** Icon for the category */
  icon?: string | React.ReactNode;
  /** Whether this category is expanded by default */
  defaultExpanded?: boolean;
}

/**
 * Sub-category within a main category
 */
export interface ServiceSubCategory {
  /** Sub-category name */
  name: string;
  /** URL-friendly slug */
  slug?: string;
  /** Services in this sub-category */
  services: ServiceItem[];
  /** Whether this sub-category is expanded by default */
  defaultExpanded?: boolean;
}

// ============================================================================
// Styles
// ============================================================================

const accordionVariants = cva(
  'service-accordion divide-y divide-neutral-200 dark:divide-neutral-700',
  {
    variants: {
      variant: {
        default: '',
        bordered:
          'border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden',
        cards: 'space-y-3',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

const categoryHeaderVariants = cva(
  [
    'w-full flex items-center justify-between py-4 px-4 text-left',
    'transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
  ],
  {
    variants: {
      variant: {
        default: 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        bordered: 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
        cards:
          'bg-white dark:bg-neutral-800 rounded-lg shadow-sm hover:shadow-md border border-neutral-200 dark:border-neutral-700',
      },
      isExpanded: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'cards',
        isExpanded: true,
        className: 'rounded-b-none',
      },
    ],
    defaultVariants: {
      variant: 'default',
      isExpanded: false,
    },
  }
);

const serviceLinkVariants = cva(
  [
    'flex items-center gap-2 py-2 px-3 rounded-md',
    'text-neutral-700 dark:text-neutral-300',
    'hover:bg-neutral-100 dark:hover:bg-neutral-700/50 hover:text-primary-600 dark:hover:text-primary-400',
    'transition-colors',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500',
  ],
  {
    variants: {
      size: {
        sm: 'text-sm py-1.5',
        md: 'text-base py-2',
        lg: 'text-lg py-2.5',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// ============================================================================
// Icons
// ============================================================================

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn('h-5 w-5', className)}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.22 8.22a.75.75 0 011.06 0L10 11.94l3.72-3.72a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.22 9.28a.75.75 0 010-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={cn('h-4 w-4', className)}
      aria-hidden="true"
    >
      <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
      <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
    </svg>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface ServiceLinkProps {
  service: ServiceItem;
  basePath?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: (service: ServiceItem) => void;
}

export function ServiceLink({
  service,
  basePath = '/service',
  size = 'md',
  onClick,
}: ServiceLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(service);
    }
  };

  return (
    <a
      href={`${basePath}/${service.slug}`}
      onClick={handleClick}
      className={serviceLinkVariants({ size })}
      data-cy={`service-link-${service.slug}`}
    >
      <LinkIcon className="flex-shrink-0 text-neutral-400" />
      <span className="flex-grow">{service.name}</span>
      {service.providerCount !== undefined && (
        <span className="ml-2 text-xs text-neutral-400 dark:text-neutral-500">
          ({service.providerCount})
        </span>
      )}
    </a>
  );
}

interface SubCategoryAccordionProps {
  subCategory: ServiceSubCategory;
  basePath?: string;
  onServiceClick?: (service: ServiceItem) => void;
  index: number;
}

function SubCategoryAccordion({
  subCategory,
  basePath,
  onServiceClick,
  index,
}: SubCategoryAccordionProps) {
  const [isExpanded, setIsExpanded] = React.useState(
    subCategory.defaultExpanded ?? false
  );
  const contentId = `sub-content-${index}`;

  return (
    <div className="sub-category">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'flex w-full items-center justify-between px-3 py-2',
          'text-left font-medium text-neutral-700 dark:text-neutral-200',
          'hover:text-primary-600 dark:hover:text-primary-400',
          'focus-visible:ring-primary-500 focus:outline-none focus-visible:ring-2'
        )}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        data-cy={`btn-sub-service-${index}`}
      >
        <span>{subCategory.name}</span>
        <ChevronDownIcon
          className={cn(
            'transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      <div
        id={contentId}
        className={cn(
          'overflow-hidden transition-all duration-200 ease-in-out',
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        )}
        aria-hidden={!isExpanded}
      >
        <div className="space-y-1 pb-2 pl-4">
          {subCategory.services.map((service, serviceIdx) => (
            <ServiceLink
              key={serviceIdx}
              service={service}
              basePath={basePath}
              size="sm"
              onClick={onServiceClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CategoryAccordionItemProps {
  category: ServiceCategory;
  variant?: 'default' | 'bordered' | 'cards';
  basePath?: string;
  onServiceClick?: (service: ServiceItem) => void;
  index: number;
  allowMultiple?: boolean;
  expandedCategories?: string[];
  onExpandChange?: (categoryName: string, isExpanded: boolean) => void;
}

function CategoryAccordionItem({
  category,
  variant = 'default',
  basePath,
  onServiceClick,
  index,
  allowMultiple = true,
  expandedCategories,
  onExpandChange,
}: CategoryAccordionItemProps) {
  const isControlled = expandedCategories !== undefined;
  const [internalExpanded, setInternalExpanded] = React.useState(
    category.defaultExpanded ?? false
  );

  const isExpanded = isControlled
    ? expandedCategories.includes(category.name)
    : internalExpanded;

  const contentId = `category-content-${index}`;

  const handleToggle = () => {
    if (isControlled && onExpandChange) {
      onExpandChange(category.name, !isExpanded);
    } else {
      setInternalExpanded(!isExpanded);
    }
  };

  const hasContent =
    (category.services && category.services.length > 0) ||
    (category.subCategories && category.subCategories.length > 0);

  return (
    <div
      className={cn(
        variant === 'cards' && 'overflow-hidden rounded-lg',
        variant === 'cards' && isExpanded && 'shadow-md'
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={categoryHeaderVariants({ variant, isExpanded })}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        data-cy={`btn-category-${index}`}
      >
        <div className="flex items-center gap-3">
          {category.icon && (
            <span className="text-primary-500 dark:text-primary-400">
              {typeof category.icon === 'string' ? (
                <span className="text-xl">{category.icon}</span>
              ) : (
                category.icon
              )}
            </span>
          )}
          <span className="font-semibold text-neutral-900 dark:text-white">
            {category.name}
          </span>
        </div>
        {hasContent && (
          <ChevronDownIcon
            className={cn(
              'text-neutral-500 transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
          />
        )}
      </button>

      {hasContent && (
        <div
          id={contentId}
          className={cn(
            'overflow-hidden transition-all duration-200 ease-in-out',
            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0',
            variant === 'cards' &&
              'rounded-b-lg border border-t-0 border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-800'
          )}
          aria-hidden={!isExpanded}
        >
          <div className="space-y-2 p-4">
            {/* Direct services */}
            {category.services && category.services.length > 0 && (
              <div className="space-y-1">
                {category.services.map((service, serviceIdx) => (
                  <ServiceLink
                    key={serviceIdx}
                    service={service}
                    basePath={basePath}
                    onClick={onServiceClick}
                  />
                ))}
              </div>
            )}

            {/* Sub-categories */}
            {category.subCategories && category.subCategories.length > 0 && (
              <div className="space-y-2">
                {category.subCategories.map((subCat, subIdx) => (
                  <SubCategoryAccordion
                    key={subIdx}
                    subCategory={subCat}
                    basePath={basePath}
                    onServiceClick={onServiceClick}
                    index={subIdx}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main ServiceAccordion Component
// ============================================================================

export interface ServiceAccordionProps extends VariantProps<
  typeof accordionVariants
> {
  /** Array of service categories */
  categories: ServiceCategory[];
  /** Base path for service links */
  basePath?: string;
  /** Called when a service link is clicked */
  onServiceClick?: (service: ServiceItem) => void;
  /** Allow multiple categories to be expanded at once */
  allowMultiple?: boolean;
  /** Controlled expanded categories */
  expandedCategories?: string[];
  /** Called when a category is expanded/collapsed */
  onExpandedChange?: (expanded: string[]) => void;
  /** Additional CSS classes */
  className?: string;
}

export function ServiceAccordion({
  categories,
  variant = 'default',
  basePath = '/service',
  onServiceClick,
  allowMultiple = true,
  expandedCategories: controlledExpanded,
  onExpandedChange,
  className,
}: ServiceAccordionProps) {
  const [internalExpanded, setInternalExpanded] = React.useState<string[]>([]);

  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  const handleExpandChange = (categoryName: string, isExpanded: boolean) => {
    let newExpanded: string[];

    if (isExpanded) {
      if (allowMultiple) {
        newExpanded = [...expanded, categoryName];
      } else {
        newExpanded = [categoryName];
      }
    } else {
      newExpanded = expanded.filter((name) => name !== categoryName);
    }

    if (isControlled && onExpandedChange) {
      onExpandedChange(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  return (
    <div
      className={cn(accordionVariants({ variant }), className)}
      role="region"
      aria-label="Service categories"
    >
      {categories.map((category, index) => (
        <CategoryAccordionItem
          key={index}
          category={category}
          variant={variant ?? 'default'}
          basePath={basePath}
          onServiceClick={onServiceClick}
          index={index}
          allowMultiple={allowMultiple}
          expandedCategories={expanded}
          onExpandChange={handleExpandChange}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Service Tag Cloud (Alternative Display)
// ============================================================================

export interface ServiceTagCloudProps {
  /** Flat list of services */
  services: ServiceItem[];
  /** Base path for service links */
  basePath?: string;
  /** Called when a service is clicked */
  onServiceClick?: (service: ServiceItem) => void;
  /** Show provider counts */
  showCounts?: boolean;
  /** Maximum number of services to display */
  maxItems?: number;
  /** Additional CSS classes */
  className?: string;
}

export function ServiceTagCloud({
  services,
  basePath = '/service',
  onServiceClick,
  showCounts = false,
  maxItems,
  className,
}: ServiceTagCloudProps) {
  const displayedServices = maxItems ? services.slice(0, maxItems) : services;
  const hasMore = maxItems && services.length > maxItems;

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {displayedServices.map((service, index) => (
        <a
          key={index}
          href={`${basePath}/${service.slug}`}
          onClick={(e) => {
            if (onServiceClick) {
              e.preventDefault();
              onServiceClick(service);
            }
          }}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5',
            'text-sm font-medium',
            'bg-primary-100 text-primary-800 hover:bg-primary-200',
            'dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50',
            'transition-colors',
            'focus-visible:ring-primary-500 focus:outline-none focus-visible:ring-2'
          )}
          data-cy={`service-tag-${service.slug}`}
        >
          {service.name}
          {showCounts && service.providerCount !== undefined && (
            <span className="text-xs opacity-70">
              ({service.providerCount})
            </span>
          )}
        </a>
      ))}
      {hasMore && (
        <span className="inline-flex items-center px-3 py-1.5 text-sm text-neutral-500 dark:text-neutral-400">
          +{services.length - (maxItems || 0)} more
        </span>
      )}
    </div>
  );
}

// ============================================================================
// Service List (Simple list display)
// ============================================================================

export interface ServiceListProps {
  /** Array of services */
  services: ServiceItem[];
  /** Base path for service links */
  basePath?: string;
  /** Called when a service is clicked */
  onServiceClick?: (service: ServiceItem) => void;
  /** Display in columns */
  columns?: 1 | 2 | 3 | 4;
  /** Show provider counts */
  showCounts?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function ServiceList({
  services,
  basePath = '/service',
  onServiceClick,
  columns = 1,
  showCounts = false,
  className,
}: ServiceListProps) {
  const gridClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <ul className={cn('grid gap-1', gridClasses[columns], className)}>
      {services.map((service, index) => (
        <li key={index}>
          <a
            href={`${basePath}/${service.slug}`}
            onClick={(e) => {
              if (onServiceClick) {
                e.preventDefault();
                onServiceClick(service);
              }
            }}
            className={cn(
              'flex items-center gap-2 py-1.5',
              'text-neutral-700 dark:text-neutral-300',
              'hover:text-primary-600 dark:hover:text-primary-400',
              'transition-colors'
            )}
          >
            <span className="flex-grow">{service.name}</span>
            {showCounts && service.providerCount !== undefined && (
              <span className="text-xs text-neutral-400">
                {service.providerCount} providers
              </span>
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

export default ServiceAccordion;
