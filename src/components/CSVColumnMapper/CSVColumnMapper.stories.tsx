import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { CSVColumnMapper, CSVFileUpload, type CSVColumn } from './CSVColumnMapper';

const meta: Meta<typeof CSVColumnMapper> = {
  title: 'Components/CSVColumnMapper',
  component: CSVColumnMapper,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CSVColumnMapper>;

const sampleColumns: CSVColumn[] = [
  { name: 'First Name', sampleValue: 'John', mappedTo: 'firstName' },
  { name: 'Last Name', sampleValue: 'Doe', mappedTo: 'lastName' },
  { name: 'Email Address', sampleValue: 'john.doe@example.com', mappedTo: 'email' },
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

export const Default: Story = {
  render: () => {
    const [columns, setColumns] = useState(sampleColumns);

    const handleColumnChange = (index: number, mappedTo: string, childField?: string) => {
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

    const handleBulkAction = (action: 'ignoreAll' | 'includeAll' | 'ignoreUncompleted') => {
      setColumns((prev) =>
        prev.map((col) => {
          if (action === 'ignoreAll') return { ...col, ignored: true };
          if (action === 'includeAll') return { ...col, ignored: false };
          if (action === 'ignoreUncompleted' && !col.mappedTo) return { ...col, ignored: true };
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
        onImport={() => alert('Import triggered!')}
      />
    );
  },
};

export const WithPhoneMapping: Story = {
  args: {
    columns: [
      { name: 'Mobile Phone', sampleValue: '555-123-4567', mappedTo: 'phone', childField: 'mobile' },
      { name: 'Work Phone', sampleValue: '555-987-6543', mappedTo: 'phone', childField: 'work' },
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
  render: () => {
    const [file, setFile] = useState<File | null>(null);

    return (
      <div className="space-y-4">
        <CSVFileUpload
          onFileSelect={(f) => {
            setFile(f);
            alert(`Selected: ${f.name}`);
          }}
        />
        {file && (
          <p className="text-center text-muted-foreground">
            Selected file: {file.name}
          </p>
        )}
      </div>
    );
  },
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
      ignore: 'Skip',
      include: 'Map',
      incomingSample: 'Sample Data',
      fieldType: 'Map To',
      ensureAccurateData: 'Data Validation',
      ensureAccurateDataDescription: 'Matching records will be updated automatically.',
      instructions: 'Match your CSV columns to employee fields below.',
    },
  },
};
