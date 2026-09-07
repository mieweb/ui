import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import {
  CSVColumnMapper,
  CSVFileUpload,
  type CSVColumn,
} from './CSVColumnMapper';

const meta: Meta<typeof CSVColumnMapper> = {
  id: 'composite-forms-csvcolumnmapper',
  title: 'Inputs/Composite forms/CSVColumnMapper',
  component: CSVColumnMapper,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    docs: {
      description: {
        component: `### What it's for

The **column-mapping step of a CSV import**. You parse the file; it shows one card per \`columns[i]\` (\`CSVColumn = { name, sampleValue?, mappedTo?, childField?, ignored?, hasError? }\`) with the sample value, a \`Select\` of your \`fieldOptions\` (\`FieldOption = { value, label, disabled?, hasChildren? }\`), an optional sub-field \`Select\` from \`childFieldOptions[mappedTo]\` (e.g. phone → mobile/home) and an Ignore/Include toggle. Everything is controlled and event-driven: \`onColumnChange(columnIndex, mappedTo, childField?)\`, \`onIgnoreToggle(columnIndex, ignored)\`, \`onBulkAction('ignoreAll' | 'includeAll' | 'ignoreUncompleted')\`, \`onImport()\`; \`importing\` + \`importProgress\` (0–100) overlay a progress panel; \`labels\` overrides the bulk buttons, import button, banner and instructions. The companion **\`CSVFileUpload\`** is a drag-and-drop / click-to-browse zone (\`onFileSelect(file)\`, \`accept\` default \`.csv\`, \`processing\`). Exports: \`CSVColumnMapper\`, \`CSVFileUpload\`, types \`CSVColumnMapperProps\`, \`CSVColumn\`, \`FieldOption\`, \`CSVFileUploadProps\`.

### Use it when

- Users upload a spreadsheet of records (employees, patients, providers) whose headers must be **matched to your schema** before import.
- You need a visual "which columns still need mapping" overview with bulk ignore/include.

### Don't use it when

- Columns are already known and fixed — skip the step and import directly.
- You need the parsing, validation or de-duplication itself — this component does none of it; pair it with a CSV parser (e.g. \`papaparse\`) and your own validation.
- The user is adding arbitrary extra attributes rather than mapping to known fields — \`AdditionalFields\`.
- You need a generic file drop area for many file types — \`CSVFileUpload\` filters dropped files to \`.csv\` by name; use the Files family components instead.

### Example

\`\`\`tsx
const [columns, setColumns] = useState<CSVColumn[]>([]);   // from Papa.parse(file, { header: true })
const [progress, setProgress] = useState(0);
const [importing, setImporting] = useState(false);

const used = new Set(columns.filter((c) => !c.ignored).map((c) => c.mappedTo));
const fieldOptions = EMPLOYEE_FIELDS.map((f) => ({ ...f, disabled: used.has(f.value) }));

<CSVColumnMapper
  columns={columns}
  fieldOptions={fieldOptions}
  childFieldOptions={{ phone: [{ value: 'mobile', label: 'Mobile' }, { value: 'work', label: 'Work' }] }}
  onColumnChange={(i, mappedTo, childField) =>
    setColumns((cols) => cols.map((c, idx) => (idx === i ? { ...c, mappedTo, childField } : c)))}
  onIgnoreToggle={(i, ignored) => setColumns((cols) => cols.map((c, idx) => (idx === i ? { ...c, ignored } : c)))}
  onBulkAction={(action) => setColumns((cols) => applyBulk(cols, action))}
  onImport={async () => { setImporting(true); await importRows(columns, setProgress); setImporting(false); }}
  importing={importing}
  importProgress={progress}
/>
\`\`\`

### Limitations

- Accessibility: each card's field \`Select\` has a hidden label \`"Map {column} to field"\` and the sub-field one \`"{column} sub-field"\` (English, built from the column name), so the combobox is announced per column. "Sample Data" / "Map to Field" / "Sub-field" captions are \`<span>\`s, not labels. The mapped/unmapped status icon is decorative (\`aria-hidden\`) — **status is conveyed by colour and icon only**, with no text alternative. The progress overlay is a plain \`<div>\` (no \`role="dialog"\`, \`aria-modal\`, focus trap or \`role="progressbar"\`), and it does not block keyboard focus behind it. \`CSVFileUpload\`'s drop zone is a non-focusable \`<div>\` with a hard-coded \`id="csv-file-upload"\` on the hidden input (two instances collide) and no keyboard drop alternative beyond the browse button.
- Nothing is parsed, validated or imported here; the component cannot know required fields — set \`hasError\` yourself (unmapped, non-ignored columns are highlighted automatically). \`disabled\` on a \`FieldOption\` is your job (e.g. already-mapped fields).
- Cards are keyed by \`column.name\` — duplicate CSV headers will collide.
- i18n: bulk buttons, import button, banner ("Ensure Accurate Employee Data …") and instructions come from \`labels\`; "Sample Data", "Map to Field", "Sub-field", "Empty", "Ignore Column" / "Include Column", "Processing Employees", "% complete", "Select a field...", "Select sub-field..." and \`CSVFileUpload\`'s "Processing file..." are hard-coded English. The defaults are employer/employee-flavoured.
- Layout: responsive grid 1 → 2 (\`sm\`) → 3 (\`lg\`) → 4 (\`xl\`) columns; no physical \`left/right\` offsets. Theming: semantic tokens (\`bg-card\`, \`border-border\`, \`bg-muted\`, \`success-*\`, \`warning-*\`, \`bg-primary-800\`) except \`CSVFileUpload\`'s \`neutral-*\` text and its Font Awesome \`<i class="fas fa-file-csv">\` icon, which renders nothing unless Font Awesome is loaded. Depends on \`Button\` and \`Select\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'uses',
          target: 'choice-inputs-select',
          why: 'Each column card maps to a field (and optional sub-field) through Select with a hidden per-column label.',
        },
        {
          type: 'alternative to',
          target: 'composite-forms-additionalfields',
          why: 'CSVColumnMapper matches incoming columns to fields you already defined; AdditionalFields lets the user invent loose key/value pairs.',
        },
      ],
    },
  },
  args: {
    importing: false,
    importProgress: 0,
  },
  argTypes: {
    // Hide data props that are managed by interactive wrappers
    columns: { table: { disable: true } },
    fieldOptions: { table: { disable: true } },
    childFieldOptions: { table: { disable: true } },
    // Hide callback props
    onColumnChange: { table: { disable: true } },
    onIgnoreToggle: { table: { disable: true } },
    onBulkAction: { table: { disable: true } },
    onImport: { table: { disable: true } },
    // Hide className and labels (complex object)
    className: { table: { disable: true } },
    labels: { table: { disable: true } },
    // Configure visible controls
    importing: {
      control: 'boolean',
      description: 'Whether import is in progress',
    },
    importProgress: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Import progress (0-100)',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CSVColumnMapper>;

const sampleColumns: CSVColumn[] = [
  { name: 'First Name', sampleValue: 'John', mappedTo: 'firstName' },
  { name: 'Last Name', sampleValue: 'Doe', mappedTo: 'lastName' },
  {
    name: 'Email Address',
    sampleValue: 'john.doe@example.com',
    mappedTo: 'email',
  },
  { name: 'Phone', sampleValue: '555-123-4567' },
  { name: 'Street', sampleValue: '123 Main St' },
  { name: 'City', sampleValue: 'Anytown' },
  { name: 'State', sampleValue: 'IN' },
  { name: 'Zip', sampleValue: '46032' },
  { name: 'DOB', sampleValue: '1985-03-15' },
  { name: 'Department', sampleValue: 'Engineering' },
  { name: 'Title', sampleValue: 'Software Developer' },
  { name: 'Notes', sampleValue: 'Some notes here', ignored: true },
];

const fieldOptions = [
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone', hasChildren: true },
  { value: 'address.street1', label: 'Street Address 1' },
  { value: 'address.street2', label: 'Street Address 2' },
  { value: 'address.city', label: 'City' },
  { value: 'address.state', label: 'State' },
  { value: 'address.postalCode', label: 'Postal Code' },
  { value: 'dob', label: 'Date of Birth' },
  { value: 'department', label: 'Department' },
  { value: 'title', label: 'Job Title' },
  { value: 'ssn', label: 'SSN', disabled: true },
];

const childFieldOptions = {
  phone: [
    { value: 'mobile', label: 'Mobile' },
    { value: 'home', label: 'Home' },
    { value: 'work', label: 'Work' },
  ],
};

// Wrapper for Default story with interactive state
function CSVColumnMapperWrapper({
  importing,
  importProgress,
}: {
  importing?: boolean;
  importProgress?: number;
}) {
  const [columns, setColumns] = useState(sampleColumns);

  const handleColumnChange = (
    index: number,
    mappedTo: string,
    childField?: string
  ) => {
    setColumns((prev) =>
      prev.map((col, i) =>
        i === index ? { ...col, mappedTo, childField } : col
      )
    );
  };

  const handleIgnoreToggle = (index: number, ignored: boolean) => {
    setColumns((prev) =>
      prev.map((col, i) => (i === index ? { ...col, ignored } : col))
    );
  };

  const handleBulkAction = (
    action: 'ignoreAll' | 'includeAll' | 'ignoreUncompleted'
  ) => {
    setColumns((prev) =>
      prev.map((col) => {
        if (action === 'ignoreAll') return { ...col, ignored: true };
        if (action === 'includeAll') return { ...col, ignored: false };
        if (action === 'ignoreUncompleted' && !col.mappedTo)
          return { ...col, ignored: true };
        return col;
      })
    );
  };

  return (
    <CSVColumnMapper
      columns={columns}
      fieldOptions={fieldOptions}
      childFieldOptions={childFieldOptions}
      onColumnChange={handleColumnChange}
      onIgnoreToggle={handleIgnoreToggle}
      onBulkAction={handleBulkAction}
      onImport={() => window.alert('Import triggered!')}
      importing={importing}
      importProgress={importProgress}
    />
  );
}

// Wrapper for FileUpload story
function FileUploadWrapper() {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="space-y-4">
      <CSVFileUpload
        onFileSelect={(f) => {
          setFile(f);
          window.alert(`Selected: ${f.name}`);
        }}
      />
      {file && (
        <p className="text-muted-foreground text-center">
          Selected file: {file.name}
        </p>
      )}
    </div>
  );
}

export const Default: Story = {
  render: (args) => (
    <CSVColumnMapperWrapper
      importing={args.importing}
      importProgress={args.importProgress}
    />
  ),
};

export const WithPhoneMapping: Story = {
  args: {
    columns: [
      {
        name: 'Mobile Phone',
        sampleValue: '555-123-4567',
        mappedTo: 'phone',
        childField: 'mobile',
      },
      {
        name: 'Work Phone',
        sampleValue: '555-987-6543',
        mappedTo: 'phone',
        childField: 'work',
      },
    ],
    fieldOptions,
    childFieldOptions,
  },
};

export const WithErrors: Story = {
  args: {
    columns: [
      { name: 'First Name', sampleValue: 'John', mappedTo: 'firstName' },
      { name: 'Unknown Column', sampleValue: 'abc123', hasError: true },
      { name: 'Another Unknown', sampleValue: 'xyz789', hasError: true },
    ],
    fieldOptions,
  },
};

export const Importing: Story = {
  args: {
    columns: sampleColumns,
    fieldOptions,
    importing: true,
    importProgress: 45,
  },
};

export const AllIgnored: Story = {
  args: {
    columns: sampleColumns.map((col) => ({ ...col, ignored: true })),
    fieldOptions,
  },
};

export const FileUpload: StoryObj<typeof CSVFileUpload> = {
  render: () => <FileUploadWrapper />,
};

export const FileUploadProcessing: StoryObj<typeof CSVFileUpload> = {
  render: () => <CSVFileUpload processing />,
};

export const Mobile: Story = {
  args: {
    columns: sampleColumns.slice(0, 4),
    fieldOptions,
  },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
};

export const CustomLabels: Story = {
  args: {
    columns: sampleColumns.slice(0, 4),
    fieldOptions,
    labels: {
      ignoreAll: 'Skip All Columns',
      includeAll: 'Map All Columns',
      ignoreUncompleted: 'Skip Unmapped',
      import: 'Start Import',
      ensureAccurateData: 'Data Validation',
      ensureAccurateDataDescription:
        'Matching records will be updated automatically.',
      instructions: 'Match your CSV columns to employee fields below.',
    },
  },
};
