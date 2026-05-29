import { forwardRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Briefcase,
  Calendar,
  FileText,
  FolderOpen,
  HardHat,
  MapPin,
  Shield,
  Stethoscope,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Alert, AlertDescription } from '../Alert';
import { AlertDialog } from '../AlertDialog';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Input } from '../Input';
import { Label } from '../Label';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../Modal';
import { Select, type SelectOption } from '../Select';

/** A selectable option; adjusters may carry contact details for auto-fill. */
export interface CaseSelectOption {
  value: string;
  label: string;
  phone?: string;
  email?: string;
}

/** All editable case-detail fields. Values are stored as strings (form state). */
export interface CaseDetailsValue {
  status?: string;
  caseType?: string;
  caseSeverity?: string;
  caseManager?: string;
  adjuster?: string;
  adjusterPhone?: string;
  adjusterEmail?: string;
  confidential?: boolean;
  dateOfDisability?: string;
  initialContactDate?: string;
  dateClosed?: string;
  closureReason?: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  caseIncidentDate?: string;
  caseIncidentTime?: string;
  reportedDate?: string;
  reportedTime?: string;
  maximumMedicalImprovement?: string;
  ddgDays?: string;
  // Occupational injury
  siteCaseNumber?: string;
  injuryDate?: string;
  injuryTime?: string;
  injuryLocation?: string;
  injuryShift?: string;
  shiftHours?: string;
  shiftStartTime?: string;
  injurySupervisor?: string;
  supervisorNotifiedDate?: string;
  ppiRating?: string;
  // Work related
  isCaseWorkRelated?: string;
  employeeOccupation?: string;
  contingentWork?: string;
  typeOfInjuryOrIllness?: string;
  significantInjuryIllness?: string;
  caseExtent?: string;
  psmIncident?: string;
  sharpsCase?: string;
  workersCompClaim?: string;
  workersCompClaimNumber?: string;
  claimStatusResolution?: string;
  oshaRecordable?: string;
  oshaClassification?: string;
  recordabilityRationale?: string;
  // Location
  incidentOnsiteOffsite?: string;
  workstation?: string;
  locationDescription?: string;
  locationAddress?: string;
  locationCity?: string;
  locationState?: string;
  locationZip?: string;
  locationCountry?: string;
  gpsCoordinates?: string;
  // Incident description
  accidentType?: string;
  seriousInjuryFatality?: string;
  jsaReference?: string;
  objectSubstanceCaused?: string;
  howInjuryHappened?: string;
  employeeDoingBefore?: string;
  // Injury details
  injuryNature?: string;
  injuryCause?: string;
  bodyPartAffected?: string;
  dateOfDeath?: string;
  injuryDescription?: string;
  whatEmployeeDoing?: string;
  whatHappened?: string;
  whatObjectHarmed?: string;
  // Treatment
  medicalTreatmentProvided?: string;
  whereTreatmentProvided?: string;
  treatedInEmergencyRoom?: string;
  hospitalizedOvernight?: string;
  emergencyTransportationUsed?: string;
  caseTransferredTo3rdParty?: string;
  employeeRequestedTreatment?: string;
  firstAidTreatments?: string[];
  treatmentsBeyondFirstAid?: string[];
  prescriptionsPhysicalTherapy?: string;
  treatmentDescription?: string;
  hospitalName?: string;
  hospitalAddress?: string;
  hospitalPhone?: string;
  providerInformation?: string;
  // Work comp
  wcClaimNumber?: string;
  adjusterContact?: string;
  hsProgram?: string;
  processCondition?: string;
  daysAway?: string;
  daysRestricted?: string;
  recordOnly?: string;
  processDetails?: string;
  associatedIICases?: string;
  notifyCaseManagementTPA?: string;
  investigationDetails?: string;
}

export interface OpenTodo {
  id: string;
  activity: string;
  dateScheduled?: string;
}
export interface OpenRestriction {
  id: string;
  restriction: string;
  startDate: string;
  isPermanent?: boolean;
}
export interface OpenAbsence {
  id: string;
  statusType: string;
  customOthName?: string;
  effectiveDate: string;
}

/** Data emitted when the user confirms closing a case. */
export interface CloseCasePayload {
  dateClosed: string;
  closureReason: string;
  actualReturnDate?: string;
  stdEndDate?: string;
  todoIdsToClose: string[];
  restrictionUpdates: Record<string, { endDate?: string; isPermanent?: boolean }>;
  absenceUpdates: Record<string, { status: string; otherStatus?: string }>;
}

export interface CaseDetailsTabProps {
  /** Current field values. */
  value: CaseDetailsValue;
  /** Emit a partial patch of changed fields. */
  onChange: (patch: Partial<CaseDetailsValue>) => void;
  /** Status options (code table). */
  statusOptions: SelectOption[];
  /** Case-type options (code table). */
  caseTypeOptions: SelectOption[];
  /** Case-manager options. */
  caseManagerOptions: SelectOption[];
  /** Closure-reason options. */
  closureReasonOptions: SelectOption[];
  /** Adjuster options (may include phone/email for auto-fill). */
  adjusterOptions?: CaseSelectOption[];
  /** Absence status options for the close-case "Other" sub-status. */
  absenceStatusOptions?: SelectOption[];
  /** Open to-dos shown in the close-case review. */
  openTodos?: OpenTodo[];
  /** Active restrictions shown in the close-case review. */
  openRestrictions?: OpenRestriction[];
  /** Open absences shown in the close-case review. */
  openAbsences?: OpenAbsence[];
  /** Auto-computed DDG return date (display only). */
  ddgReturnDate?: string;
  /** Validation message for the DDG days field. */
  ddgDaysError?: string;
  /** Called when a disability date is set (container generates to-dos). */
  onGenerateTodos?: (disabilityDate: string) => void;
  /** Called when the user confirms closing the case. */
  onCloseCase?: (payload: CloseCasePayload) => void;
  className?: string;
}

const YES_NO: SelectOption[] = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

const SHIFT_OPTIONS: SelectOption[] = [
  '1st shift',
  '2nd shift',
  '3rd shift',
  'Day shift',
  'Night shift',
  'Rotating',
  'Other',
].map((v) => ({ value: v, label: v }));

const ACCIDENT_TYPE_OPTIONS: SelectOption[] = [
  'Slip/trip/fall',
  'Struck by',
  'Struck against',
  'Caught in/between',
  'Overexertion',
  'Repetitive motion',
  'Exposure',
  'Motor vehicle',
  'Other',
].map((v) => ({ value: v, label: v }));

const INJURY_NATURE_OPTIONS: SelectOption[] = [
  'Sprain/strain',
  'Fracture',
  'Cut/laceration',
  'Contusion/bruise',
  'Burn',
  'Amputation',
  'Carpal tunnel',
  'Hernia',
  'Hearing loss',
  'Respiratory',
  'Dermatitis',
  'Other',
].map((v) => ({ value: v, label: v }));

const INJURY_CAUSE_OPTIONS: SelectOption[] = [
  'Overexertion',
  'Fall - same level',
  'Fall - different level',
  'Struck by object',
  'Struck against object',
  'Caught in/between',
  'Repetitive motion',
  'Motor vehicle',
  'Exposure - chemical',
  'Exposure - temperature',
  'Violence',
  'Other',
].map((v) => ({ value: v, label: v }));

const FIRST_AID_TREATMENTS = [
  'Non-prescription (OTC) medication at non-prescription strength',
  'Tetanus immunizations',
  'Cleaning, flushing or soaking wounds on the surface of the skin',
  'Wound coverings such as BandAids; or using butterfly bandages or Steri-Strips',
  'Hot or cold therapy',
  'Non-rigid means of support',
  'Temporary immobilization devices while transporting an accident victim',
  'Drilling of a finger or toenail to relieve pressure, or draining fluid from a blister',
  'Using eye patches',
  'Removing foreign bodies from the eye using only irrigation or a cotton swab',
  'Removing splinters or foreign material from areas other than the eye by irrigation, tweezers, cotton swabs or other simple means',
  'Using finger guards',
  'Massage (including ART)',
  'Drinking fluids for relief of heat stress',
];

const BEYOND_FIRST_AID = [
  'Prescription medication, or OTC medication used at prescription strength',
  'Wound Closure (surgical glue, sutures, staples)',
  'Immobilization',
  'Physical Therapy/Specialized Care',
  'Medical Procedures',
  'Diagnostics',
  'Respiratory Care',
  'Vaccines',
  'Eye Treatment',
];

const todayIso = () => new Date().toISOString().split('T')[0];

interface FieldProps {
  label: string;
  id: string;
}

function TextField({
  label,
  id,
  value,
  onChange,
  placeholder,
  type = 'text',
}: FieldProps & {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({
  label,
  id,
  value,
  onChange,
  options,
  placeholder = 'Select...',
}: FieldProps & {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <Select
        aria-label={label}
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextareaField({
  label,
  id,
  value,
  onChange,
  placeholder,
}: FieldProps & {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
      <textarea
        id={id}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/** Collapsible form section with an icon header. */
function Section({ title, icon, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        className="flex w-full items-center justify-between bg-muted/40 px-4 py-3 text-left font-medium transition-colors hover:bg-muted/60"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {icon}
          {title}
        </span>
        <span className="text-sm text-muted-foreground">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="space-y-4 p-4">{children}</div>}
    </div>
  );
}

/**
 * Presentational case-detail form: collapsible sections for case info, dates,
 * DDG, work-status metrics, occupational injury, work-related details, location,
 * incident description, injury details, treatment, and work-comp. Driven by a
 * controlled `value` object and an `onChange` patch callback. Includes a
 * confidential-case warning dialog and a close-case review dialog (open to-dos,
 * restrictions, and absences). All persistence and to-do generation are owned by
 * the container via callbacks.
 */
export const CaseDetailsTab = forwardRef<HTMLDivElement, CaseDetailsTabProps>(
  function CaseDetailsTab(
    {
      value,
      onChange,
      statusOptions,
      caseTypeOptions,
      caseManagerOptions,
      closureReasonOptions,
      adjusterOptions = [],
      absenceStatusOptions = [],
      openTodos = [],
      openRestrictions = [],
      openAbsences = [],
      ddgReturnDate = '',
      ddgDaysError,
      onGenerateTodos,
      onCloseCase,
      className,
    },
    ref
  ) {
    const set = (patch: Partial<CaseDetailsValue>) => onChange(patch);
    const v = (key: keyof CaseDetailsValue) => (value[key] as string) ?? '';

    const [showConfidentialWarning, setShowConfidentialWarning] = useState(false);
    const [showCloseDialog, setShowCloseDialog] = useState(false);

    // Close-case dialog local state.
    const [closeDate, setCloseDate] = useState(todayIso());
    const [closeReason, setCloseReason] = useState('');
    const [closeActualReturn, setCloseActualReturn] = useState('');
    const [closeStdEnd, setCloseStdEnd] = useState('');
    const [todosToClose, setTodosToClose] = useState<string[]>([]);
    const [restrictionUpdates, setRestrictionUpdates] = useState<
      Record<string, { endDate?: string; isPermanent?: boolean }>
    >({});
    const [absenceUpdates, setAbsenceUpdates] = useState<
      Record<string, { status: string; otherStatus?: string }>
    >({});

    const isClosed = v('status') === 'Closed';

    const handleConfidentialChange = (checked: boolean) => {
      if (checked && !value.confidential) {
        setShowConfidentialWarning(true);
      } else {
        set({ confidential: checked });
      }
    };

    const handleAdjusterChange = (val: string) => {
      const info = adjusterOptions.find((a) => a.value === val);
      set({
        adjuster: val,
        ...(info ? { adjusterPhone: info.phone, adjusterEmail: info.email } : {}),
      });
    };

    const handleDisabilityChange = (val: string) => {
      set({ dateOfDisability: val });
      if (val) onGenerateTodos?.(val);
    };

    const openCloseDialog = () => {
      setCloseDate(todayIso());
      setCloseReason('');
      setCloseActualReturn('');
      setCloseStdEnd('');
      setTodosToClose([]);
      setRestrictionUpdates({});
      setAbsenceUpdates({});
      setShowCloseDialog(true);
    };

    const handleCloseCaseClick = () => {
      if (openTodos.length > 0 || openRestrictions.length > 0) {
        openCloseDialog();
      } else {
        set({ status: 'Closed' });
      }
    };

    const closeDisabled =
      !closeDate ||
      !closeReason ||
      openAbsences.some(
        (a) =>
          absenceUpdates[a.id]?.status === 'OTH' &&
          !absenceUpdates[a.id]?.otherStatus
      ) ||
      (openTodos.length > 0 && todosToClose.length < openTodos.length) ||
      openRestrictions.some((r) => {
        const u = restrictionUpdates[r.id];
        return !(u?.isPermanent || r.isPermanent);
      });

    const confirmCloseCase = () => {
      onCloseCase?.({
        dateClosed: closeDate,
        closureReason: closeReason,
        actualReturnDate: closeActualReturn || undefined,
        stdEndDate: closeStdEnd || undefined,
        todoIdsToClose: todosToClose,
        restrictionUpdates,
        absenceUpdates,
      });
      set({ status: 'Closed', dateClosed: closeDate, closureReason: closeReason });
      setShowCloseDialog(false);
    };

    const occupationalOpen = Boolean(
      v('siteCaseNumber') ||
        v('injuryDate') ||
        v('injuryShift') ||
        v('ppiRating')
    );
    const workRelatedOpen = Boolean(
      v('isCaseWorkRelated') ||
        v('typeOfInjuryOrIllness') ||
        v('workersCompClaim') ||
        v('oshaRecordable')
    );
    const locationOpen = Boolean(
      v('incidentOnsiteOffsite') || v('locationAddress') || v('locationCity')
    );
    const incidentOpen = Boolean(
      v('accidentType') || v('howInjuryHappened') || v('objectSubstanceCaused')
    );
    const injuryDetailsOpen = Boolean(
      v('injuryNature') || v('injuryCause') || v('bodyPartAffected')
    );
    const treatmentOpen = Boolean(
      v('treatmentDescription') || v('treatedInEmergencyRoom')
    );
    const workCompOpen = Boolean(v('wcClaimNumber') || v('adjusterContact'));

    return (
      <div ref={ref} data-slot="case-details-tab" className={cn('space-y-4', className)}>
        {/* Case Information */}
        <Section
          title="Case Information"
          icon={<FolderOpen className="h-4 w-4" aria-hidden="true" />}
          defaultOpen
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField
              id="case-status"
              label="Status"
              value={v('status')}
              onChange={(val) => set({ status: val })}
              options={statusOptions}
            />
            <SelectField
              id="case-type"
              label="Case type"
              value={v('caseType')}
              onChange={(val) => set({ caseType: val })}
              options={caseTypeOptions}
            />
            <TextField
              id="case-severity"
              label="Case severity"
              value={v('caseSeverity')}
              onChange={(val) => set({ caseSeverity: val })}
              placeholder="Enter case severity..."
            />
            <SelectField
              id="case-manager"
              label="Case manager"
              value={v('caseManager')}
              onChange={(val) => set({ caseManager: val })}
              options={caseManagerOptions}
              placeholder="Unassigned"
            />
            <SelectField
              id="case-adjuster"
              label="Adjuster"
              value={v('adjuster')}
              onChange={handleAdjusterChange}
              options={adjusterOptions}
            />
            <TextField
              id="adjuster-phone"
              label="Adjuster Phone"
              type="tel"
              value={v('adjusterPhone')}
              onChange={(val) => set({ adjusterPhone: val })}
              placeholder="(555) 123-4567"
            />
            <TextField
              id="adjuster-email"
              label="Adjuster Email"
              type="email"
              value={v('adjusterEmail')}
              onChange={(val) => set({ adjusterEmail: val })}
              placeholder="adjuster@example.com"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <Checkbox
              label="Confidential Case"
              checked={Boolean(value.confidential)}
              onChange={(e) => handleConfidentialChange(e.target.checked)}
            />
            <Button
              type="button"
              variant={isClosed ? 'secondary' : 'danger'}
              size="sm"
              disabled={isClosed}
              onClick={handleCloseCaseClick}
            >
              {isClosed ? 'Case Closed' : 'Close Case'}
            </Button>
          </div>
        </Section>

        {/* Case Dates */}
        <Section
          title="Case Dates"
          icon={<Calendar className="h-4 w-4" aria-hidden="true" />}
          defaultOpen
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TextField
              id="date-disability"
              label="Date of disability"
              type="date"
              value={v('dateOfDisability')}
              onChange={handleDisabilityChange}
            />
            <TextField
              id="initial-contact"
              label="Initial contact date"
              type="date"
              value={v('initialContactDate')}
              onChange={(val) => set({ initialContactDate: val })}
            />
            <TextField
              id="date-closed"
              label="Date closed"
              type="date"
              value={v('dateClosed')}
              onChange={(val) => set({ dateClosed: val })}
            />
            <SelectField
              id="closure-reason"
              label="Closure Reason"
              value={v('closureReason')}
              onChange={(val) => set({ closureReason: val })}
              options={closureReasonOptions}
            />
            <TextField
              id="expected-return"
              label="Expected return date"
              type="date"
              value={v('expectedReturnDate')}
              onChange={(val) => set({ expectedReturnDate: val })}
            />
            <TextField
              id="actual-return"
              label="Actual return date"
              type="date"
              value={v('actualReturnDate')}
              onChange={(val) => set({ actualReturnDate: val })}
            />
            <TextField
              id="case-incident-date"
              label="Case (incident) date"
              type="date"
              value={v('caseIncidentDate')}
              onChange={(val) => set({ caseIncidentDate: val })}
            />
            <TextField
              id="case-incident-time"
              label="Case (incident) time"
              type="time"
              value={v('caseIncidentTime')}
              onChange={(val) => set({ caseIncidentTime: val })}
            />
            <TextField
              id="reported-date"
              label="Reported date"
              type="date"
              value={v('reportedDate')}
              onChange={(val) => set({ reportedDate: val })}
            />
            <TextField
              id="reported-time"
              label="Reported time"
              type="time"
              value={v('reportedTime')}
              onChange={(val) => set({ reportedTime: val })}
            />
            <TextField
              id="mmi"
              label="Maximum medical improvement (MMI)"
              type="date"
              value={v('maximumMedicalImprovement')}
              onChange={(val) => set({ maximumMedicalImprovement: val })}
            />
          </div>
        </Section>

        {/* DDG */}
        <Section
          title="Disability Duration Guidelines (DDG)"
          icon={<BarChart3 className="h-4 w-4" aria-hidden="true" />}
          defaultOpen
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <TextField
                id="ddg-days"
                label="DDG days"
                type="number"
                value={v('ddgDays')}
                onChange={(val) => set({ ddgDays: val })}
              />
              {ddgDaysError && (
                <p className="text-xs text-destructive">{ddgDaysError}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ddg-return" className="text-sm text-muted-foreground">
                DDG return date{' '}
                <span className="text-xs italic">(auto-calculated)</span>
              </Label>
              <Input id="ddg-return" type="date" value={ddgReturnDate} readOnly />
            </div>
          </div>
        </Section>

        {/* Occupational Injury Information */}
        <Section
          title="Occupational Injury Information"
          icon={<HardHat className="h-4 w-4" aria-hidden="true" />}
          defaultOpen={occupationalOpen}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TextField
              id="site-case-number"
              label="Site Case #"
              value={v('siteCaseNumber')}
              onChange={(val) => set({ siteCaseNumber: val })}
              placeholder="Enter site case number"
            />
            <TextField
              id="injury-date"
              label="Date of injury"
              type="date"
              value={v('injuryDate')}
              onChange={(val) => set({ injuryDate: val })}
            />
            <TextField
              id="injury-time"
              label="Time of injury"
              type="time"
              value={v('injuryTime')}
              onChange={(val) => set({ injuryTime: val })}
            />
            <TextField
              id="injury-location"
              label="Location of injury"
              value={v('injuryLocation')}
              onChange={(val) => set({ injuryLocation: val })}
              placeholder="e.g., Warehouse, Office, Job Site"
            />
            <SelectField
              id="injury-shift"
              label="Shift"
              value={v('injuryShift')}
              onChange={(val) => set({ injuryShift: val })}
              options={SHIFT_OPTIONS}
              placeholder="Select shift..."
            />
            <SelectField
              id="shift-hours"
              label="Shift hours"
              value={v('shiftHours')}
              onChange={(val) => set({ shiftHours: val })}
              options={[
                { value: '40 hrs', label: '40 hrs' },
                { value: '45 hrs', label: '45 hrs' },
              ]}
              placeholder="Select shift hours..."
            />
            <TextField
              id="shift-start-time"
              label="Shift start time"
              type="time"
              value={v('shiftStartTime')}
              onChange={(val) => set({ shiftStartTime: val })}
            />
            <TextField
              id="injury-supervisor"
              label="Supervisor"
              value={v('injurySupervisor')}
              onChange={(val) => set({ injurySupervisor: val })}
              placeholder="Supervisor name"
            />
            <TextField
              id="supervisor-notified-date"
              label="When was the supervisor notified?"
              type="datetime-local"
              value={v('supervisorNotifiedDate')}
              onChange={(val) => set({ supervisorNotifiedDate: val })}
            />
            <TextField
              id="ppi-rating-occ"
              label="Permanent Partial Impairment (PPI) %"
              value={v('ppiRating')}
              onChange={(val) =>
                set({ ppiRating: val.replace(/[^0-9.]/g, '') })
              }
              placeholder="0"
            />
          </div>
        </Section>

        {/* Work Related Details */}
        <Section
          title="Work Related Details"
          icon={<Briefcase className="h-4 w-4" aria-hidden="true" />}
          defaultOpen={workRelatedOpen}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <SelectField
              id="is-case-work-related"
              label="Is the case work related?"
              value={v('isCaseWorkRelated')}
              onChange={(val) => set({ isCaseWorkRelated: val })}
              options={[
                ...YES_NO,
                { value: 'Under investigation', label: 'Under investigation' },
              ]}
            />
            <TextField
              id="employee-occupation"
              label="Employee occupation"
              value={v('employeeOccupation')}
              onChange={(val) => set({ employeeOccupation: val })}
              placeholder="Enter occupation..."
            />
            <SelectField
              id="contingent-work"
              label="Contingent work"
              value={v('contingentWork')}
              onChange={(val) => set({ contingentWork: val })}
              options={YES_NO}
            />
            <SelectField
              id="type-of-injury-illness"
              label="Type of injury or illness"
              value={v('typeOfInjuryOrIllness')}
              onChange={(val) => set({ typeOfInjuryOrIllness: val })}
              options={[
                { value: 'Injury', label: 'Injury' },
                { value: 'Illness', label: 'Illness' },
                { value: 'Both', label: 'Both' },
              ]}
            />
            <SelectField
              id="significant-injury-illness"
              label="Significant injury/illness"
              value={v('significantInjuryIllness')}
              onChange={(val) => set({ significantInjuryIllness: val })}
              options={YES_NO}
            />
            <SelectField
              id="case-extent"
              label="Case extent"
              value={v('caseExtent')}
              onChange={(val) => set({ caseExtent: val })}
              options={['Minor', 'Moderate', 'Severe', 'Critical'].map((x) => ({
                value: x,
                label: x,
              }))}
            />
            <SelectField
              id="psm-incident"
              label="PSM incident"
              value={v('psmIncident')}
              onChange={(val) => set({ psmIncident: val })}
              options={YES_NO}
            />
            <SelectField
              id="sharps-case"
              label="Sharps case"
              value={v('sharpsCase')}
              onChange={(val) => set({ sharpsCase: val })}
              options={YES_NO}
            />
            <SelectField
              id="wc-claim"
              label="Workers' comp claim filed?"
              value={v('workersCompClaim')}
              onChange={(val) => set({ workersCompClaim: val })}
              options={[
                ...YES_NO,
                { value: 'Pending', label: 'Pending' },
                { value: 'N/A', label: 'N/A' },
              ]}
            />
            {v('workersCompClaim') === 'Yes' && (
              <>
                <TextField
                  id="wc-claim-number-related"
                  label="Workers' comp claim number"
                  value={v('workersCompClaimNumber')}
                  onChange={(val) => set({ workersCompClaimNumber: val })}
                  placeholder="Claim number"
                />
                <SelectField
                  id="claim-status-resolution"
                  label="Claim status and resolution"
                  value={v('claimStatusResolution')}
                  onChange={(val) => set({ claimStatusResolution: val })}
                  options={[
                    'Open',
                    'Under review',
                    'Approved',
                    'Denied',
                    'Settled',
                    'Closed',
                  ].map((x) => ({ value: x, label: x }))}
                />
              </>
            )}
            <SelectField
              id="osha-recordable"
              label="OSHA recordable?"
              value={v('oshaRecordable')}
              onChange={(val) => set({ oshaRecordable: val })}
              options={YES_NO}
            />
            {v('oshaRecordable') === 'Yes' && (
              <>
                <SelectField
                  id="osha-classification"
                  label="OSHA classification"
                  value={v('oshaClassification')}
                  onChange={(val) => set({ oshaClassification: val })}
                  options={[
                    'Death',
                    'Days away from work',
                    'Job transfer/restriction',
                    'Other recordable',
                  ].map((x) => ({ value: x, label: x }))}
                />
                <TextField
                  id="recordability-rationale"
                  label="Recordability rationale"
                  value={v('recordabilityRationale')}
                  onChange={(val) => set({ recordabilityRationale: val })}
                  placeholder="Enter rationale..."
                />
              </>
            )}
          </div>
        </Section>

        {/* Location Information */}
        <Section
          title="Location Information"
          icon={<MapPin className="h-4 w-4" aria-hidden="true" />}
          defaultOpen={locationOpen}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField
              id="incident-onsite-offsite"
              label="Where the incident happened"
              value={v('incidentOnsiteOffsite')}
              onChange={(val) => set({ incidentOnsiteOffsite: val })}
              options={[
                { value: 'Onsite', label: 'Onsite' },
                { value: 'Offsite', label: 'Offsite' },
              ]}
            />
            <TextField
              id="workstation"
              label="Workstation"
              value={v('workstation')}
              onChange={(val) => set({ workstation: val })}
              placeholder="Enter workstation"
            />
            <TextField
              id="location-description"
              label="Description of where event occurred"
              value={v('locationDescription')}
              onChange={(val) => set({ locationDescription: val })}
              placeholder="e.g., loading dock, north end"
            />
            <TextField
              id="location-address"
              label="Street address"
              value={v('locationAddress')}
              onChange={(val) => set({ locationAddress: val })}
              placeholder="Street address"
            />
            <TextField
              id="location-city"
              label="City"
              value={v('locationCity')}
              onChange={(val) => set({ locationCity: val })}
              placeholder="City"
            />
            <TextField
              id="location-state"
              label="State"
              value={v('locationState')}
              onChange={(val) => set({ locationState: val })}
              placeholder="State"
            />
            <TextField
              id="location-zip"
              label="Zip code"
              value={v('locationZip')}
              onChange={(val) => set({ locationZip: val })}
              placeholder="Zip"
            />
            <TextField
              id="location-country"
              label="Country"
              value={v('locationCountry')}
              onChange={(val) => set({ locationCountry: val })}
              placeholder="Country"
            />
            <TextField
              id="gps-coordinates"
              label="GPS coordinates"
              value={v('gpsCoordinates')}
              onChange={(val) => set({ gpsCoordinates: val })}
              placeholder="e.g., 40.7128, -74.0060"
            />
          </div>
        </Section>

        {/* Incident Description */}
        <Section
          title="Incident Description"
          icon={<FileText className="h-4 w-4" aria-hidden="true" />}
          defaultOpen={incidentOpen}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField
              id="accident-type"
              label="Accident type"
              value={v('accidentType')}
              onChange={(val) => set({ accidentType: val })}
              options={ACCIDENT_TYPE_OPTIONS}
            />
            <SelectField
              id="serious-injury-fatality"
              label="Serious injury and fatality (SIF)"
              value={v('seriousInjuryFatality')}
              onChange={(val) => set({ seriousInjuryFatality: val })}
              options={['Actual', 'Potential', 'None'].map((x) => ({
                value: x,
                label: x,
              }))}
            />
            <TextField
              id="jsa-reference"
              label="Safety risk assessment (JSA) reference"
              value={v('jsaReference')}
              onChange={(val) => set({ jsaReference: val })}
              placeholder="JSA reference number..."
            />
            <TextField
              id="object-substance-caused"
              label="What object or substance caused the injury"
              value={v('objectSubstanceCaused')}
              onChange={(val) => set({ objectSubstanceCaused: val })}
              placeholder="e.g., forklift, chemical, ladder"
            />
            <TextField
              id="how-injury-happened"
              label="How the injury happened"
              value={v('howInjuryHappened')}
              onChange={(val) => set({ howInjuryHappened: val })}
              placeholder="Describe how injury occurred..."
            />
            <TextField
              id="employee-doing-before"
              label="What the employee was doing before the incident"
              value={v('employeeDoingBefore')}
              onChange={(val) => set({ employeeDoingBefore: val })}
              placeholder="Describe activity before incident..."
            />
          </div>
        </Section>

        {/* Injury Details */}
        <Section
          title="Injury Details"
          icon={<Activity className="h-4 w-4" aria-hidden="true" />}
          defaultOpen={injuryDetailsOpen}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField
              id="injury-nature"
              label="Nature of injury"
              value={v('injuryNature')}
              onChange={(val) => set({ injuryNature: val })}
              options={INJURY_NATURE_OPTIONS}
            />
            <SelectField
              id="injury-cause"
              label="Cause of injury"
              value={v('injuryCause')}
              onChange={(val) => set({ injuryCause: val })}
              options={INJURY_CAUSE_OPTIONS}
            />
            <TextField
              id="body-part"
              label="Body part affected"
              value={v('bodyPartAffected')}
              onChange={(val) => set({ bodyPartAffected: val })}
              placeholder="e.g., Lower back, Right hand"
            />
            <TextField
              id="date-of-death"
              label="Date of death"
              type="date"
              value={v('dateOfDeath')}
              onChange={(val) => set({ dateOfDeath: val })}
            />
          </div>
          <TextareaField
            id="injury-description"
            label="Description of injury/illness"
            value={v('injuryDescription')}
            onChange={(val) => set({ injuryDescription: val })}
            placeholder="Describe how the injury occurred..."
          />
          <TextareaField
            id="what-employee-doing"
            label="What was the employee doing just before the incident occurred?"
            value={v('whatEmployeeDoing')}
            onChange={(val) => set({ whatEmployeeDoing: val })}
            placeholder="Describe the activity or task the employee was performing..."
          />
          <TextareaField
            id="what-happened"
            label="What happened?"
            value={v('whatHappened')}
            onChange={(val) => set({ whatHappened: val })}
            placeholder="Describe the sequence of events that led to the injury..."
          />
          <TextareaField
            id="what-object-harmed"
            label="What object or substance directly harmed the employee?"
            value={v('whatObjectHarmed')}
            onChange={(val) => set({ whatObjectHarmed: val })}
            placeholder="Identify the specific object, equipment, substance, or condition..."
          />
        </Section>

        {/* Treatment Information */}
        <Section
          title="Treatment Information"
          icon={<Stethoscope className="h-4 w-4" aria-hidden="true" />}
          defaultOpen={treatmentOpen}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectField
              id="medical-treatment-provided"
              label="Was medical treatment provided before reporting?"
              value={v('medicalTreatmentProvided')}
              onChange={(val) => set({ medicalTreatmentProvided: val })}
              options={YES_NO}
            />
            <SelectField
              id="where-treatment-provided"
              label="Where treatment was provided"
              value={v('whereTreatmentProvided')}
              onChange={(val) => set({ whereTreatmentProvided: val })}
              options={[
                'Onsite',
                'Hospital',
                'External provider',
                'Urgent care',
                'Self-treated',
              ].map((x) => ({ value: x, label: x }))}
            />
            <SelectField
              id="treated-emergency-room"
              label="Was employee treated in an emergency room?"
              value={v('treatedInEmergencyRoom')}
              onChange={(val) => set({ treatedInEmergencyRoom: val })}
              options={YES_NO}
            />
            <SelectField
              id="hospitalized-overnight"
              label="Was the employee hospitalized overnight?"
              value={v('hospitalizedOvernight')}
              onChange={(val) => set({ hospitalizedOvernight: val })}
              options={YES_NO}
            />
            <SelectField
              id="emergency-transportation"
              label="Was emergency transportation used?"
              value={v('emergencyTransportationUsed')}
              onChange={(val) => set({ emergencyTransportationUsed: val })}
              options={YES_NO}
            />
            <SelectField
              id="case-transferred-3rd-party"
              label="Was case transferred to 3rd Party Resource/Plant Nurse/Other?"
              value={v('caseTransferredTo3rdParty')}
              onChange={(val) => set({ caseTransferredTo3rdParty: val })}
              options={YES_NO}
            />
            <SelectField
              id="employee-requested-treatment"
              label="Did the employee request treatment or external evaluation?"
              value={v('employeeRequestedTreatment')}
              onChange={(val) => set({ employeeRequestedTreatment: val })}
              options={YES_NO}
            />
          </div>
          <CheckboxGroup
            label="First aid treatments provided"
            options={FIRST_AID_TREATMENTS}
            selected={value.firstAidTreatments ?? []}
            onChange={(next) => set({ firstAidTreatments: next })}
          />
          <CheckboxGroup
            label="Treatments beyond first aid"
            options={BEYOND_FIRST_AID}
            selected={value.treatmentsBeyondFirstAid ?? []}
            onChange={(next) => set({ treatmentsBeyondFirstAid: next })}
          />
          <TextareaField
            id="prescriptions-physical-therapy"
            label="Prescriptions issues & physical therapy prescribed"
            value={v('prescriptionsPhysicalTherapy')}
            onChange={(val) => set({ prescriptionsPhysicalTherapy: val })}
            placeholder="Enter prescription and physical therapy details..."
          />
          <TextareaField
            id="treatment-description"
            label="Description of treatment"
            value={v('treatmentDescription')}
            onChange={(val) => set({ treatmentDescription: val })}
            placeholder="Describe the treatment provided..."
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <TextField
              id="hospital-name"
              label="Hospital/Facility Name"
              value={v('hospitalName')}
              onChange={(val) => set({ hospitalName: val })}
              placeholder="Hospital or facility name"
            />
            <TextField
              id="hospital-address"
              label="Hospital/Facility Address"
              value={v('hospitalAddress')}
              onChange={(val) => set({ hospitalAddress: val })}
              placeholder="Address"
            />
            <TextField
              id="hospital-phone"
              label="Hospital/Facility Phone"
              value={v('hospitalPhone')}
              onChange={(val) => set({ hospitalPhone: val })}
              placeholder="Phone number"
            />
          </div>
          <TextField
            id="provider-information"
            label="Provider Information"
            value={v('providerInformation')}
            onChange={(val) => set({ providerInformation: val })}
            placeholder="Treating physician or provider details"
          />
        </Section>

        {/* Work Comp Details */}
        <Section
          title="Work Comp Details"
          icon={<Shield className="h-4 w-4" aria-hidden="true" />}
          defaultOpen={workCompOpen}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <TextField
              id="wc-claim-number"
              label="Claim Number"
              value={v('wcClaimNumber')}
              onChange={(val) => set({ wcClaimNumber: val })}
              placeholder="Enter claim number"
            />
            <TextField
              id="adjuster-contact"
              label="Adjuster/Examiner Contact Info"
              value={v('adjusterContact')}
              onChange={(val) => set({ adjusterContact: val })}
              placeholder="Contact information"
            />
            <TextField
              id="hs-program"
              label="H&S Program"
              value={v('hsProgram')}
              onChange={(val) => set({ hsProgram: val })}
              placeholder="Enter program..."
            />
            <TextField
              id="process-condition"
              label="Process condition"
              value={v('processCondition')}
              onChange={(val) => set({ processCondition: val })}
              placeholder="Enter process condition..."
            />
            <TextField
              id="days-away"
              label="Days Away"
              type="number"
              value={v('daysAway')}
              onChange={(val) => set({ daysAway: val })}
              placeholder="0"
            />
            <TextField
              id="days-restricted-wc"
              label="Days Restricted"
              type="number"
              value={v('daysRestricted')}
              onChange={(val) => set({ daysRestricted: val })}
              placeholder="0"
            />
            <SelectField
              id="record-only"
              label="Record only (not a full claim)?"
              value={v('recordOnly')}
              onChange={(val) => set({ recordOnly: val })}
              options={YES_NO}
            />
          </div>
          <TextareaField
            id="process-details"
            label="Process details"
            value={v('processDetails')}
            onChange={(val) => set({ processDetails: val })}
            placeholder="Enter process details..."
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField
              id="associated-ii-cases"
              label="Associated I&I Case(s)"
              value={v('associatedIICases')}
              onChange={(val) => set({ associatedIICases: val })}
              placeholder="Enter associated case(s)..."
            />
            <SelectField
              id="notify-case-management-tpa"
              label="Notify Case Management and TPA?"
              value={v('notifyCaseManagementTPA')}
              onChange={(val) => set({ notifyCaseManagementTPA: val })}
              options={YES_NO}
            />
          </div>
          <TextareaField
            id="investigation-details"
            label="Investigation Details"
            value={v('investigationDetails')}
            onChange={(val) => set({ investigationDetails: val })}
            placeholder="Enter investigation details..."
          />
        </Section>

        {/* Confidential warning */}
        <AlertDialog
          open={showConfidentialWarning}
          onOpenChange={setShowConfidentialWarning}
          title="Mark Case as Confidential?"
          variant="destructive"
          actionLabel="Confidential"
          onAction={() => set({ confidential: true })}
        >
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-destructive">
              Warning: You will lose access to this case!
            </p>
            <p>
              Marking this case as confidential will restrict access to
              administrators only. As a case manager, you will no longer be able
              to view or edit this case unless it is unmarked as confidential by
              an administrator.
            </p>
            <p>Are you sure you want to continue?</p>
          </div>
        </AlertDialog>

        {/* Close case review */}
        <Modal
          open={showCloseDialog}
          onOpenChange={setShowCloseDialog}
          size="4xl"
        >
          <ModalHeader>
            <ModalTitle>Close Case - Review Open Items</ModalTitle>
          </ModalHeader>
          <ModalBody className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Complete the closure details and review open items before closing
              the case. All open to-dos must be completed before the case can be
              closed.
            </p>

            <div className="space-y-2 rounded-md border border-border bg-muted/30 p-3">
              <h4 className="text-sm font-semibold">Closure Details</h4>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <TextField
                  id="close-date"
                  label="Date Closed *"
                  type="date"
                  value={closeDate}
                  onChange={setCloseDate}
                />
                <SelectField
                  id="close-reason"
                  label="Closure Reason *"
                  value={closeReason}
                  onChange={setCloseReason}
                  options={closureReasonOptions}
                  placeholder="Select reason..."
                />
                <TextField
                  id="close-actual-return"
                  label="Actual Return Date"
                  type="date"
                  value={closeActualReturn}
                  onChange={setCloseActualReturn}
                />
                <TextField
                  id="close-std-end"
                  label="STD End Date"
                  type="date"
                  value={closeStdEnd}
                  onChange={setCloseStdEnd}
                />
              </div>
            </div>

            {openAbsences.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">
                  Open Absences ({openAbsences.length})
                </h4>
                <div className="divide-y divide-border rounded-md border border-border">
                  {openAbsences.map((absence) => (
                    <div key={absence.id} className="space-y-2 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {absence.customOthName || absence.statusType}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Started: {absence.effectiveDate}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Label className="whitespace-nowrap text-xs">
                          Move to Status:
                        </Label>
                        <Select
                          aria-label={`Move absence to status: ${
                            absence.customOthName || absence.statusType
                          }`}
                          value={absenceUpdates[absence.id]?.status ?? ''}
                          onValueChange={(val) =>
                            setAbsenceUpdates((prev) => ({
                              ...prev,
                              [absence.id]: { ...prev[absence.id], status: val },
                            }))
                          }
                          placeholder="Select status..."
                          options={[
                            { value: 'FD', label: 'Full Duty' },
                            { value: 'LWD', label: 'Lost Work Days' },
                            { value: 'RWD', label: 'Restricted Work Days' },
                            { value: 'RWDREGULARJOB', label: 'RWD Regular Job' },
                            { value: 'OTH', label: 'Other' },
                          ]}
                        />
                        {absenceUpdates[absence.id]?.status === 'OTH' &&
                          absenceStatusOptions.length > 0 && (
                            <Select
                              aria-label={`Other absence status: ${absence.id}`}
                              value={absenceUpdates[absence.id]?.otherStatus ?? ''}
                              onValueChange={(val) =>
                                setAbsenceUpdates((prev) => ({
                                  ...prev,
                                  [absence.id]: {
                                    ...prev[absence.id],
                                    otherStatus: val,
                                  },
                                }))
                              }
                              placeholder="Select absence status *"
                              options={absenceStatusOptions}
                            />
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {openRestrictions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">
                  Active Restrictions ({openRestrictions.length})
                </h4>
                <div className="divide-y divide-border rounded-md border border-border">
                  {openRestrictions.map((restriction) => (
                    <div key={restriction.id} className="space-y-2 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {restriction.restriction}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Started: {restriction.startDate}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label className="whitespace-nowrap text-xs">
                            End Date:
                          </Label>
                          <Input
                            type="date"
                            aria-label={`End date for restriction: ${restriction.restriction}`}
                            value={restrictionUpdates[restriction.id]?.endDate ?? ''}
                            disabled={
                              restrictionUpdates[restriction.id]?.isPermanent
                            }
                            onChange={(e) =>
                              setRestrictionUpdates((prev) => ({
                                ...prev,
                                [restriction.id]: {
                                  ...prev[restriction.id],
                                  endDate: e.target.value,
                                  isPermanent: false,
                                },
                              }))
                            }
                          />
                        </div>
                        <Checkbox
                          label="Permanent"
                          checked={
                            restrictionUpdates[restriction.id]?.isPermanent ?? false
                          }
                          onChange={(e) =>
                            setRestrictionUpdates((prev) => ({
                              ...prev,
                              [restriction.id]: {
                                ...prev[restriction.id],
                                isPermanent: e.target.checked,
                                endDate: e.target.checked
                                  ? ''
                                  : prev[restriction.id]?.endDate,
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {openTodos.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    Open To-Dos ({openTodos.length})
                  </h4>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setTodosToClose(openTodos.map((t) => t.id))
                      }
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setTodosToClose([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="divide-y divide-border rounded-md border border-border">
                  {openTodos.map((todo) => (
                    <div key={todo.id} className="p-2">
                      <Checkbox
                        label={`${todo.activity}${
                          todo.dateScheduled ? ` (Due: ${todo.dateScheduled})` : ''
                        }`}
                        checked={todosToClose.includes(todo.id)}
                        onChange={(e) =>
                          setTodosToClose((prev) =>
                            e.target.checked
                              ? [...prev, todo.id]
                              : prev.filter((id) => id !== todo.id)
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {closeDisabled && (
              <Alert variant="danger">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  Complete the required closure details and resolve all open
                  to-dos and restrictions before closing.
                </AlertDescription>
              </Alert>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="outline" onClick={() => setShowCloseDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={closeDisabled}
              onClick={confirmCloseCase}
            >
              Close Case
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
);

interface CheckboxGroupProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

/** A labeled grid of checkboxes backed by a string-array value. */
function CheckboxGroup({ label, options, selected, onChange }: CheckboxGroupProps) {
  return (
    <div className="space-y-3">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <div className="grid grid-cols-1 gap-2 rounded-md border border-border bg-muted/20 p-4 md:grid-cols-2">
        {options.map((option) => (
          <Checkbox
            key={option}
            label={option}
            checked={selected.includes(option)}
            onChange={(e) =>
              onChange(
                e.target.checked
                  ? [...selected, option]
                  : selected.filter((t) => t !== option)
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
