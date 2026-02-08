import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

// =============================================================================
// Accordion Context
// =============================================================================

interface AccordionContextValue {
  expandedItems: Set<string>;
  toggleItem: (id: string) => void;
  allowMultiple: boolean;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error('Accordion components must be used within an Accordion');
  }
  return context;
}

// =============================================================================
// Accordion Root
// =============================================================================

const accordionVariants = cva('w-full', {
  variants: {
    variant: {
      default: 'divide-y divide-gray-200 dark:divide-gray-700',
      bordered:
        'border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700',
      separated: 'space-y-2',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface AccordionProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionVariants> {
  children: React.ReactNode;
  /** Allow multiple items to be expanded at once */
  allowMultiple?: boolean;
  /** Default expanded item IDs */
  defaultExpanded?: string[];
}

export function Accordion({
  children,
  variant,
  allowMultiple = false,
  defaultExpanded = [],
  className,
  ...props
}: AccordionProps) {
  const [expandedItems, setExpandedItems] = React.useState<Set<string>>(
    new Set(defaultExpanded)
  );

  const toggleItem = React.useCallback(
    (id: string) => {
      setExpandedItems((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (!allowMultiple) {
            next.clear();
          }
          next.add(id);
        }
        return next;
      });
    },
    [allowMultiple]
  );

  const contextValue = React.useMemo(
    () => ({ expandedItems, toggleItem, allowMultiple }),
    [expandedItems, toggleItem, allowMultiple]
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div
        className={cn(accordionVariants({ variant }), className)}
        {...props}
      >
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

// =============================================================================
// Accordion Item
// =============================================================================

interface AccordionItemContextValue {
  itemId: string;
  isExpanded: boolean;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

function useAccordionItemContext() {
  const context = React.useContext(AccordionItemContext);
  if (!context) {
    throw new Error('AccordionItem components must be used within an AccordionItem');
  }
  return context;
}

const accordionItemVariants = cva('', {
  variants: {
    variant: {
      default: '',
      bordered: 'first:rounded-t-lg last:rounded-b-lg',
      separated:
        'border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface AccordionItemProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionItemVariants> {
  children: React.ReactNode;
  /** Unique identifier for this item */
  id: string;
}

export function AccordionItem({
  children,
  id,
  variant,
  className,
  ...props
}: AccordionItemProps) {
  const { expandedItems } = useAccordionContext();
  const isExpanded = expandedItems.has(id);

  const contextValue = React.useMemo(
    () => ({ itemId: id, isExpanded }),
    [id, isExpanded]
  );

  return (
    <AccordionItemContext.Provider value={contextValue}>
      <div
        className={cn(accordionItemVariants({ variant }), className)}
        data-state={isExpanded ? 'open' : 'closed'}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

// =============================================================================
// Accordion Trigger
// =============================================================================

const accordionTriggerVariants = cva(
  'flex w-full items-center justify-between text-left font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
  {
    variants: {
      size: {
        sm: 'py-2 px-3 text-sm',
        md: 'py-3 px-4 text-base',
        lg: 'py-4 px-5 text-lg',
      },
      variant: {
        default:
          'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white',
        muted:
          'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface AccordionTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof accordionTriggerVariants> {
  children: React.ReactNode;
  /** Show chevron icon */
  showChevron?: boolean;
}

export function AccordionTrigger({
  children,
  size,
  variant,
  showChevron = true,
  className,
  ...props
}: AccordionTriggerProps) {
  const { toggleItem } = useAccordionContext();
  const { itemId, isExpanded } = useAccordionItemContext();

  return (
    <button
      type="button"
      onClick={() => toggleItem(itemId)}
      aria-expanded={isExpanded}
      aria-controls={`accordion-content-${itemId}`}
      className={cn(accordionTriggerVariants({ size, variant }), className)}
      {...props}
    >
      <span className="flex-1">{children}</span>
      {showChevron && (
        <ChevronIcon
          className={cn(
            'h-5 w-5 shrink-0 text-gray-500 transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      )}
    </button>
  );
}

// =============================================================================
// Accordion Content
// =============================================================================

const accordionContentVariants = cva(
  'overflow-hidden transition-all duration-200 ease-in-out',
  {
    variants: {
      size: {
        sm: 'px-3 text-sm',
        md: 'px-4 text-base',
        lg: 'px-5 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AccordionContentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof accordionContentVariants> {
  children: React.ReactNode;
}

export function AccordionContent({
  children,
  size,
  className,
  ...props
}: AccordionContentProps) {
  const { itemId, isExpanded } = useAccordionItemContext();
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | undefined>(
    isExpanded ? undefined : 0
  );

  React.useEffect(() => {
    if (!contentRef.current) return;
    const resizeObserver = new ResizeObserver(() => {
      if (isExpanded) {
        setHeight(contentRef.current?.scrollHeight);
      }
    });
    resizeObserver.observe(contentRef.current);
    return () => resizeObserver.disconnect();
  }, [isExpanded]);

  React.useEffect(() => {
    if (isExpanded) {
      setHeight(contentRef.current?.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isExpanded]);

  return (
    <div
      id={`accordion-content-${itemId}`}
      role="region"
      aria-labelledby={`accordion-trigger-${itemId}`}
      style={{ height }}
      className={cn(
        accordionContentVariants({ size }),
        'text-gray-600 dark:text-gray-400',
        className
      )}
      {...props}
    >
      <div ref={contentRef} className="pb-4 pt-1">
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// FAQ Accordion (Specialized for Provider Pages)
// =============================================================================

export interface FAQItem {
  id: string;
  question: string;
  answer: string | React.ReactNode;
}

export interface FAQAccordionProps {
  items: FAQItem[];
  className?: string;
}

export function FAQAccordion({ items, className }: FAQAccordionProps) {
  return (
    <Accordion variant="default" className={className}>
      {items.map((item) => (
        <AccordionItem key={item.id} id={item.id}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// =============================================================================
// Provider FAQ Generator
// =============================================================================

export interface ProviderFAQData {
  name: string;
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  phoneNumber?: string;
  services?: { name: string }[];
  website?: string;
  locationType?: string;
}

export function generateProviderFAQs(provider: ProviderFAQData): FAQItem[] {
  const faqs: FAQItem[] = [];
  const { name, address, phoneNumber, services, website, locationType } = provider;

  // Location FAQ
  faqs.push({
    id: 'location',
    question: `Where is ${name} located?`,
    answer: (
      <span>
        {name} is located at{' '}
        <a
          href={`https://www.google.com/maps?daddr=${encodeURIComponent(
            `${address.street1}, ${address.city}, ${address.state} ${address.postalCode}`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          {address.street1}, {address.city}, {address.state} {address.postalCode}
        </a>
        .
      </span>
    ),
  });

  // Phone FAQ
  if (phoneNumber) {
    faqs.push({
      id: 'phone',
      question: `What is the phone number for ${name}?`,
      answer: (
        <span>
          You can contact {name} by calling{' '}
          <a
            href={`tel:${phoneNumber}`}
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {phoneNumber}
          </a>
          .
        </span>
      ),
    });
  }

  // Services FAQ
  if (services && services.length > 0) {
    const serviceNames = services.slice(0, 5).map((s) => s.name);
    const hasMore = services.length > 5;
    faqs.push({
      id: 'services',
      question: `What services does ${name} offer?`,
      answer: `${name} offers services including ${serviceNames.join(', ')}${hasMore ? ` and ${services.length - 5} more services` : ''}.`,
    });
  }

  // Website FAQ
  if (website) {
    faqs.push({
      id: 'website',
      question: `Does ${name} have a website?`,
      answer: (
        <span>
          Yes, you can visit the {name} website at{' '}
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            {new URL(website).hostname}
          </a>
          .
        </span>
      ),
    });
  }

  // Facility Type FAQ
  if (locationType) {
    faqs.push({
      id: 'facility-type',
      question: `What type of facility is ${name}?`,
      answer: `${name} is classified as a ${locationType}.`,
    });
  }

  // Booking FAQ
  faqs.push({
    id: 'booking',
    question: `How do I book an appointment at ${name}?`,
    answer: `You can book an appointment at ${name} by clicking the "Book Appointment" button on this page, calling the provider directly${phoneNumber ? ` at ${phoneNumber}` : ''}, or visiting their website${website ? ` at ${new URL(website).hostname}` : ''}.`,
  });

  return faqs;
}

// =============================================================================
// Icon
// =============================================================================

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default Accordion;
