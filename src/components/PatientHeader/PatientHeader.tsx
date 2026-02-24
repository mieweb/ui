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
  ChevronUpIcon,
  ChevronDownIcon,
  BuildingIcon,
  StethoscopeIcon,
  UsersIcon,
  MenuIcon,
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
  /** Show collapsible demographics detail section (default: false) */
  showDetails?: boolean;
  /** Whether demographics details are expanded initially (default: true) */
  detailsExpanded?: boolean;
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

function getStatusVariant(status?: string): 'success' | 'danger' | 'secondary' {
  switch (status) {
    case 'active':
      return 'success';
    case 'deceased':
      return 'danger';
    case 'inactive':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function getFlagVariant(flag: string): 'warning' | 'danger' | 'secondary' {
  const lower = flag.toLowerCase();
  if (lower === 'duplicate') return 'warning';
  if (lower === 'deceased' || lower === 'restricted') return 'danger';
  return 'secondary';
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
            'max-h-[420px] overflow-y-auto',
            'motion-safe:animate-fade-in',
            'w-56 sm:w-auto'
          )}
        >
          {/* ── Edit (full width, top) ── */}
          <div className="px-3 py-1.5">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              Edit
            </span>
          </div>
          <OverflowMenuItem
            icon={<PencilIcon size={15} />}
            label="Edit Patient"
            onClick={() => handleAction('edit-patient')}
          />

          <div className="border-border my-1 border-t" />

          {/* ── Add + Quick Actions side-by-side on sm+, stacked on mobile ── */}
          <div className="flex flex-col sm:flex-row">
            {/* Add column */}
            <div className="min-w-[13rem]">
              <div className="px-3 py-1.5">
                <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                  Add
                </span>
              </div>
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
            </div>

            {/* Divider: horizontal on mobile, vertical on desktop */}
            <div className="border-border my-1 border-t sm:my-0 sm:border-t-0 sm:border-l" />

            {/* Quick Actions column */}
            <div className="min-w-[13rem]">
              <div className="px-3 py-1.5">
                <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                  Quick Actions
                </span>
              </div>
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
 *   showDetails
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
      showDetails = false,
      detailsExpanded: detailsExpandedProp,
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
    const hasAlerts = hasAllergies || hasMedications || hasComments;

    const [detailsExpanded, setDetailsExpanded] = React.useState(
      detailsExpandedProp ?? true
    );

    const [actionsMenuOpen, setActionsMenuOpen] = React.useState(false);
    const actionsMenuRef = React.useRef<HTMLDivElement>(null);

    useClickOutside(
      actionsMenuRef,
      React.useCallback(() => setActionsMenuOpen(false), [])
    );
    useEscapeKey(
      React.useCallback(() => setActionsMenuOpen(false), []),
      actionsMenuOpen
    );

    React.useEffect(() => {
      if (detailsExpandedProp !== undefined) {
        setDetailsExpanded(detailsExpandedProp);
      }
    }, [detailsExpandedProp]);

    // ─── Add-entity modal state ───
    const [addModalType, setAddModalType] =
      React.useState<PatientOverflowAction | null>(null);
    const [addForm, setAddForm] = React.useState<Record<string, string>>({});

    const addEntityLabel = addModalType
      ? (ADD_ENTITY_LABELS[addModalType] ?? '')
      : '';

    // ─── Edit Patient modal state ───
    const [editPatientOpen, setEditPatientOpen] = React.useState(false);
    const [editPatientForm, setEditPatientForm] = React.useState<
      Record<string, string>
    >({});

    /** Intercept overflow actions — open add modal for add-* keys, edit-patient modal */
    const handleOverflowAction = React.useCallback(
      (action: PatientOverflowAction) => {
        if (action === 'edit-patient') {
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

          {/* Avatar */}
          <Avatar
            name={formatFullName(patient.name)}
            src={patient.photo}
            size="lg"
            className="mt-0.5 shrink-0"
          />

          {/* Name block */}
          <div className="min-w-0 flex-1">
            {/* Top line: name, age/sex, MRN */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-foreground truncate text-xl font-bold">
                {displayName}
              </h2>
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                {patient.age} y/o {patient.sex}
              </span>
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                MRN: {patient.mrn}
              </span>
            </div>

            {/* Second line: status + flag badges */}
            {(patient.status ||
              (patient.flags && patient.flags.length > 0)) && (
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {patient.status && (
                  <Badge
                    variant={getStatusVariant(patient.status)}
                    size="sm"
                    className="uppercase"
                  >
                    {patient.status}
                  </Badge>
                )}
                {patient.flags?.map((flag) => (
                  <Badge key={flag} variant={getFlagVariant(flag)} size="sm">
                    {flag.toUpperCase()}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Right side: actions + overflow menu */}
          {(actions || showOverflowMenu) && (
            <div className="mt-1 flex shrink-0 items-start gap-1">
              {actions && (
                <div className="relative" ref={actionsMenuRef}>
                  {/* Mobile: popover toggle button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                    aria-label="Open actions menu"
                    aria-haspopup="true"
                    aria-expanded={actionsMenuOpen}
                    aria-controls="patient-actions-menu"
                    className="h-8 w-8 md:hidden"
                  >
                    <MenuIcon size={18} />
                  </Button>

                  {/* Actions: inline on desktop, popover on mobile */}
                  <div
                    id="patient-actions-menu"
                    role="group"
                    aria-label="Patient actions"
                    className={cn(
                      'hidden items-center gap-2 md:flex',
                      actionsMenuOpen &&
                        'border-border bg-card motion-safe:animate-fade-in absolute top-full right-0 z-50 mt-1 !flex min-w-[12rem] flex-col gap-1.5 rounded-xl border p-2 shadow-lg',
                      'md:static md:z-auto md:mt-0 md:min-w-0 md:flex-row md:gap-2 md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none'
                    )}
                  >
                    {actions}
                  </div>
                </div>
              )}

              {/* Patient-level overflow menu */}
              {showOverflowMenu && (
                <PatientOverflowMenu onAction={handleOverflowAction} />
              )}
            </div>
          )}
        </div>

        {/* ─── Alerts section ─── */}
        {hasAlerts && (
          <div className="border-border bg-muted/30 mx-5 mb-3 space-y-2.5 rounded-lg border px-4 py-3">
            {hasAllergies && <AllergyRow allergies={allergies} />}
            {hasMedications && (
              <MedicationRow
                medications={medications}
                maxVisible={maxVisibleMeds}
              />
            )}
            {hasComments && <AlertRow comments={comments} />}
          </div>
        )}

        {/* ─── Details toggle + demographics ─── */}
        {showDetails && (
          <>
            <div className="border-border border-t">
              <button
                type="button"
                onClick={() => setDetailsExpanded(!detailsExpanded)}
                aria-expanded={detailsExpanded}
                aria-controls="patient-details-content"
                className={cn(
                  'text-primary-800 dark:text-primary-300 flex items-center gap-1 px-5 py-2 text-sm',
                  'hover:text-primary-900 dark:hover:text-primary-200 w-full transition-colors',
                  'focus-visible:ring-ring focus-visible:ring-offset-background rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none'
                )}
              >
                <span>{detailsExpanded ? 'Hide details' : 'Show details'}</span>
                {detailsExpanded ? (
                  <ChevronUpIcon size={14} />
                ) : (
                  <ChevronDownIcon size={14} />
                )}
              </button>
            </div>

            {detailsExpanded && (
              <div
                id="patient-details-content"
                className="border-border motion-safe:animate-fade-in space-y-3 border-t px-5 py-4"
              >
                {/* Row 1 */}
                <div className="flex flex-wrap gap-x-10 gap-y-3">
                  <DetailItem
                    icon={<CalendarIcon size={14} />}
                    label="DOB"
                    value={patient.dob}
                  />
                  {patient.email && (
                    <DetailItem
                      icon={<MailIcon size={14} />}
                      label="Email"
                      value={patient.email}
                    />
                  )}
                  {patient.phone && (
                    <DetailItem
                      icon={<PhoneIcon size={14} />}
                      label="Phone"
                      value={patient.phone}
                    />
                  )}
                  {patient.employer && (
                    <DetailItem
                      icon={<BuildingIcon size={14} />}
                      label="Employer"
                      value={patient.employer}
                    />
                  )}
                </div>

                {/* Row 2 */}
                {(patient.attendingProvider || patient.familyProvider) && (
                  <div className="flex flex-wrap gap-x-10 gap-y-3">
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
          </>
        )}

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
