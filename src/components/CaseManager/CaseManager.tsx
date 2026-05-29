import { useState } from 'react';
import {
  AlertCircle,
  ArrowUp,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Alert, AlertDescription } from '../Alert';
import { Badge, type BadgeProps } from '../Badge';
import { Button } from '../Button';
import { FloatingWindow, MinimizedWindow } from '../FloatingWindow';
import { Input } from '../Input';
import { Label } from '../Label';
import {
  RichTextEditor,
  type RichTextVariableGroup,
} from '../RichTextEditor';
import { Select, type SelectOption } from '../Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../Tabs';

/** Summary fields shown in the collapsible case header. */
export interface CaseManagerSummary {
  employeeName?: string;
  caseNumber?: string;
  status?: string;
  caseTypeLabel?: string;
  caseManager?: string;
  dateOfDisability?: string;
  employeeNumber?: string;
  employeeClass?: string;
  dateOfBirth?: string;
  age?: string | number;
  gender?: string;
  address?: string;
  employeeLocation?: string;
  callCenter?: string;
  employmentType?: string;
  position?: string;
  originalHireDate?: string;
  entryDate?: string;
  adjustedServiceDate?: string;
  terminationDate?: string;
  cellPhone?: string;
  homePhone?: string;
  personalEmail?: string;
  unionDescription?: string;
  emergencyContact?: string;
  emergencyRelation?: string;
  emergencyWorkPhone?: string;
}

/** Current absence status displayed in the header. */
export interface CaseManagerAbsence {
  statusLabel: string;
  effectiveDate: string;
  reason?: string;
  tone?: BadgeProps['variant'];
}

/** An active restriction chip displayed in the header. */
export interface CaseManagerRestriction {
  id: string;
  label: string;
  isPermanent?: boolean;
  title?: string;
}

/** A tab with its rendered content. */
export interface CaseManagerTab {
  value: string;
  label: string;
  content: React.ReactNode;
}

/** A quick-note draft emitted on save. */
export interface QuickNoteDraft {
  noteDate: string;
  activity: string;
  notes: string;
}

export interface CaseManagerProps {
  /** Header summary fields. */
  summary: CaseManagerSummary;
  /** Tabs to render. */
  tabs: CaseManagerTab[];
  /** Controlled active tab value. */
  activeTab?: string;
  /** Initial active tab when uncontrolled. */
  defaultTab?: string;
  /** Called when the active tab changes. */
  onTabChange?: (tab: string) => void;
  /** Current absence status, if any. */
  currentAbsence?: CaseManagerAbsence | null;
  /** Active restriction chips. */
  activeRestrictions?: CaseManagerRestriction[];
  /** Activity options for the quick-note window. */
  activityOptions?: SelectOption[];
  /** Save a quick note. Enables the "Add Case Note" control when provided. */
  onSaveNote?: (note: QuickNoteDraft) => void;
  /** Pop the quick-note editor out to a new window. */
  onPopOutNote?: () => void;
  /** Variable groups for the quick-note rich text editor. */
  noteVariableGroups?: RichTextVariableGroup[];
  className?: string;
}

const DEFAULT_ACTIVITY_OPTIONS: SelectOption[] = [
  { value: 'Phone Call', label: 'Phone Call' },
  { value: 'Email', label: 'Email' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'Case Review', label: 'Case Review' },
  { value: 'Other', label: 'Other' },
];

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  const date = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  if (Number.isNaN(date.getTime())) return dateStr;
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
}

const today = () => new Date().toISOString().split('T')[0];

/**
 * Case manager shell: a collapsible employee/case header (with current absence
 * status and active restriction chips), a tab bar with caller-supplied tab
 * content, per-tab prev/next navigation, and a quick "Add Case Note" floating
 * window. Presentational — all data and side effects are supplied via props.
 */
export function CaseManager({
  summary,
  tabs,
  activeTab,
  defaultTab,
  onTabChange,
  currentAbsence,
  activeRestrictions = [],
  activityOptions = DEFAULT_ACTIVITY_OPTIONS,
  onSaveNote,
  onPopOutNote,
  noteVariableGroups,
  className,
}: CaseManagerProps) {
  const [internalTab, setInternalTab] = useState(
    defaultTab ?? tabs[0]?.value ?? ''
  );
  const currentTab = activeTab ?? internalTab;
  const setTab = (tab: string) => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isNoteMinimized, setIsNoteMinimized] = useState(false);
  const [noteDate, setNoteDate] = useState(today);
  const [activity, setActivity] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [validationError, setValidationError] = useState('');

  const currentIndex = tabs.findIndex((t) => t.value === currentTab);
  const prevTab = currentIndex > 0 ? tabs[currentIndex - 1] : null;
  const nextTab =
    currentIndex >= 0 && currentIndex < tabs.length - 1
      ? tabs[currentIndex + 1]
      : null;

  const openQuickNote = () => {
    setNoteDate(today());
    setActivity('');
    setNoteContent('');
    setValidationError('');
    setIsNoteOpen(true);
    setIsNoteMinimized(false);
  };

  const handleSaveNote = () => {
    const missing: string[] = [];
    if (!activity) missing.push('Activity');
    if (!noteContent) missing.push('Notes');
    if (missing.length > 0) {
      setValidationError(
        `Please fill in the required field${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`
      );
      return;
    }
    onSaveNote?.({ noteDate, activity, notes: noteContent });
    setValidationError('');
    setIsNoteOpen(false);
  };

  const detailFields: { label: string; value?: string; colSpan?: boolean }[] = [
    { label: 'Employee Number', value: summary.employeeNumber },
    { label: 'Employee Class', value: summary.employeeClass },
    { label: 'Date of Birth', value: formatDate(summary.dateOfBirth) },
    { label: 'Age', value: summary.age != null ? String(summary.age) : undefined },
    { label: 'Gender', value: summary.gender },
    { label: 'Address', value: summary.address, colSpan: true },
    { label: 'Location', value: summary.employeeLocation },
    { label: 'Call Center', value: summary.callCenter },
    { label: 'Hourly/Salaried', value: summary.employmentType },
    { label: 'Position', value: summary.position },
    { label: 'Original Hire Date', value: formatDate(summary.originalHireDate) },
    { label: 'Entry Date', value: formatDate(summary.entryDate) },
    { label: 'Adjusted Service Date', value: formatDate(summary.adjustedServiceDate) },
    { label: 'Termination Date', value: formatDate(summary.terminationDate) },
    { label: 'Cell Phone', value: summary.cellPhone },
    { label: 'Home Phone', value: summary.homePhone },
    { label: 'Personal Email', value: summary.personalEmail, colSpan: true },
    { label: 'Union Description', value: summary.unionDescription },
    { label: 'Emergency Contact', value: summary.emergencyContact },
    { label: 'Emergency Relation', value: summary.emergencyRelation },
    { label: 'Emergency Work Phone', value: summary.emergencyWorkPhone },
  ];

  const summaryFields: { label: string; value?: string; className?: string }[] = [
    { label: 'Employee', value: summary.employeeName, className: 'flex-1 min-w-[180px]' },
    { label: 'Case #', value: summary.caseNumber, className: 'w-[130px]' },
    { label: 'Status', value: summary.status, className: 'w-[100px] capitalize' },
    { label: 'Case type', value: summary.caseTypeLabel, className: 'w-[160px]' },
    {
      label: 'Case manager',
      value: summary.caseManager || 'Unassigned',
      className: 'w-[140px]',
    },
    {
      label: 'Date of Disability',
      value: formatDate(summary.dateOfDisability),
      className: 'w-[120px]',
    },
  ];

  return (
    <div className={cn('min-h-screen bg-muted/30', className)} data-slot="case-manager">
      <div className="container mx-auto max-w-[1400px]">
        <div className="mb-4 rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md">
          <div className="mb-3 flex flex-wrap items-center gap-3 border-b border-border pb-3">
            {summaryFields.map((field) => (
              <div key={field.label} className={field.className}>
                <div className="mb-1 text-xs text-muted-foreground">{field.label}</div>
                <div className="text-sm font-medium">{field.value || '—'}</div>
              </div>
            ))}

            {onSaveNote && (
              <Button
                size="sm"
                variant="outline"
                onClick={openQuickNote}
                className="h-8 gap-2"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Case Note
              </Button>
            )}

            <button
              type="button"
              onClick={() => setIsHeaderExpanded((v) => !v)}
              aria-expanded={isHeaderExpanded}
              aria-label={isHeaderExpanded ? 'Collapse details' : 'Expand details'}
              className="flex items-center"
            >
              <div
                className={cn(
                  'flex items-center justify-center rounded-full p-1 transition-colors',
                  isHeaderExpanded && 'bg-primary/10'
                )}
              >
                <ChevronDown
                  className={cn(
                    'h-5 w-5 transition-all duration-200',
                    isHeaderExpanded
                      ? 'rotate-180 text-primary'
                      : 'text-muted-foreground'
                  )}
                  aria-hidden="true"
                />
              </div>
            </button>
          </div>

          {isHeaderExpanded && (
            <div className="grid origin-top grid-cols-2 gap-x-4 gap-y-3 text-xs md:grid-cols-4 lg:grid-cols-5">
              {detailFields.map((field) => (
                <div key={field.label} className={field.colSpan ? 'col-span-2' : undefined}>
                  <div className="mb-0.5 text-muted-foreground">{field.label}</div>
                  <div className="font-medium">{field.value || '—'}</div>
                </div>
              ))}

              <div className="col-span-full mt-2 border-t border-border pt-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="font-medium">Current Absence Status</span>
                    </div>
                    {currentAbsence ? (
                      <div className="rounded-md bg-muted/50 p-2">
                        <div className="flex items-center justify-between">
                          <Badge variant={currentAbsence.tone || 'secondary'}>
                            {currentAbsence.statusLabel}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Since {currentAbsence.effectiveDate}
                          </span>
                        </div>
                        {currentAbsence.reason && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            Reason: {currentAbsence.reason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm italic text-muted-foreground">
                        No absence records
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-muted-foreground">
                      <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="font-medium">
                        Active Restrictions ({activeRestrictions.length})
                      </span>
                    </div>
                    {activeRestrictions.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {activeRestrictions.slice(0, 5).map((r) => (
                          <Badge key={r.id} variant="warning" title={r.title}>
                            {r.label}
                            {r.isPermanent && <span className="ml-1">(P)</span>}
                          </Badge>
                        ))}
                        {activeRestrictions.length > 5 && (
                          <Badge variant="secondary">
                            +{activeRestrictions.length - 5} more
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm italic text-muted-foreground">
                        No active restrictions
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <Tabs value={currentTab} onValueChange={setTab} className="w-full">
          <div className="sticky top-14 z-40 bg-background shadow-sm sm:top-16">
            <TabsList className="h-auto w-full flex-wrap justify-start rounded-none border-b border-border bg-background p-0">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-b-none rounded-t-lg px-4 py-2.5 font-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="mt-0 rounded-lg rounded-tl-none border border-border bg-card p-6 shadow-sm">
            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="m-0">
                {tab.content}
                <div className="mt-6 flex items-center justify-between border-t border-border pt-6">
                  <div>
                    {prevTab && (
                      <Button variant="outline" size="sm" onClick={() => setTab(prevTab.value)}>
                        <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
                        {prevTab.label}
                      </Button>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  >
                    <ArrowUp className="mr-1 h-4 w-4" aria-hidden="true" />
                    Back to Top
                  </Button>
                  <div>
                    {nextTab && (
                      <Button variant="outline" size="sm" onClick={() => setTab(nextTab.value)}>
                        {nextTab.label}
                        <ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                </div>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      <FloatingWindow
        open={isNoteOpen}
        minimized={isNoteMinimized}
        title="Create Note"
        onClose={() => setIsNoteOpen(false)}
        onMinimize={() => setIsNoteMinimized(true)}
        onPopOut={onPopOutNote}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsNoteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote}>Save Note</Button>
          </div>
        }
      >
        <div className="space-y-4 p-6">
          {validationError && (
            <Alert variant="danger">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="quick-note-date" className="text-xs">
                Note Date
              </Label>
              <Input
                id="quick-note-date"
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quick-activity" className="text-xs">
                Activity <span className="text-destructive">*</span>
              </Label>
              <Select
                aria-label="Activity"
                value={activity}
                onValueChange={(value) => {
                  setActivity(value);
                  if (validationError) setValidationError('');
                }}
                options={activityOptions}
                placeholder="Select activity..."
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Case Manager</Label>
              <div className="flex h-8 items-center rounded-md bg-muted/50 px-3 py-1.5 text-sm">
                {summary.caseManager || 'Auto-assigned'}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">
              Notes <span className="text-destructive">*</span>
            </Label>
            <RichTextEditor
              value={noteContent}
              onChange={(value) => {
                setNoteContent(value);
                if (validationError) setValidationError('');
              }}
              placeholder="Type your case notes here..."
              variableGroups={noteVariableGroups}
            />
          </div>
        </div>
      </FloatingWindow>

      {isNoteMinimized && (
        <div className="fixed bottom-4 left-4 z-40">
          <MinimizedWindow
            title="Create Note"
            onRestore={() => setIsNoteMinimized(false)}
            onClose={() => {
              setIsNoteMinimized(false);
              setIsNoteOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
