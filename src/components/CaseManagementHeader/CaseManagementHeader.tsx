import * as React from 'react';
import { cn } from '../../utils/cn';
import { Badge, type BadgeProps } from '../Badge';
import { Button } from '../Button';
import { ButtonGroup } from '../ButtonGroup';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  FilePlusIcon,
  PlusIcon,
  UsersIcon,
} from '../Icons';

// =============================================================================
// Types
// =============================================================================

export interface CaseInfo {
  /** Case number, e.g. "S2025-0001" (rendered with a leading #) */
  caseNumber: string;
  /** Status label, e.g. "Open" */
  status: string;
  /** Badge variant for the status pill (default: 'success') */
  statusVariant?: BadgeProps['variant'];
  /** Case type, e.g. "Absence management" */
  caseType?: string;
  /** Date the case was opened (ISO 8601 date/datetime string) */
  openedDate?: string;
  /** Days the case has been open; computed from `openedDate` when omitted */
  daysOpen?: number;
}

export interface CasePatient {
  /** Patient display name */
  name: string;
  /** Medical record number */
  mrn?: string;
  /** Date of birth (display string) */
  dob?: string;
  /** Age shown next to the DOB, e.g. 48 */
  age?: number | string;
}

/** One label/value pair in the expandable case details grid */
export interface CaseDetailItem {
  label: string;
  value: React.ReactNode;
}

/** Every user-facing string, so apps can translate the header */
export interface CaseManagementHeaderLabels {
  /** Tooltip on the case number, e.g. `Case# S2025-0001` */
  caseNumberTooltip: (caseNumber: string) => string;
  /** Label of the days-open item in the details grid, e.g. "Days Open" */
  daysOpenTerm: string;
  /** MRN field label */
  mrn: string;
  /** DOB field label */
  dob: string;
  /** Age rendered next to the DOB, e.g. `(48 y.o.)` */
  formatAge: (age: number | string) => string;
  /** Label of the built-in add-case-note action */
  addCaseNote: string;
  /** Label of the built-in close-case action */
  closeCase: string;
  /** Accessible name of the back button */
  back: string;
  /** Accessible name of the details toggle while collapsed */
  expandDetails: string;
  /** Accessible name of the details toggle while expanded */
  collapseDetails: string;
  /** Summary of who else is editing, e.g. `Ann, Bo are editing` */
  editing: (names: string[]) => string;
  /** Placeholder for missing values, e.g. "—" */
  emptyValue: string;
}

export const defaultCaseManagementHeaderLabels: CaseManagementHeaderLabels = {
  caseNumberTooltip: (caseNumber) => `Case# ${caseNumber}`,
  daysOpenTerm: 'Days Open',
  mrn: 'MRN',
  dob: 'DOB',
  formatAge: (age) => `(${age} y.o.)`,
  addCaseNote: 'Add Case Note',
  closeCase: 'Close Case',
  back: 'Go back',
  expandDetails: 'Show case details',
  collapseDetails: 'Hide case details',
  editing: (names) =>
    `${names.join(', ')} ${names.length === 1 ? 'is' : 'are'} editing`,
  emptyValue: '\u2014',
};

// =============================================================================
// Helpers
// =============================================================================

const MS_PER_DAY = 86_400_000;

function computeDaysOpen(openedDate?: string): number | null {
  if (!openedDate) return null;
  const opened = Date.parse(openedDate);
  if (Number.isNaN(opened)) return null;
  return Math.max(0, Math.floor((Date.now() - opened) / MS_PER_DAY));
}

/** Thin vertical divider used between context bar segments */
function BarDivider() {
  return <span aria-hidden="true" className="bg-border h-4 w-px shrink-0" />;
}

/**
 * Standard header action: a text button on `md`+ screens that swaps for an
 * icon-only equivalent below `md`.
 */
function HeaderActionButton({
  label,
  mobileIcon,
  desktopLeftIcon,
  onClick,
}: {
  label: string;
  mobileIcon: React.ReactNode;
  desktopLeftIcon?: React.ReactElement;
  onClick?: () => void;
}) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        aria-label={label}
        className="h-8 w-8 md:hidden"
      >
        {mobileIcon}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClick}
        leftIcon={desktopLeftIcon}
        className="hidden md:inline-flex"
      >
        {label}
      </Button>
    </>
  );
}

// =============================================================================
// CaseContextBar
// =============================================================================

export interface CaseContextBarProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'className'
> {
  /** Case identity shown on the bar */
  caseInfo: CaseInfo;
  /** Whether to show the back button (default: false) */
  showBackButton?: boolean;
  /** Called when the back button is clicked */
  onBack?: () => void;
  /** Names of other users currently editing the case */
  editingUsers?: string[];
  /** Slot for a live-collaboration indicator, e.g. `<CollabStatus />` */
  collabStatus?: React.ReactNode;
  /** Overrides for any user-facing string */
  labels?: Partial<CaseManagementHeaderLabels>;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Persistent case context strip: case number, status, type, days open, and an
 * optional live-collaboration slot. Rendered on top of
 * {@link CaseManagementHeader}, but exported standalone so apps can pin case
 * context to other pages.
 */
export const CaseContextBar = React.forwardRef<
  HTMLDivElement,
  CaseContextBarProps
>(
  (
    {
      caseInfo,
      showBackButton = false,
      onBack,
      editingUsers,
      collabStatus,
      labels,
      className,
      'data-testid': testId = 'case-context-bar',
      ...props
    },
    ref
  ) => {
    const l = { ...defaultCaseManagementHeaderLabels, ...labels };

    return (
      <div
        ref={ref}
        data-testid={testId}
        data-slot="case-context-bar"
        className={cn(
          'bg-primary-50 dark:bg-primary-950',
          'flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-1.5',
          className
        )}
        {...props}
      >
        {showBackButton && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            disabled={!onBack}
            aria-label={l.back}
            className="-ms-2 h-6 w-6 shrink-0"
          >
            <ArrowLeftIcon size={16} />
          </Button>
        )}
        <span
          title={l.caseNumberTooltip(caseInfo.caseNumber)}
          className="text-foreground text-sm font-bold whitespace-nowrap"
        >
          #{caseInfo.caseNumber}
        </span>
        <Badge variant={caseInfo.statusVariant ?? 'success'} size="sm">
          {caseInfo.status}
        </Badge>
        {caseInfo.caseType && (
          <>
            <BarDivider />
            <span className="text-foreground text-sm">{caseInfo.caseType}</span>
          </>
        )}
        <div className="ms-auto flex items-center gap-4">
          {editingUsers && editingUsers.length > 0 && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <UsersIcon size={14} aria-hidden="true" className="shrink-0" />
              {l.editing(editingUsers)}
            </span>
          )}
          {collabStatus}
        </div>
      </div>
    );
  }
);

CaseContextBar.displayName = 'CaseContextBar';

// =============================================================================
// CaseManagementHeader
// =============================================================================

export interface CaseManagementHeaderProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'className'
> {
  /** Case identity shown on the context bar */
  caseInfo: CaseInfo;
  /** Patient the case belongs to */
  patient: CasePatient;
  /** Label/value pairs shown in the expandable details section */
  details?: CaseDetailItem[];
  /** Stick to top of viewport */
  sticky?: boolean;
  /** Whether to show the back button (default: false) */
  showBackButton?: boolean;
  /** Called when the back button is clicked */
  onBack?: () => void;
  /**
   * Renders the built-in "Add Case Note" action (text button on `md`+, an
   * icon-only button below) and is called when it is clicked.
   */
  onAddCaseNote?: () => void;
  /**
   * Renders the built-in "Close Case" action (text button on `md`+, an
   * icon-only button below) and is called when it is clicked.
   */
  onCloseCase?: () => void;
  /** Slot for extra action buttons, rendered after the built-in actions */
  actions?: React.ReactNode;
  /** Names of other users currently editing the case, shown on the context bar */
  editingUsers?: string[];
  /** Slot for a live-collaboration indicator on the context bar */
  collabStatus?: React.ReactNode;
  /**
   * Slot for an alert attached to the bottom of the header, e.g. an
   * `<Alert variant="danger">` listing required fields blocking case close.
   */
  alert?: React.ReactNode;
  /** Whether to render the case context bar (default: true) */
  showContextBar?: boolean;
  /** Initial expanded state of the details section (uncontrolled) */
  defaultExpanded?: boolean;
  /** Controlled expanded state of the details section */
  expanded?: boolean;
  /** Called when the details toggle is clicked */
  onExpandedChange?: (expanded: boolean) => void;
  /** Overrides for any user-facing string */
  labels?: Partial<CaseManagementHeaderLabels>;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * A case management header: a persistent {@link CaseContextBar} (case number,
 * status, type, days open, live status) over a patient identity row with an
 * actions slot and an expandable case details grid.
 *
 * Reuses existing components: `Badge`, `Button`, and icons from
 * `Icons/`.
 *
 * @example
 * ```tsx
 * <CaseManagementHeader
 *   caseInfo={{
 *     caseNumber: 'S2025-0001',
 *     status: 'Open',
 *     caseType: 'Absence management',
 *     openedDate: '2025-01-21',
 *   }}
 *   patient={{ name: 'Eleanor Washburn' }}
 *   details={[
 *     { label: 'Case Manager', value: 'Unassigned' },
 *     { label: 'Opened', value: 'Jan 21, 2025' },
 *   ]}
 *   onAddCaseNote={() => openNoteEditor()}
 * />
 * ```
 */
export const CaseManagementHeader = React.forwardRef<
  HTMLDivElement,
  CaseManagementHeaderProps
>(
  (
    {
      caseInfo,
      patient,
      details = [],
      sticky = false,
      showBackButton = false,
      onBack,
      onAddCaseNote,
      onCloseCase,
      actions,
      editingUsers,
      collabStatus,
      alert,
      showContextBar = true,
      defaultExpanded = false,
      expanded,
      onExpandedChange,
      labels,
      className,
      'data-testid': testId = 'case-management-header',
      ...props
    },
    ref
  ) => {
    const l = { ...defaultCaseManagementHeaderLabels, ...labels };

    // Expanded state: uncontrolled with `defaultExpanded`, or controlled
    // via `expanded` + `onExpandedChange`.
    const [internalExpanded, setInternalExpanded] =
      React.useState(defaultExpanded);
    const isExpanded = expanded ?? internalExpanded;
    const detailsId = React.useId();

    // Built-in days-open item, appended after the consumer's details.
    const days = caseInfo.daysOpen ?? computeDaysOpen(caseInfo.openedDate);
    const allDetails: CaseDetailItem[] =
      days != null
        ? [...details, { label: l.daysOpenTerm, value: days }]
        : details;
    const hasDetails = allDetails.length > 0;

    const toggleExpanded = () => {
      const next = !isExpanded;
      if (expanded === undefined) setInternalExpanded(next);
      onExpandedChange?.(next);
    };

    return (
      <div
        ref={ref}
        data-testid={testId}
        data-slot="case-management-header"
        className={cn('w-full', sticky && 'sticky top-0 z-40', className)}
        {...props}
      >
        <div
          className={cn(
            'border-border bg-card text-card-foreground border-b',
            'transition-colors duration-200'
          )}
        >
          {showContextBar && (
            <CaseContextBar
              caseInfo={caseInfo}
              showBackButton={showBackButton}
              onBack={onBack}
              editingUsers={editingUsers}
              collabStatus={collabStatus}
              labels={labels}
            />
          )}

          {/* ─── Patient identity row + expandable details ─── */}
          <div className="flex items-center gap-3 px-5 py-3">
            {/* Back button lives on the context bar; keep it here as a
                fallback when the bar is hidden. */}
            {!showContextBar && showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                disabled={!onBack}
                aria-label={l.back}
                className="-ms-2 h-8 w-8 shrink-0"
              >
                <ArrowLeftIcon size={18} />
              </Button>
            )}

            {/* Name + inline MRN/DOB */}
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-0.5">
              <h2 className="text-foreground min-w-0 truncate text-xl font-bold">
                {patient.name}
              </h2>
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                {l.mrn}: {patient.mrn ?? l.emptyValue}
              </span>
              <span className="text-muted-foreground text-sm whitespace-nowrap">
                {l.dob}: {patient.dob ?? l.emptyValue}
                {patient.age != null && ` ${l.formatAge(patient.age)}`}
              </span>
            </div>

            {(onAddCaseNote || onCloseCase || actions) && (
              // Horizontal always: long labels truncate (Button's built-in
              // ellipsis) instead of stacking or starving the identity block.
              <ButtonGroup
                orientation="horizontal"
                className="max-w-[60%] min-w-0 gap-2"
              >
                {onAddCaseNote && (
                  <HeaderActionButton
                    label={l.addCaseNote}
                    mobileIcon={<FilePlusIcon size={16} />}
                    desktopLeftIcon={<PlusIcon size={16} />}
                    onClick={onAddCaseNote}
                  />
                )}
                {onCloseCase && (
                  <HeaderActionButton
                    label={l.closeCase}
                    mobileIcon={<CheckCircleIcon size={16} />}
                    onClick={onCloseCase}
                  />
                )}
                {actions}
              </ButtonGroup>
            )}

            {hasDetails && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleExpanded}
                aria-label={isExpanded ? l.collapseDetails : l.expandDetails}
                aria-expanded={isExpanded}
                aria-controls={detailsId}
                className="text-primary-600 dark:text-primary-400 h-8 w-8 shrink-0"
              >
                <ChevronDownIcon
                  size={18}
                  className={cn(
                    'transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                />
              </Button>
            )}
          </div>

          {/* ─── Expandable case details grid ─── */}
          {hasDetails && isExpanded && (
            <dl
              id={detailsId}
              data-slot="case-details"
              className="flex flex-wrap gap-x-10 gap-y-3 px-5 pb-4"
            >
              {allDetails.map((item) => (
                <div key={item.label} className="min-w-0">
                  <dt className="text-foreground/70 text-[11px] font-medium">
                    {item.label}
                  </dt>
                  <dd className="text-foreground text-sm">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        {/* ─── Alert slot flush below the header border ─── */}
        {alert && <div data-slot="case-header-alert">{alert}</div>}
      </div>
    );
  }
);

CaseManagementHeader.displayName = 'CaseManagementHeader';
