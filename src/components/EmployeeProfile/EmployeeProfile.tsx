import * as React from 'react';
import { cn } from '../../utils/cn';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import {
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Check,
  X,
  Clock,
  DollarSign,
  Edit2,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface EmployeeAddress {
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface EmployeePhone {
  number: string;
  type: 'cell' | 'home' | 'work' | 'fax' | string;
}

export interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: EmployeePhone[];
  title?: string;
  companyName?: string;
  department?: string[];
  address?: EmployeeAddress;
  photoUrl?: string;
  dateOfBirth?: Date | string;
  isActive?: boolean;
  isPaid?: boolean;
  blurb?: string;
  extendedFields?: Array<{ name: string; value: string }>;
}

export interface EmployeeProfileCardProps {
  /** Employee data */
  employee: EmployeeData;
  /** Whether to show the photo edit button */
  showPhotoEdit?: boolean;
  /** Callback when photo edit is clicked */
  onPhotoEdit?: (file: File) => void;
  /** Whether details are initially expanded */
  defaultExpanded?: boolean;
  /** Whether to show payment status */
  showPaymentStatus?: boolean;
  /** Custom className */
  className?: string;
  /** Labels for i18n */
  labels?: {
    moreDetails?: string;
    lessDetails?: string;
    paid?: string;
    paymentPending?: string;
    yearsOld?: string;
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });
}

function calculateAge(dateOfBirth: Date | string): number {
  const dob =
    typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function formatAddress(address: EmployeeAddress): string {
  const parts = [];
  if (address.street1) parts.push(address.street1);
  if (address.street2) parts.push(address.street2);
  const cityState = [address.city, address.state, address.postalCode]
    .filter(Boolean)
    .join(', ');
  if (cityState) parts.push(cityState);
  return parts.join('\n');
}

// ============================================================================
// EmployeeProfileCard Component
// ============================================================================

/**
 * Employee profile card with photo, contact details, and expandable information.
 * Used in order sidebars and employee detail views.
 *
 * @example
 * ```tsx
 * <EmployeeProfileCard
 *   employee={{
 *     id: '1',
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     email: 'john@example.com',
 *     phone: [{ number: '5551234567', type: 'cell' }],
 *     title: 'Software Engineer',
 *     companyName: 'Acme Corp',
 *     isActive: true,
 *     isPaid: true,
 *   }}
 *   showPaymentStatus
 * />
 * ```
 */
export function EmployeeProfileCard({
  employee,
  showPhotoEdit = false,
  onPhotoEdit,
  defaultExpanded = false,
  showPaymentStatus = false,
  className,
  labels = {},
}: EmployeeProfileCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    moreDetails = 'more details',
    lessDetails = 'less details',
    paid = 'Paid',
    paymentPending = 'Payment Pending',
    yearsOld = 'y/o',
  } = labels;

  const fullName = `${employee.firstName} ${employee.lastName}`;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoEdit) {
      onPhotoEdit(file);
    }
  };

  return (
    <div className={cn('bg-card rounded-lg', className)}>
      {/* Profile Header */}
      <div className="flex flex-col items-center p-4 text-center">
        {/* Avatar with optional edit */}
        <div className="relative mb-3">
          <Avatar
            src={employee.photoUrl}
            alt={fullName}
            name={fullName}
            size="xl"
          />
          {showPhotoEdit && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                data-cy="input-employee-photo"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 absolute right-0 bottom-0 rounded-full p-1.5 shadow-md transition-colors"
                aria-label="Edit photo"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            </>
          )}
        </div>

        {/* Name and Status */}
        <div
          className="mb-1 flex items-center gap-2"
          data-cy="header-employee-name"
        >
          {employee.isActive !== undefined && (
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full text-white',
                employee.isActive ? 'bg-success' : 'bg-destructive'
              )}
            >
              {employee.isActive ? (
                <Check className="h-3 w-3" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </span>
          )}
          <h3 className="text-lg font-semibold">{fullName}</h3>
        </div>

        {/* Title and Company */}
        <p
          className="text-muted-foreground text-sm"
          data-cy="paragraph-employee-title"
        >
          {employee.title && <span>{employee.title}</span>}
          {employee.title && employee.companyName && <br />}
          {employee.companyName && <span>{employee.companyName}</span>}
        </p>

        {/* Expand/Collapse Toggle */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-primary mt-2 flex items-center gap-1 text-sm hover:underline"
          aria-expanded={isExpanded}
          aria-controls="employee-details"
        >
          {isExpanded ? (
            <>
              {lessDetails}
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              {moreDetails}
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {/* Collapsible Details */}
      <div
        id="employee-details"
        className={cn(
          'overflow-hidden transition-all duration-300',
          isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="space-y-3 px-4 pb-4 text-sm">
          {/* Date of Birth */}
          {employee.dateOfBirth && (
            <div
              className="flex items-center gap-2"
              data-cy="header-employee-dob"
            >
              <Calendar className="text-muted-foreground h-4 w-4" />
              <span>{formatDate(employee.dateOfBirth)}</span>
              <span className="text-muted-foreground text-xs">
                ({calculateAge(employee.dateOfBirth)} {yearsOld})
              </span>
            </div>
          )}

          {/* Phone Numbers */}
          {employee.phone?.map((p, idx) =>
            p.number ? (
              <div
                key={idx}
                className="flex items-center gap-2"
                data-cy="header-employee-phone-number"
              >
                <Phone className="text-muted-foreground h-4 w-4" />
                <a href={`tel:${p.number}`} className="hover:underline">
                  {formatPhoneNumber(p.number)}
                </a>
                <span className="text-muted-foreground">({p.type})</span>
              </div>
            ) : null
          )}

          {/* Email */}
          {employee.email && (
            <div
              className="flex items-center gap-2"
              data-cy="header-employee-email"
            >
              <Mail className="text-muted-foreground h-4 w-4" />
              <a href={`mailto:${employee.email}`} className="hover:underline">
                {employee.email}
              </a>
            </div>
          )}

          {/* Departments */}
          {employee.department && employee.department.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {employee.department.map((dept, idx) => (
                <Badge key={idx} variant="secondary" size="sm">
                  {dept}
                </Badge>
              ))}
            </div>
          )}

          {/* Payment Status */}
          {showPaymentStatus && (
            <div
              className="flex items-center gap-2"
              data-cy="header-payment-status"
            >
              {employee.isPaid ? (
                <>
                  <Check className="text-success h-4 w-4" />
                  <span className="text-success">{paid}</span>
                </>
              ) : (
                <>
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span>{paymentPending}</span>
                </>
              )}
            </div>
          )}

          {/* Address */}
          {employee.address && employee.address.street1 && (
            <div
              className="flex items-start gap-2"
              data-cy="div-employee-address"
            >
              <MapPin className="text-muted-foreground mt-0.5 h-4 w-4" />
              <span className="whitespace-pre-line">
                {formatAddress(employee.address)}
              </span>
            </div>
          )}

          {/* Blurb */}
          {employee.blurb && (
            <p className="text-muted-foreground" data-cy="div-employee-blurb">
              {employee.blurb}
            </p>
          )}

          {/* Extended Fields */}
          {employee.extendedFields && employee.extendedFields.length > 0 && (
            <>
              <hr className="border-border" />
              {employee.extendedFields.map((field, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="font-medium">{field.name}:</span>
                  <span>{field.value}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// OrderSidebarTabs Component
// ============================================================================

export interface OrderSidebarTab {
  id: string;
  label: string;
  dataCy?: string;
}

export interface OrderSidebarTabsProps {
  /** Array of tabs */
  tabs: OrderSidebarTab[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tabId: string) => void;
  /** Tab orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Custom className */
  className?: string;
}

/**
 * Tab navigation for order sidebars (Timeline, Services, Attachments).
 *
 * @example
 * ```tsx
 * <OrderSidebarTabs
 *   tabs={[
 *     { id: 'timeline', label: 'Timeline' },
 *     { id: 'services', label: 'Services' },
 *     { id: 'attachments', label: 'Attachments' },
 *   ]}
 *   activeTab="timeline"
 *   onTabChange={setActiveTab}
 * />
 * ```
 */
export function OrderSidebarTabs({
  tabs,
  activeTab,
  onTabChange,
  orientation = 'horizontal',
  className,
}: OrderSidebarTabsProps) {
  return (
    <div
      className={cn(
        'flex gap-0',
        orientation === 'vertical' ? 'flex-col' : 'flex-row',
        className
      )}
      role="tablist"
      aria-orientation={orientation}
    >
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`panel-${tab.id}`}
          onClick={() => onTabChange(tab.id)}
          data-cy={tab.dataCy}
          className={cn(
            'px-4 py-2 text-sm font-medium transition-colors',
            'focus-visible:ring-ring focus:outline-none focus-visible:ring-2',
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// OrderDetailSidebar Component
// ============================================================================

export interface OrderDetailSidebarProps {
  /** Employee data for the profile card */
  employee: EmployeeData;
  /** Content for each tab panel */
  children?: React.ReactNode;
  /** Tabs configuration */
  tabs?: OrderSidebarTab[];
  /** Currently active tab */
  activeTab?: string;
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
  /** Whether to show photo edit */
  showPhotoEdit?: boolean;
  /** Callback for photo edit */
  onPhotoEdit?: (file: File) => void;
  /** Whether to show payment status */
  showPaymentStatus?: boolean;
  /** Custom className */
  className?: string;
  /** Labels for i18n */
  labels?: EmployeeProfileCardProps['labels'] & {
    timeline?: string;
    services?: string;
    attachments?: string;
  };
}

/**
 * Complete order detail sidebar with employee profile and tab navigation.
 *
 * @example
 * ```tsx
 * <OrderDetailSidebar
 *   employee={employeeData}
 *   activeTab="timeline"
 *   onTabChange={setTab}
 *   showPaymentStatus
 * >
 *   {activeTab === 'timeline' && <TimelineContent />}
 *   {activeTab === 'services' && <ServicesContent />}
 *   {activeTab === 'attachments' && <AttachmentsContent />}
 * </OrderDetailSidebar>
 * ```
 */
export function OrderDetailSidebar({
  employee,
  children,
  tabs,
  activeTab = 'timeline',
  onTabChange,
  showPhotoEdit = false,
  onPhotoEdit,
  showPaymentStatus = false,
  className,
  labels = {},
}: OrderDetailSidebarProps) {
  const {
    timeline = 'Timeline',
    services = 'Services',
    attachments = 'Attachments',
    ...profileLabels
  } = labels;

  const defaultTabs: OrderSidebarTab[] = [
    { id: 'timeline', label: timeline, dataCy: 'btn-view-timeline' },
    { id: 'services', label: services },
    { id: 'attachments', label: attachments, dataCy: 'btn-view-attachments' },
  ];

  const finalTabs = tabs || defaultTabs;

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Employee Profile */}
      <div className="px-3">
        <EmployeeProfileCard
          employee={employee}
          showPhotoEdit={showPhotoEdit}
          onPhotoEdit={onPhotoEdit}
          showPaymentStatus={showPaymentStatus}
          labels={profileLabels}
        />
      </div>

      {/* Tab Navigation */}
      {onTabChange && (
        <OrderSidebarTabs
          tabs={finalTabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          orientation="horizontal"
          className="mt-3 md:flex-col"
        />
      )}

      {/* Tab Content */}
      {children && <div className="flex-1 overflow-auto p-3">{children}</div>}
    </div>
  );
}

export default EmployeeProfileCard;
