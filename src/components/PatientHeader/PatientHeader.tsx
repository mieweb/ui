import * as React from 'react';
import { cn } from '../../utils/cn';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { Input } from '../Input';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalClose,
  ModalBody,
  ModalFooter,
} from '../Modal';
import {
  ArrowLeftIcon,
  CalendarIcon,
  MailIcon,
  PhoneIcon,
  AlertCircleIcon,
  PaperclipIcon,
  ClipboardListIcon,
  StethoscopeIcon,
  UsersIcon,
  MoreVerticalIcon,
  PencilIcon,
  ClipboardPlusIcon,
  ClipboardCheckIcon,
  FilePlusIcon,
  FileCheckIcon,
  AllergyIcon,
  PillIcon,
  BellIcon,
  SendIcon,
  DownloadIcon,
  PrinterIcon,
  FileHeartIcon,
  HeartPulseIcon,
} from '../Icons';

// =============================================================================
// Types
// =============================================================================

export interface PatientName {
  first: string;
  last: string;
  middle?: string;
  suffix?: string;
}

export interface AllergyItem {
  name: string;
  severity?: 'mild' | 'moderate' | 'severe';
}

export interface MedicationItem {
  name: string;
  dose?: string;
}

export interface PatientData {
  /** Patient name parts */
  name: PatientName;
  /** Medical record number */
  mrn: string;
  /** Date of birth (ISO string or display string) */
  dob: string;
  /** Patient age in years */
  age: number;
  /** Biological sex */
  sex: 'M' | 'F' | 'U';
  /** Patient status */
  status?: 'active' | 'inactive' | 'deceased';
  /** Flags such as DUPLICATE, VIP, etc. */
  flags?: string[];
  /** URL to patient photo */
  photo?: string;
  /** Patient email address */
  email?: string;
  /** Patient phone number */
  phone?: string;
  /** Employer name */
  employer?: string;
  /** Attending provider name */
  attendingProvider?: string;
  /** Family/PCP provider name */
  familyProvider?: string;
}

export type PatientOverflowAction =
  | 'edit-patient'
  | 'add-task'
  | 'add-encounter'
  | 'add-due-list'
  | 'add-order'
  | 'add-esign'
  | 'add-allergy'
  | 'add-medication'
  | 'add-alert'
  | 'add-condition'
  | 'add-vitals'
  | 'contact'
  | 'send-message'
  | 'schedule-appointment'
  | 'print-summary'
  | 'export-record';

/** Maps add-* actions to human-readable entity labels */
const ADD_ENTITY_LABELS: Record<string, string> = {
  'add-task': 'Task',
  'add-encounter': 'Encounter',
  'add-due-list': 'Due List Item',
  'add-order': 'Order Request',
  'add-esign': 'eSign Request',
  'add-allergy': 'Allergy',
  'add-medication': 'Medication',
  'add-alert': 'Alert',
  'add-condition': 'Condition',
  'add-vitals': 'Vitals',
};

export interface PatientHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'className'
> {
  /** Patient data object */
  patient: PatientData;
  /** List of known allergies */
  allergies?: AllergyItem[];
  /** List of current medications */
  medications?: MedicationItem[];
  /** Patient comments or warnings */
  comments?: string[];
  /** Stick to top of viewport */
  sticky?: boolean;
  /** Whether to show the back button (default: false) */
  showBackButton?: boolean;
  /** Called when the back button is clicked */
  onBack?: () => void;
  /** Slot for action buttons on the right */
  actions?: React.ReactNode;
  /** Whether to show the allergy row (default: false) */
  showAllergyBanner?: boolean;
  /** Whether to show the medication row (default: false) */
  showMedicationBanner?: boolean;
  /** Whether to show the comments row (default: false) */
  showCommentsBanner?: boolean;
  /** Whether to show the attending/family provider row (default: false) */
  showProviderBanner?: boolean;
  /** Whether to show the flag ribbon at the bottom, e.g. Duplicate (default: false) */
  showFlagBanner?: boolean;
  /** Maximum medications to display before "+N more" (default: 4) */
  maxVisibleMeds?: number;
  /** Show the patient-level overflow menu to the right of count badges (default: false) */
  showOverflowMenu?: boolean;
  /** Called when a patient overflow menu action is selected */
  onOverflowAction?: (action: PatientOverflowAction) => void;
  /** Called when an 'Add' modal is submitted from the overflow menu */
  onAddItem?: (
    entityType: PatientOverflowAction,
    formData: Record<string, string>
  ) => void;
  /** Called when the Edit Patient modal is saved */
  onEditPatient?: (formData: Record<string, string>) => void;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

// =============================================================================
// Helpers
// =============================================================================

function formatPatientName(name: PatientName): string {
  const parts: string[] = [];
  if (name.last) parts.push(name.last + ',');
  if (name.first) parts.push(name.first);
  if (name.middle) parts.push(name.middle.charAt(0) + '.');
  if (name.suffix) parts.push(name.suffix);
  return parts.filter(Boolean).join(' ');
}

function formatFullName(name: PatientName): string {
  const parts = [name.first];
  if (name.middle) parts.push(name.middle);
  parts.push(name.last);
  if (name.suffix) parts.push(name.suffix);
  return parts.filter(Boolean).join(' ');
}

// =============================================================================
// Sub-Components
// =============================================================================

/** Single detail item with icon and label */
function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

/** Allergy row with badge pills */
function AllergyRow({ allergies }: { allergies: AllergyItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex shrink-0 items-center gap-1.5">
        <AlertCircleIcon size={16} className="text-red-600 dark:text-red-400" />
        <span className="text-xs font-semibold tracking-wide text-red-700 uppercase dark:text-red-400">
          Allergies
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {allergies.map((a, i) => (
          <Badge
            key={`${a.name}-${a.severity ?? i}`}
            variant="danger"
            size="sm"
          >
            {a.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/** Medication row with badge pills and "+N more" overflow */
function MedicationRow({
  medications,
  maxVisible,
}: {
  medications: MedicationItem[];
  maxVisible: number;
}) {
  const visible = medications.slice(0, maxVisible);
  const remaining = medications.length - maxVisible;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex shrink-0 items-center gap-1.5">
        <PaperclipIcon size={16} className="text-muted-foreground/60" />
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Meds
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {visible.map((m, i) => (
          <Badge key={`${m.name}-${m.dose ?? i}`} variant="secondary" size="sm">
            {m.name}
            {m.dose ? ` ${m.dose}` : ''}
          </Badge>
        ))}
        {remaining > 0 && (
          <span className="text-primary text-xs">+{remaining} more</span>
        )}
      </div>
    </div>
  );
}

/** Single menu item inside the overflow dropdown */
function OverflowMenuItem({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-sm',
        'text-foreground hover:bg-muted/50 transition-colors',
        'focus-visible:bg-muted/50 focus-visible:outline-none'
      )}
    >
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

/** Patient-level overflow menu (⋮) with grouped actions */
function PatientOverflowMenu({
  onAction,
}: {
  onAction?: (action: PatientOverflowAction) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useClickOutside(
    menuRef,
    React.useCallback(() => setOpen(false), [])
  );
  useEscapeKey(
    React.useCallback(() => setOpen(false), []),
    open
  );

  const handleAction = (action: PatientOverflowAction) => {
    onAction?.(action);
    setOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        aria-label="Patient actions menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className="h-8 w-8"
      >
        <MoreVerticalIcon size={18} />
      </Button>

      {open && (
        <div
          role="menu"
          aria-label="Patient actions"
          className={cn(
            'absolute top-full right-0 z-50 mt-1',
            'border-border bg-card rounded-xl border py-1 shadow-lg',
            'max-h-[calc(100vh-4rem)] overflow-y-auto',
            'motion-safe:animate-fade-in',
            'w-56 sm:w-auto'
          )}
        >
          {/* ── Quick Actions + Add side-by-side on sm+, stacked on mobile ── */}
          <div className="flex flex-col sm:flex-row">
            {/* Quick Actions column */}
            <div className="min-w-[13rem]">
              <div className="px-3 py-1.5">
                <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                  Quick Actions
                </span>
              </div>
              <OverflowMenuItem
                icon={<PencilIcon size={15} />}
                label="Edit Patient"
                onClick={() => handleAction('edit-patient')}
              />
              <OverflowMenuItem
                icon={<PhoneIcon size={15} />}
                label="Contact"
                onClick={() => handleAction('contact')}
              />
              <OverflowMenuItem
                icon={<SendIcon size={15} />}
                label="Send Message"
                onClick={() => handleAction('send-message')}
              />
              <OverflowMenuItem
                icon={<CalendarIcon size={15} />}
                label="Schedule Appointment"
                onClick={() => handleAction('schedule-appointment')}
              />
              <OverflowMenuItem
                icon={<PrinterIcon size={15} />}
                label="Print Summary"
                onClick={() => handleAction('print-summary')}
              />
              <OverflowMenuItem
                icon={<DownloadIcon size={15} />}
                label="Export Record"
                onClick={() => handleAction('export-record')}
              />
            </div>

            {/* Divider: horizontal on mobile, vertical on desktop */}
            <div className="border-border my-1 border-t sm:my-0 sm:border-t-0 sm:border-l" />

            {/* Add column */}
            <div className="min-w-[26rem]">
              <div className="px-3 py-1.5">
                <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                  Add
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <OverflowMenuItem
                  icon={<ClipboardPlusIcon size={15} />}
                  label="Task"
                  onClick={() => handleAction('add-task')}
                />
                <OverflowMenuItem
                  icon={<StethoscopeIcon size={15} />}
                  label="Encounter"
                  onClick={() => handleAction('add-encounter')}
                />
                <OverflowMenuItem
                  icon={<ClipboardCheckIcon size={15} />}
                  label="Due List Item"
                  onClick={() => handleAction('add-due-list')}
                />
                <OverflowMenuItem
                  icon={<FilePlusIcon size={15} />}
                  label="Order Request"
                  onClick={() => handleAction('add-order')}
                />
                <OverflowMenuItem
                  icon={<FileCheckIcon size={15} />}
                  label="eSign Request"
                  onClick={() => handleAction('add-esign')}
                />
                <OverflowMenuItem
                  icon={<AllergyIcon size={15} />}
                  label="Allergy"
                  onClick={() => handleAction('add-allergy')}
                />
                <OverflowMenuItem
                  icon={<PillIcon size={15} />}
                  label="Medication"
                  onClick={() => handleAction('add-medication')}
                />
                <OverflowMenuItem
                  icon={<BellIcon size={15} />}
                  label="Alert"
                  onClick={() => handleAction('add-alert')}
                />
                <OverflowMenuItem
                  icon={<FileHeartIcon size={15} />}
                  label="Condition"
                  onClick={() => handleAction('add-condition')}
                />
                <OverflowMenuItem
                  icon={<HeartPulseIcon size={15} />}
                  label="Vitals"
                  onClick={() => handleAction('add-vitals')}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Comments/alert row */
function AlertRow({ comments }: { comments: string[] }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex shrink-0 items-center gap-1.5">
        <ClipboardListIcon size={16} className="text-muted-foreground/60" />
        <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          Alert
        </span>
      </div>
      <span className="text-foreground text-sm">{comments.join('; ')}</span>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * A patient header component displaying identifying information, demographics,
 * allergy/medication alerts, and action buttons.
 *
 * Reuses existing components: `Avatar`, `Badge`, `Button`, and icons from `Icons/`.
 *
 * @example
 * ```tsx
 * <PatientHeader
 *   patient={{
 *     name: { first: 'William', last: 'Hart' },
 *     mrn: 'MRN-000001',
 *     dob: '1948-04-03',
 *     age: 77,
 *     sex: 'M',
 *     status: 'active',
 *     email: 'whart@example.com',
 *     phone: '555-867-5309',
 *     employer: 'Better Corp.',
 *     attendingProvider: 'Selenium Selenium',
 *     familyProvider: 'John M. Sample, M.D.',
 *   }}
 *   allergies={[{ name: 'Penicillin' }, { name: 'Sulfa Drugs' }]}
 *   medications={[
 *     { name: 'Atorvastatin', dose: '20 mg' },
 *     { name: 'Lisinopril', dose: '10 mg' },
 *   ]}
 *   showAllergyBanner
 *   showMedicationBanner
 *   showProviderBanner
 * />
 * ```
 */
export const PatientHeader = React.forwardRef<
  HTMLDivElement,
  PatientHeaderProps
>(
  (
    {
      patient,
      allergies = [],
      medications = [],
      comments = [],
      sticky = false,
      showBackButton = false,
      onBack,
      actions,
      showAllergyBanner = false,
      showMedicationBanner = false,
      showCommentsBanner = false,
      showProviderBanner = false,
      showFlagBanner = false,
      showOverflowMenu = false,
      onOverflowAction,
      onAddItem,
      onEditPatient,
      maxVisibleMeds = 4,
      className,
      'data-testid': testId = 'patient-header',
      ...props
    },
    ref
  ) => {
    const hasAllergies = showAllergyBanner && allergies.length > 0;
    const hasMedications = showMedicationBanner && medications.length > 0;
    const hasComments = showCommentsBanner && comments.length > 0;
    const hasProviders =
      showProviderBanner &&
      !!(patient.attendingProvider || patient.familyProvider);
    const hasInfoRows =
      hasAllergies || hasMedications || hasComments || hasProviders;

    // ─── Add-entity modal state ───
    const [addModalType, setAddModalType] =
      React.useState<PatientOverflowAction | null>(null);
    const [addForm, setAddForm] = React.useState<Record<string, string>>({});

    const addEntityLabel = addModalType
      ? (ADD_ENTITY_LABELS[addModalType] ?? '')
      : '';

    // ─── Contact modal state ───
    const [contactModalOpen, setContactModalOpen] = React.useState(false);

    // ─── Edit Patient modal state ───
    const [editPatientOpen, setEditPatientOpen] = React.useState(false);
    const [editPatientForm, setEditPatientForm] = React.useState<
      Record<string, string>
    >({});

    /** Intercept overflow actions — open contact modal, add-* modals, and edit-patient modal */
    const handleOverflowAction = React.useCallback(
      (action: PatientOverflowAction) => {
        if (action === 'contact') {
          setContactModalOpen(true);
        } else if (action === 'edit-patient') {
          setEditPatientOpen(true);
          setEditPatientForm({
            firstName: patient.name.first,
            middleName: patient.name.middle ?? '',
            lastName: patient.name.last,
            suffix: patient.name.suffix ?? '',
            mrn: patient.mrn,
            status: patient.status ?? 'active',
            dob: patient.dob,
            sex: patient.sex,
            email: patient.email ?? '',
            phone: patient.phone ?? '',
            employer: patient.employer ?? '',
            attendingProvider: patient.attendingProvider ?? '',
            familyProvider: patient.familyProvider ?? '',
          });
        } else if (action.startsWith('add-')) {
          setAddModalType(action);
          setAddForm({
            label: '',
            status: 'pending',
            priority: 'Normal',
            assignedTo: '',
            dueDate: '',
            notes: '',
          });
        } else {
          onOverflowAction?.(action);
        }
      },
      [onOverflowAction, patient]
    );

    const displayName = formatPatientName(patient.name);

    return (
      <div
        ref={ref}
        data-testid={testId}
        className={cn(
          'border-border bg-card text-card-foreground w-full border-b',
          'transition-colors duration-200',
          sticky && 'sticky top-0 z-40',
          className
        )}
        {...props}
      >
        {/* ─── Main header row ─── */}
        <div className="flex items-start gap-4 px-5 py-4">
          {/* Back button */}
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              disabled={!onBack}
              aria-label="Go back"
              className="mt-1 -ml-2 h-8 w-8 shrink-0"
            >
              <ArrowLeftIcon size={18} />
            </Button>
          )}

          {/* Avatar – hidden on mobile */}
          <Avatar
            name={formatFullName(patient.name)}
            src={patient.photo}
            size="md"
            className="hidden shrink-0 md:inline-flex"
          />

          {/* Content block */}
          <div className="min-w-0 flex-1">
            {/* Flex-wrap container: order controls mobile vs desktop layout */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {/* Name */}
              <h2 className="text-foreground order-1 min-w-0 flex-1 truncate text-xl font-bold">
                {displayName}
              </h2>

              {/* Overflow menu: order-2 on mobile (right of name), order-3 on desktop (after actions) */}
              {showOverflowMenu && (
                <div className="order-2 shrink-0 md:order-3">
                  <PatientOverflowMenu onAction={handleOverflowAction} />
                </div>
              )}

              {/* Actions (CountBadges): own row on mobile (order-4), inline on desktop (order-2) */}
              {actions && (
                <div
                  className={cn(
                    'order-4 w-full md:order-2 md:w-auto md:shrink-0',
                    'mt-1 md:mt-0',
                    '[&_button[data-count-badge]]:gap-1.5 [&_button[data-count-badge]]:px-2 [&_button[data-count-badge]]:py-0.5 [&_button[data-count-badge]]:text-xs',
                    'md:[&_button[data-count-badge]]:gap-2 md:[&_button[data-count-badge]]:px-3 md:[&_button[data-count-badge]]:py-1 md:[&_button[data-count-badge]]:text-sm'
                  )}
                >
                  {actions}
                </div>
              )}

              {/* Demographics: order-3 on mobile (before actions), order-4 on desktop (last) */}
              <div className="order-3 mt-1 flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-sm md:order-4">
                {patient.status &&
                  (() => {
                    const normalizedStatus = patient.status.toLowerCase();
                    const statusColorMap: Record<string, string> = {
                      active: 'bg-green-500',
                      inactive: 'bg-gray-400',
                      deceased: 'bg-red-500',
                    };
                    const statusColorClass =
                      statusColorMap[normalizedStatus] ?? 'bg-yellow-500';

                    return (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap">
                        <span
                          aria-hidden="true"
                          className={`inline-block h-2 w-2 rounded-full ${statusColorClass}`}
                        />
                        <span className="text-muted-foreground capitalize">
                          {normalizedStatus}
                        </span>
                      </span>
                    );
                  })()}
                <span className="text-muted-foreground whitespace-nowrap">
                  MRN: {patient.mrn}
                </span>
                <span className="text-muted-foreground whitespace-nowrap">
                  {patient.age} y/o {patient.sex}
                </span>
                <span className="text-muted-foreground whitespace-nowrap">
                  DOB: {patient.dob}
                </span>
                {patient.employer && (
                  <span className="text-muted-foreground whitespace-nowrap">
                    {patient.employer}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* ─── Info rows: Allergies, Meds, Alerts, Providers ─── */}
        {hasInfoRows && (
          <div className="border-border bg-muted/30 mx-5 mb-3 space-y-2.5 rounded-lg border px-4 py-3">
            {hasAllergies && <AllergyRow allergies={allergies} />}
            {hasMedications && (
              <MedicationRow
                medications={medications}
                maxVisible={maxVisibleMeds}
              />
            )}
            {hasComments && <AlertRow comments={comments} />}
            {hasProviders && (
              <div className="flex flex-wrap gap-x-8 gap-y-2">
                {patient.attendingProvider && (
                  <DetailItem
                    icon={<StethoscopeIcon size={14} />}
                    label="Attending"
                    value={patient.attendingProvider}
                  />
                )}
                {patient.familyProvider && (
                  <DetailItem
                    icon={<UsersIcon size={14} />}
                    label="Family MD"
                    value={patient.familyProvider}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Flag ribbon (e.g. Duplicate) ─── */}
        {showFlagBanner && patient.flags && patient.flags.length > 0 && (
          <div className="border-t border-amber-200 bg-amber-50 px-5 py-1.5 text-left text-xs font-medium tracking-wide text-amber-800 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-300">
            {patient.flags
              .map(
                (flag) =>
                  flag.charAt(0).toUpperCase() + flag.slice(1).toLowerCase()
              )
              .join(' · ')}
          </div>
        )}

        {/* ─── Contact modal ─── */}
        <Modal
          open={contactModalOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) setContactModalOpen(false);
          }}
          size="sm"
        >
          <ModalHeader>
            <ModalTitle>Contact Information</ModalTitle>
            <ModalClose />
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {patient.email && (
                <div className="flex items-center gap-3">
                  <MailIcon
                    size={18}
                    className="text-muted-foreground shrink-0"
                  />
                  <div>
                    <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Email
                    </span>
                    <p className="text-foreground text-sm">{patient.email}</p>
                  </div>
                </div>
              )}
              {patient.phone && (
                <div className="flex items-center gap-3">
                  <PhoneIcon
                    size={18}
                    className="text-muted-foreground shrink-0"
                  />
                  <div>
                    <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                      Phone
                    </span>
                    <p className="text-foreground text-sm">{patient.phone}</p>
                  </div>
                </div>
              )}
              {!patient.email && !patient.phone && (
                <p className="text-muted-foreground text-sm">
                  No contact information available.
                </p>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setContactModalOpen(false)}
            >
              Close
            </Button>
          </ModalFooter>
        </Modal>

        {/* ─── Add entity modal ─── */}
        <Modal
          open={!!addModalType}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setAddModalType(null);
              setAddForm({});
            }
          }}
          size="md"
        >
          <ModalHeader>
            <ModalTitle>Add {addEntityLabel}</ModalTitle>
            <ModalClose />
          </ModalHeader>
          <ModalBody>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <Input
                label="Label"
                value={addForm.label ?? ''}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder={`Enter ${addEntityLabel.toLowerCase()} name…`}
              />

              <div>
                <label
                  htmlFor="ph-add-status"
                  className="text-foreground mb-1.5 block text-sm font-medium"
                >
                  Status
                </label>
                <select
                  id="ph-add-status"
                  value={addForm.status ?? 'pending'}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, status: e.target.value }))
                  }
                  className={cn(
                    'border-input bg-background text-foreground w-full rounded-lg border px-3 py-2 text-base',
                    'transition-colors duration-200',
                    'focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none'
                  )}
                >
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="overdue">Overdue</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="ph-add-priority"
                  className="text-foreground mb-1.5 block text-sm font-medium"
                >
                  Priority
                </label>
                <select
                  id="ph-add-priority"
                  value={addForm.priority ?? 'Normal'}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, priority: e.target.value }))
                  }
                  className={cn(
                    'border-input bg-background text-foreground w-full rounded-lg border px-3 py-2 text-base',
                    'transition-colors duration-200',
                    'focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none'
                  )}
                >
                  <option value="Low">Low</option>
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <Input
                label="Assigned To"
                value={addForm.assignedTo ?? ''}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, assignedTo: e.target.value }))
                }
              />

              <Input
                label="Due Date"
                type="date"
                value={addForm.dueDate ?? ''}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, dueDate: e.target.value }))
                }
              />

              <div>
                <label
                  htmlFor="ph-add-notes"
                  className="text-foreground mb-1.5 block text-sm font-medium"
                >
                  Notes
                </label>
                <textarea
                  id="ph-add-notes"
                  rows={3}
                  value={addForm.notes ?? ''}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  className={cn(
                    'border-input bg-background text-foreground w-full rounded-lg border px-3 py-2 text-base',
                    'placeholder:text-muted-foreground',
                    'transition-colors duration-200',
                    'focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none'
                  )}
                  placeholder="Add notes…"
                />
              </div>
            </form>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setAddModalType(null);
                setAddForm({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (addModalType) {
                  onAddItem?.(addModalType, addForm);
                }
                setAddModalType(null);
                setAddForm({});
              }}
            >
              Add {addEntityLabel}
            </Button>
          </ModalFooter>
        </Modal>

        {/* ─── Edit Patient modal ─── */}
        <Modal
          open={editPatientOpen}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditPatientOpen(false);
              setEditPatientForm({});
            }
          }}
          size="2xl"
        >
          <ModalHeader>
            <ModalTitle>Edit Patient</ModalTitle>
            <ModalClose />
          </ModalHeader>
          <ModalBody>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {/* First / Middle / Last / Suffix */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <Input
                  label="First Name"
                  value={editPatientForm.firstName ?? ''}
                  onChange={(e) =>
                    setEditPatientForm((f) => ({
                      ...f,
                      firstName: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Middle Name"
                  value={editPatientForm.middleName ?? ''}
                  onChange={(e) =>
                    setEditPatientForm((f) => ({
                      ...f,
                      middleName: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Last Name"
                  value={editPatientForm.lastName ?? ''}
                  onChange={(e) =>
                    setEditPatientForm((f) => ({
                      ...f,
                      lastName: e.target.value,
                    }))
                  }
                />
                <Input
                  label="Suffix"
                  value={editPatientForm.suffix ?? ''}
                  onChange={(e) =>
                    setEditPatientForm((f) => ({
                      ...f,
                      suffix: e.target.value,
                    }))
                  }
                  placeholder="Jr., Sr., III…"
                />
              </div>

              {/* Sex / DOB */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="ph-edit-sex"
                    className="text-foreground mb-1.5 block text-sm font-medium"
                  >
                    Sex
                  </label>
                  <select
                    id="ph-edit-sex"
                    value={editPatientForm.sex ?? 'U'}
                    onChange={(e) =>
                      setEditPatientForm((f) => ({ ...f, sex: e.target.value }))
                    }
                    className={cn(
                      'border-input bg-background text-foreground w-full rounded-lg border px-3 py-2 text-base',
                      'transition-colors duration-200',
                      'focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none'
                    )}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="U">Unknown</option>
                  </select>
                </div>
                <Input
                  label="Date of Birth"
                  value={editPatientForm.dob ?? ''}
                  onChange={(e) =>
                    setEditPatientForm((f) => ({ ...f, dob: e.target.value }))
                  }
                  placeholder="MM-DD-YYYY"
                />
              </div>

              {/* MRN (read-only) / Status */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="MRN"
                  value={editPatientForm.mrn ?? ''}
                  readOnly
                  className="bg-muted/50 cursor-not-allowed opacity-70"
                />
                <div>
                  <label
                    htmlFor="ph-edit-status"
                    className="text-foreground mb-1.5 block text-sm font-medium"
                  >
                    Status
                  </label>
                  <select
                    id="ph-edit-status"
                    value={editPatientForm.status ?? 'active'}
                    onChange={(e) =>
                      setEditPatientForm((f) => ({
                        ...f,
                        status: e.target.value,
                      }))
                    }
                    className={cn(
                      'border-input bg-background text-foreground w-full rounded-lg border px-3 py-2 text-base',
                      'transition-colors duration-200',
                      'focus:ring-ring focus:border-transparent focus:ring-2 focus:outline-none'
                    )}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="deceased">Deceased</option>
                  </select>
                </div>
              </div>

              {/* Email / Phone */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Email"
                  type="email"
                  value={editPatientForm.email ?? ''}
                  onChange={(e) =>
                    setEditPatientForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
                <Input
                  label="Phone"
                  type="tel"
                  value={editPatientForm.phone ?? ''}
                  onChange={(e) =>
                    setEditPatientForm((f) => ({ ...f, phone: e.target.value }))
                  }
                />
              </div>

              {/* Read-only Employer */}
              <Input
                label="Employer"
                value={editPatientForm.employer ?? ''}
                readOnly
                className="bg-muted/50 cursor-not-allowed opacity-70"
              />

              <Input
                label="Attending Provider"
                value={editPatientForm.attendingProvider ?? ''}
                onChange={(e) =>
                  setEditPatientForm((f) => ({
                    ...f,
                    attendingProvider: e.target.value,
                  }))
                }
              />

              <Input
                label="Family MD"
                value={editPatientForm.familyProvider ?? ''}
                onChange={(e) =>
                  setEditPatientForm((f) => ({
                    ...f,
                    familyProvider: e.target.value,
                  }))
                }
              />
            </form>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setEditPatientOpen(false);
                setEditPatientForm({});
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                onEditPatient?.(editPatientForm);
                setEditPatientOpen(false);
                setEditPatientForm({});
              }}
            >
              Save
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
);

PatientHeader.displayName = 'PatientHeader';
