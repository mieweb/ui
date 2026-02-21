import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { isStorybookDocsMode } from '../../utils/environment';

// =============================================================================
// Types
// =============================================================================

export interface BookingService {
  id: string;
  slug: string;
  name: string;
}

export interface BookingProvider {
  id: string;
  name: string;
  address: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
  phoneNumber?: string;
}

export interface BookingFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  selectedServices: string[];
  allowAlternateProviders: boolean;
  consentEmail: boolean;
  consentSms: boolean;
}

export interface BookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingFormData) => void;
  onCall?: (phoneNumber: string) => void;
  provider: BookingProvider;
  services?: BookingService[];
  defaultValues?: Partial<BookingFormData>;
  isLoading?: boolean;
  className?: string;
}

// =============================================================================
// Form Input Components
// =============================================================================

const inputVariants = cva(
  'w-full rounded-lg border bg-background px-4 py-3 text-foreground transition-colors focus:outline-none focus:ring-2',
  {
    variants: {
      state: {
        default:
          'border-input focus:border-primary-500 focus:ring-primary-500/20',
        error:
          'border-destructive focus:border-destructive focus:ring-destructive/20',
        success: 'border-success focus:border-success focus:ring-success/20',
      },
    },
    defaultVariants: {
      state: 'default',
    },
  }
);

export interface FloatingInputProps
  extends
    React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label: string;
  error?: string;
}

export function FloatingInput({
  label,
  state,
  error,
  id,
  className,
  ...props
}: FloatingInputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="relative">
      <input
        id={inputId}
        placeholder=" "
        className={cn(
          inputVariants({ state: error ? 'error' : (state ?? 'default') }),
          'peer pt-6 pb-2',
          className
        )}
        {...props}
      />
      <label
        htmlFor={inputId}
        className={cn(
          'text-muted-foreground absolute top-4 left-4 origin-left transform transition-all duration-200',
          'peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100',
          'peer-focus:-translate-y-2 peer-focus:scale-75',
          'peer-[:not(:placeholder-shown)]:-translate-y-2 peer-[:not(:placeholder-shown)]:scale-75',
          error && 'text-destructive'
        )}
      >
        {label}
      </label>
      {error && <p className="text-destructive mt-1 text-sm">{error}</p>}
    </div>
  );
}

// =============================================================================
// Service Multi-Select (Simplified)
// =============================================================================

export interface ServiceSelectProps {
  services: BookingService[];
  selectedServices: string[];
  onChange: (services: string[]) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export function ServiceSelect({
  services,
  selectedServices,
  onChange,
  placeholder = 'Select services...',
  error,
  className,
}: ServiceSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleService = (serviceSlug: string) => {
    if (selectedServices.includes(serviceSlug)) {
      onChange(selectedServices.filter((s) => s !== serviceSlug));
    } else {
      onChange([...selectedServices, serviceSlug]);
    }
  };

  const selectedServiceNames = services
    .filter((s) => selectedServices.includes(s.slug))
    .map((s) => s.name);

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full rounded-lg border px-4 py-3 text-left transition-colors',
          'bg-background',
          'focus:ring-2 focus:outline-none',
          error
            ? 'border-destructive focus:ring-destructive/20'
            : 'border-input focus:border-primary-500 focus:ring-primary-500/20'
        )}
      >
        {selectedServiceNames.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {selectedServiceNames.map((name) => (
              <span
                key={name}
                className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDownIcon
          className={cn(
            'text-muted-foreground absolute top-1/2 right-4 h-5 w-5 -translate-y-1/2 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="border-border bg-card absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border shadow-lg">
          {services.map((service) => (
            <label
              key={service.slug}
              className="hover:bg-muted flex cursor-pointer items-center gap-3 px-4 py-3"
            >
              <input
                type="checkbox"
                checked={selectedServices.includes(service.slug)}
                onChange={() => toggleService(service.slug)}
                className="text-primary-600 focus:ring-primary-500 border-input h-4 w-4 rounded"
              />
              <span className="text-foreground">{service.name}</span>
            </label>
          ))}
          {services.length === 0 && (
            <div className="text-muted-foreground px-4 py-3 text-center">
              No services available
            </div>
          )}
        </div>
      )}

      {error && <p className="text-destructive mt-1 text-sm">{error}</p>}
    </div>
  );
}

// =============================================================================
// Consent Switch
// =============================================================================

export interface ConsentSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  className?: string;
}

export function ConsentSwitch({
  id,
  checked,
  onChange,
  label,
  description,
  className,
}: ConsentSwitchProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={id}
        onClick={() => onChange(!checked)}
        className={cn(
          'focus:ring-primary-500 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:ring-2 focus:ring-offset-2 focus:outline-none',
          checked ? 'bg-primary-600' : 'bg-muted'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
      <div className="flex-1">
        <label
          htmlFor={id}
          className="text-foreground cursor-pointer text-sm font-medium"
        >
          {label}
        </label>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Dialog Components
// =============================================================================

export interface DialogOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  titleId?: string;
}

/**
 * Scroll lock state manager for DialogOverlay.
 * Uses a singleton pattern with ref-counting to handle multiple overlays
 * and preserve the original body overflow value.
 */
const dialogScrollLockState = {
  count: 0,
  originalOverflow: null as string | null,
  reset() {
    this.count = 0;
    this.originalOverflow = null;
  },
};

export function DialogOverlay({
  isOpen,
  onClose,
  children,
  className,
  titleId,
}: DialogOverlayProps) {
  React.useEffect(() => {
    // Skip scroll lock in Storybook docs mode where stories render inline
    if (!isOpen || isStorybookDocsMode()) {
      return undefined;
    }

    dialogScrollLockState.count++;
    // Only capture and set overflow when first overlay opens
    if (dialogScrollLockState.count === 1) {
      dialogScrollLockState.originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    return () => {
      dialogScrollLockState.count--;
      // Only restore overflow when last overlay closes
      if (
        dialogScrollLockState.count === 0 &&
        dialogScrollLockState.originalOverflow !== null
      ) {
        document.body.style.overflow = dialogScrollLockState.originalOverflow;
        dialogScrollLockState.originalOverflow = null;
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Dialog Content */}
        <div
          className={cn(
            'bg-card relative w-full max-w-lg transform rounded-2xl shadow-2xl transition-all',
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main BookingDialog Component
// =============================================================================

export function BookingDialog({
  isOpen,
  onClose,
  onSubmit,
  onCall,
  provider,
  services = [],
  defaultValues,
  isLoading = false,
  className,
}: BookingDialogProps) {
  const titleId = React.useId();
  const [formData, setFormData] = React.useState<BookingFormData>({
    firstName: defaultValues?.firstName || '',
    lastName: defaultValues?.lastName || '',
    phoneNumber: defaultValues?.phoneNumber || '',
    selectedServices: defaultValues?.selectedServices || [],
    allowAlternateProviders: defaultValues?.allowAlternateProviders ?? false,
    consentEmail: defaultValues?.consentEmail ?? false,
    consentSms: defaultValues?.consentSms ?? false,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    if (formData.selectedServices.length === 0) {
      newErrors.services = 'Please select at least one service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  const mapsUrl = `https://www.google.com/maps?daddr=${encodeURIComponent(
    `${provider.address.street1}, ${provider.address.city}, ${provider.address.state} ${provider.address.postalCode}`
  )}`;

  return (
    <DialogOverlay
      isOpen={isOpen}
      onClose={onClose}
      className={className}
      titleId={titleId}
    >
      {/* Header */}
      <div className="border-border flex items-center justify-between rounded-t-2xl border-b px-6 py-4">
        <h2
          id={titleId}
          className="text-lg leading-none font-semibold tracking-tight"
        >
          Book Appointment
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
          aria-label="Close dialog"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6 p-6">
          {/* Provider Info */}
          <div className="border-border border-b pb-4">
            <h3 className="text-foreground mb-1 text-lg font-bold">
              {provider.name}
            </h3>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary-600 text-muted-foreground text-sm"
            >
              {provider.address.street1}
              {provider.address.street2 && ` ${provider.address.street2}`}{' '}
              {provider.address.city}, {provider.address.state}{' '}
              {provider.address.postalCode}
            </a>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-foreground mb-4 text-sm font-semibold">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FloatingInput
                label="First Name"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                error={errors.firstName}
                required
              />
              <FloatingInput
                label="Last Name"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                error={errors.lastName}
                required
              />
            </div>
            <div className="mt-4">
              <FloatingInput
                label="Phone Number"
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) =>
                  setFormData({ ...formData, phoneNumber: e.target.value })
                }
                error={errors.phoneNumber}
                required
              />
            </div>
          </div>

          {/* Service Selection */}
          <div>
            <h4 className="text-foreground mb-4 text-sm font-semibold">
              Please select your services
            </h4>
            <ServiceSelect
              services={services}
              selectedServices={formData.selectedServices}
              onChange={(selected) =>
                setFormData({ ...formData, selectedServices: selected })
              }
              placeholder="Please select services"
              error={errors.services}
            />
          </div>

          {/* Consent Options */}
          <div className="space-y-4">
            <ConsentSwitch
              id="alternate-providers"
              checked={formData.allowAlternateProviders}
              onChange={(checked) =>
                setFormData({ ...formData, allowAlternateProviders: checked })
              }
              label="Allow alternate providers"
              description="I consent to BlueHive connecting me with an alternate provider if this one is unavailable."
            />

            <ConsentSwitch
              id="consent-email"
              checked={formData.consentEmail}
              onChange={(checked) =>
                setFormData({ ...formData, consentEmail: checked })
              }
              label="Send order update notifications via email"
            />

            <ConsentSwitch
              id="consent-sms"
              checked={formData.consentSms}
              onChange={(checked) =>
                setFormData({ ...formData, consentSms: checked })
              }
              label="Send order update notifications via SMS"
              description="I consent to receive text messages from BlueHive regarding my appointment."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-border flex items-center justify-between border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-foreground hover:bg-muted rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            Close
          </button>
          <div className="flex gap-3">
            {provider.phoneNumber && onCall && (
              <button
                type="button"
                onClick={() => onCall(provider.phoneNumber!)}
                className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-800"
              >
                <PhoneIcon className="h-4 w-4" />
                Call Now
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'bg-primary-600 hover:bg-primary-700 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                isLoading && 'cursor-not-allowed opacity-50'
              )}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="h-4 w-4" />
                  Submitting...
                </>
              ) : (
                'Request Booking'
              )}
            </button>
          </div>
        </div>
      </form>
    </DialogOverlay>
  );
}

// =============================================================================
// Simplified Inline Booking Form (for embedding)
// =============================================================================

export interface InlineBookingFormProps {
  provider: BookingProvider;
  services?: BookingService[];
  onSubmit: (data: BookingFormData) => void;
  defaultValues?: Partial<BookingFormData>;
  isLoading?: boolean;
  className?: string;
}

export function InlineBookingForm({
  provider: _provider,
  services = [],
  onSubmit,
  defaultValues,
  isLoading = false,
  className,
}: InlineBookingFormProps) {
  const [formData, setFormData] = React.useState<BookingFormData>({
    firstName: defaultValues?.firstName || '',
    lastName: defaultValues?.lastName || '',
    phoneNumber: defaultValues?.phoneNumber || '',
    selectedServices: defaultValues?.selectedServices || [],
    allowAlternateProviders: defaultValues?.allowAlternateProviders ?? false,
    consentEmail: defaultValues?.consentEmail ?? false,
    consentSms: defaultValues?.consentSms ?? false,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Contact Fields */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FloatingInput
          label="First Name"
          value={formData.firstName}
          onChange={(e) =>
            setFormData({ ...formData, firstName: e.target.value })
          }
          error={errors.firstName}
          required
        />
        <FloatingInput
          label="Last Name"
          value={formData.lastName}
          onChange={(e) =>
            setFormData({ ...formData, lastName: e.target.value })
          }
          error={errors.lastName}
          required
        />
      </div>

      <FloatingInput
        label="Phone Number"
        type="tel"
        value={formData.phoneNumber}
        onChange={(e) =>
          setFormData({ ...formData, phoneNumber: e.target.value })
        }
        error={errors.phoneNumber}
        required
      />

      {services.length > 0 && (
        <ServiceSelect
          services={services}
          selectedServices={formData.selectedServices}
          onChange={(selected) =>
            setFormData({ ...formData, selectedServices: selected })
          }
          placeholder="Select services (optional)"
        />
      )}

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'bg-primary-600 hover:bg-primary-700 w-full rounded-lg px-4 py-3 text-sm font-medium text-white transition-colors',
          isLoading && 'cursor-not-allowed opacity-50'
        )}
      >
        {isLoading ? 'Submitting...' : 'Request Booking'}
      </button>
    </form>
  );
}

// =============================================================================
// Quick Book Card (compact widget)
// =============================================================================

export interface QuickBookCardProps {
  provider: BookingProvider;
  onBook: () => void;
  onCall?: (phoneNumber: string) => void;
  className?: string;
}

export function QuickBookCard({
  provider,
  onBook,
  onCall,
  className,
}: QuickBookCardProps) {
  return (
    <div
      className={cn(
        'border-border bg-card rounded-lg border p-4 shadow-sm',
        className
      )}
    >
      <h3 className="text-card-foreground mb-2 text-lg font-semibold">
        Schedule an Appointment
      </h3>
      <p className="text-muted-foreground mb-4 text-sm">
        Book your appointment at {provider.name}
      </p>
      <div className="flex gap-3">
        {provider.phoneNumber && onCall && (
          <button
            type="button"
            onClick={() => onCall(provider.phoneNumber!)}
            className="border-border text-foreground hover:bg-muted inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
          >
            <PhoneIcon className="h-4 w-4" />
            Call
          </button>
        )}
        <button
          type="button"
          onClick={onBook}
          className="bg-primary-600 hover:bg-primary-700 inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
        >
          <CalendarIcon className="h-4 w-4" />
          Book Online
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Icons
// =============================================================================

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
    >
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin', className)}
      fill="none"
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
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
  );
}

export default BookingDialog;
