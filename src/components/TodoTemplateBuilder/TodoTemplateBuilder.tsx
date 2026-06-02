import * as React from 'react';
import { HelpCircle, Copy, Check } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../Button';
import { Input } from '../Input';
import { Label } from '../Label';
import { Select } from '../Select';
import { Checkbox } from '../Checkbox';
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalFooter,
} from '../Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../Tabs';
import {
  buildTodoTemplate,
  type TodoTemplateConfig,
} from './buildTodoTemplate';

/** A selectable option for the document type and anchor dropdowns. */
export interface TodoTemplateOption {
  value: string;
  label: string;
}

export interface TodoTemplateBuilderProps {
  /** Whether the builder modal is open. */
  open: boolean;
  /** Called when the open state should change. */
  onOpenChange: (open: boolean) => void;
  /** Called with the serialized template string when the user inserts it. */
  onInsert: (template: string) => void;
  /**
   * Document type options offered in the dropdown. A "None" option is always
   * prepended. Defaults to an empty list.
   */
  documentTypes?: TodoTemplateOption[];
  /**
   * Anchor date options. Defaults to case creation, surgery date, and
   * delivery date.
   */
  anchorOptions?: TodoTemplateOption[];
  /** Additional class for the modal content. */
  className?: string;
}

const DEFAULT_ANCHORS: TodoTemplateOption[] = [
  { value: 'caseCreation', label: 'Case Creation (default)' },
  { value: 'surgeryDate', label: 'Surgery Date' },
  { value: 'deliveryDate', label: 'Delivery Date' },
];

const OFFSET_UNITS: TodoTemplateOption[] = [
  { value: 'Day', label: 'Day(s)' },
  { value: 'Week', label: 'Week(s)' },
  { value: 'Month', label: 'Month(s)' },
];

const FREQUENCIES: TodoTemplateOption[] = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

const INITIAL_CONFIG: Required<Omit<TodoTemplateConfig, 'title'>> & {
  title: string;
} = {
  title: '',
  offsetValue: '1',
  offsetUnit: 'Week',
  anchor: 'caseCreation',
  documentType: 'none',
  hasRecurrence: false,
  rruleFreq: 'WEEKLY',
  rruleInterval: '1',
  rruleCount: '',
};

/**
 * A modal form that guides the user through composing a todo template line
 * (title, offset, anchor, document type, and recurrence rule) and emits the
 * serialized string via {@link TodoTemplateBuilderProps.onInsert}. The builder
 * is fully controlled; render your own trigger that toggles `open`.
 */
function TodoTemplateBuilder({
  open,
  onOpenChange,
  onInsert,
  documentTypes = [],
  anchorOptions = DEFAULT_ANCHORS,
  className,
}: TodoTemplateBuilderProps) {
  const [config, setConfig] = React.useState(INITIAL_CONFIG);
  const [copied, setCopied] = React.useState(false);

  const template = buildTodoTemplate(config);

  const update = <K extends keyof typeof INITIAL_CONFIG>(
    key: K,
    value: (typeof INITIAL_CONFIG)[K]
  ) => setConfig((prev) => ({ ...prev, [key]: value }));

  const handleInsert = () => {
    onInsert(template);
    onOpenChange(false);
    setConfig(INITIAL_CONFIG);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const documentTypeOptions: TodoTemplateOption[] = [
    { value: 'none', label: 'None' },
    ...documentTypes,
  ];

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="2xl"
      className={className}
    >
      <ModalHeader>
        <ModalTitle>Todo Template Builder</ModalTitle>
        <p className="text-muted-foreground text-sm">
          Build a todo template with offsets, anchors, and recurrence rules
        </p>
      </ModalHeader>
      <ModalBody className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="todo-template-title">Todo Title *</Label>
          <Input
            id="todo-template-title"
            placeholder="e.g., Monthly Reassessment"
            value={config.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Document Type (optional)</Label>
          <Select
            options={documentTypeOptions}
            value={config.documentType}
            onValueChange={(value) => update('documentType', value)}
            placeholder="None - no document required"
            aria-label="Document type"
          />
          <p className="text-muted-foreground text-xs">
            If selected, completing this todo will require uploading a document
            or creating a letter of this type
          </p>
        </div>

        <div className="space-y-2">
          <Label>Offset (when should this todo be due?)</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="Value"
              aria-label="Offset value"
              value={config.offsetValue}
              onChange={(e) => update('offsetValue', e.target.value)}
            />
            <Select
              options={OFFSET_UNITS}
              value={config.offsetUnit}
              onValueChange={(value) => update('offsetUnit', value)}
              aria-label="Offset unit"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Anchor Date (calculate offset from...)</Label>
          <Select
            options={anchorOptions}
            value={config.anchor}
            onValueChange={(value) => update('anchor', value)}
            placeholder="Select anchor date..."
            aria-label="Anchor date"
          />
          <p className="text-muted-foreground text-xs">
            Leave as case creation to use the case creation date
          </p>
        </div>

        <div className="space-y-3">
          <Checkbox
            label="This todo repeats (recurrence rule)"
            checked={config.hasRecurrence}
            onChange={(e) => update('hasRecurrence', e.target.checked)}
          />

          {config.hasRecurrence && (
            <div className="border-border space-y-3 border-l-2 pl-6">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  options={FREQUENCIES}
                  value={config.rruleFreq}
                  onValueChange={(value) => update('rruleFreq', value)}
                  aria-label="Recurrence frequency"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="todo-template-interval">
                  Interval (repeat every X {config.rruleFreq.toLowerCase()})
                </Label>
                <Input
                  id="todo-template-interval"
                  type="number"
                  placeholder="1"
                  value={config.rruleInterval}
                  onChange={(e) => update('rruleInterval', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="todo-template-count">
                  Count (how many times?) - Optional
                </Label>
                <Input
                  id="todo-template-count"
                  type="number"
                  placeholder="Leave blank for infinite"
                  value={config.rruleCount}
                  onChange={(e) => update('rruleCount', e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Template Preview</Label>
          <div className="relative">
            <pre className="bg-muted overflow-x-auto rounded-md p-3 text-sm">
              {template}
            </pre>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={handleCopy}
              aria-label="Copy template to clipboard"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleInsert} disabled={!config.title.trim()}>
          Insert Template
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export interface TodoTemplateHelpProps {
  /** Whether the help modal is open. */
  open: boolean;
  /** Called when the open state should change. */
  onOpenChange: (open: boolean) => void;
  /** Additional class for the modal content. */
  className?: string;
}

function Example({ code, description }: { code: string; description: string }) {
  return (
    <div className="border-primary-500 border-l-4 pl-3">
      <code className="text-sm">{code}</code>
      <p className="text-muted-foreground mt-1 text-xs">{description}</p>
    </div>
  );
}

/**
 * A reference modal documenting the todo template syntax (basics, offset,
 * anchor, and recurrence rules). Fully controlled via `open`/`onOpenChange`.
 */
function TodoTemplateHelp({
  open,
  onOpenChange,
  className,
}: TodoTemplateHelpProps) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="3xl"
      className={cn('max-h-[90vh] overflow-y-auto', className)}
    >
      <ModalHeader>
        <ModalTitle>Todo Template Format Guide</ModalTitle>
        <p className="text-muted-foreground text-sm">
          Learn how to write todo templates with offsets, anchors, and
          recurrence rules
        </p>
      </ModalHeader>
      <ModalBody>
        <Tabs defaultValue="basics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basics">Basics</TabsTrigger>
            <TabsTrigger value="offset">Offset</TabsTrigger>
            <TabsTrigger value="anchor">Anchor</TabsTrigger>
            <TabsTrigger value="rrule">Recurrence</TabsTrigger>
          </TabsList>

          <TabsContent value="basics" className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Basic Format</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Todo templates are written one per line with the following
                format:
              </p>
              <pre className="bg-muted rounded-md p-3 text-sm">
                &quot;Todo Title&quot;; offset=VALUE UNIT; anchor=DATE;
                rrule=RULE
              </pre>
            </div>
            <div className="space-y-2">
              <h3 className="mb-2 font-semibold">Examples</h3>
              <Example
                code={'"Initial Assessment"; offset=1 Week'}
                description="Simple todo due 1 week after case creation"
              />
              <Example
                code={'"Post-Surgery Check"; offset=2 Week; anchor=surgeryDate'}
                description="Todo due 2 weeks after surgery date"
              />
              <Example
                code={
                  '"Monthly Update"; offset=1 Month; rrule=FREQ=MONTHLY;INTERVAL=1;COUNT=6'
                }
                description="Repeating todo every month, 6 times total"
              />
            </div>
          </TabsContent>

          <TabsContent value="offset" className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Offset Parameter</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                The offset determines when the todo is due, calculated from the
                anchor date.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Syntax</h4>
              <pre className="bg-muted mb-2 rounded-md p-3 text-sm">
                offset=VALUE UNIT
              </pre>
              <p className="text-muted-foreground text-sm">
                VALUE: A positive number (e.g., 1, 7, 30)
                <br />
                UNIT: Day, Week, or Month
              </p>
            </div>
          </TabsContent>

          <TabsContent value="anchor" className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Anchor Parameter</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                The anchor is the starting date from which the offset is
                calculated.
              </p>
            </div>
            <div className="space-y-2">
              <div className="border-border rounded border p-3">
                <code className="text-sm font-semibold">caseCreation</code>{' '}
                (default)
                <p className="text-muted-foreground mt-1 text-xs">
                  The date the case was created. Used when no anchor is
                  specified.
                </p>
              </div>
              <div className="border-border rounded border p-3">
                <code className="text-sm font-semibold">surgeryDate</code>
                <p className="text-muted-foreground mt-1 text-xs">
                  A specific surgery date. Useful for post-operative follow-ups.
                </p>
              </div>
              <div className="border-border rounded border p-3">
                <code className="text-sm font-semibold">deliveryDate</code>
                <p className="text-muted-foreground mt-1 text-xs">
                  A specific delivery date for maternity cases. Used for
                  postpartum follow-ups.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rrule" className="space-y-4">
            <div>
              <h3 className="mb-2 font-semibold">Recurrence Rules (RRULE)</h3>
              <p className="text-muted-foreground mb-3 text-sm">
                Recurrence rules create repeating todos based on the iCalendar
                RRULE standard.
              </p>
            </div>
            <div>
              <h4 className="mb-2 font-medium">Basic Syntax</h4>
              <pre className="bg-muted mb-2 rounded-md p-3 text-sm">
                rrule=FREQ=frequency;INTERVAL=n;COUNT=total
              </pre>
            </div>
            <div className="space-y-2">
              <Example
                code={
                  '"Weekly Check"; offset=1 Week; rrule=FREQ=WEEKLY;INTERVAL=1'
                }
                description="Every week starting 1 week after case creation"
              />
              <Example
                code={
                  '"Biweekly Update"; offset=0 Week; rrule=FREQ=WEEKLY;INTERVAL=2;COUNT=12'
                }
                description="Every 2 weeks, 12 times total"
              />
              <Example
                code={
                  '"Quarterly Report"; offset=3 Month; rrule=FREQ=MONTHLY;INTERVAL=3'
                }
                description="Every 3 months indefinitely, starting 3 months after case creation"
              />
            </div>
          </TabsContent>
        </Tabs>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          <HelpCircle className="mr-2 h-4 w-4" />
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}

export { TodoTemplateBuilder, TodoTemplateHelp };
