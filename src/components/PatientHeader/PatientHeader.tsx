import * as React from 'react';
import { cn } from '../../utils/cn';
import { Avatar } from '../Avatar';
import { Badge } from '../Badge';
import { Button } from '../Button';
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

export interface PatientHeaderProps {
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
  if (name.middle) parts.push(name.middle);
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

function getStatusVariant(
  status?: string
): 'success' | 'danger' | 'secondary' {
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
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className="shrink-0 text-muted-foreground/60">{icon}</span>
      <span className="font-semibold uppercase text-xs tracking-wide text-muted-foreground/80">
        {label}
      </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

/** Allergy row with badge pills */
function AllergyRow({ allergies }: { allergies: AllergyItem[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 shrink-0">
        <AlertCircleIcon
          size={16}
          className="text-red-500 dark:text-red-400"
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
          Allergies
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {allergies.map((a) => (
          <Badge
            key={a.name}
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
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 shrink-0">
        <PaperclipIcon
          size={16}
          className="text-muted-foreground/60"
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Meds
        </span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {visible.map((m) => (
          <Badge
            key={m.name}
            variant="secondary"
            size="sm"
          >
            {m.name}{m.dose ? ` ${m.dose}` : ''}
          </Badge>
        ))}
        {remaining > 0 && (
          <span className="text-xs text-primary cursor-pointer hover:underline">
            +{remaining} more
          </span>
        )}
      </div>
    </div>
  );
}

/** Comments/alert row */
function AlertRow({ comments }: { comments: string[] }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 shrink-0">
        <ClipboardListIcon
          size={16}
          className="text-muted-foreground/60"
        />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Alert
        </span>
      </div>
      <span className="text-sm text-foreground">{comments.join('; ')}</span>
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

    // Close dropdown on outside click
    React.useEffect(() => {
      if (!actionsMenuOpen) return;
      function handleClick(e: MouseEvent) {
        if (
          actionsMenuRef.current &&
          !actionsMenuRef.current.contains(e.target as Node)
        ) {
          setActionsMenuOpen(false);
        }
      }
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }, [actionsMenuOpen]);

    React.useEffect(() => {
      if (detailsExpandedProp !== undefined) {
        setDetailsExpanded(detailsExpandedProp);
      }
    }, [detailsExpandedProp]);

    const displayName = formatPatientName(patient.name);

    return (
      <div
        ref={ref}
        data-testid={testId}
        className={cn(
          'w-full border-b border-border bg-card text-card-foreground',
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
              aria-label="Go back"
              className="shrink-0 -ml-2 mt-1 h-8 w-8"
            >
              <ArrowLeftIcon size={18} />
            </Button>
          )}

          {/* Avatar */}
          <Avatar
            name={formatFullName(patient.name)}
            src={patient.photo}
            size="lg"
            className="shrink-0 mt-0.5"
          />

          {/* Name block */}
          <div className="min-w-0 flex-1">
            {/* Top line: name, age/sex, MRN */}
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="text-xl font-bold text-foreground truncate">
                {displayName}
              </h2>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {patient.age} y/o {patient.sex}
              </span>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                MRN: {patient.mrn}
              </span>
            </div>

            {/* Second line: status + flag badges */}
            {(patient.status || (patient.flags && patient.flags.length > 0)) && (
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

          {/* Right side: actions slot */}
          {actions && (
            <div className="relative shrink-0 mt-1">
              {/* Desktop: inline */}
              <div className="hidden md:flex items-center gap-2">
                {actions}
              </div>

              {/* Mobile: hamburger menu */}
              <div className="md:hidden" ref={actionsMenuRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                  aria-label="Open actions menu"
                  aria-expanded={actionsMenuOpen}
                  className="h-8 w-8"
                >
                  <MenuIcon size={18} />
                </Button>

                {actionsMenuOpen && (
                  <div
                    className={cn(
                      'absolute right-0 top-full mt-1 z-50',
                      'min-w-[200px] rounded-lg border border-border',
                      'bg-card shadow-lg',
                      'p-2 flex flex-col gap-1.5',
                      'animate-fade-in'
                    )}
                  >
                    {actions}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Alerts section ─── */}
        {hasAlerts && (
          <div className="mx-5 mb-3 rounded-lg border border-border bg-muted/30 px-4 py-3 space-y-2.5">
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
            <div className="border-t border-border">
              <button
                type="button"
                onClick={() => setDetailsExpanded(!detailsExpanded)}
                className={cn(
                  'flex items-center gap-1 px-5 py-2 text-sm text-primary',
                  'hover:text-primary/80 transition-colors w-full'
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
              <div className="border-t border-border px-5 py-4 space-y-3 animate-fade-in">
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
      </div>
    );
  }
);

PatientHeader.displayName = 'PatientHeader';
