import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichTextEditor, type RichTextVariableGroup } from './RichTextEditor';

const meta: Meta<typeof RichTextEditor> = {
  title: 'Components/Forms & Inputs/RichTextEditor',
  component: RichTextEditor,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const variableGroups: RichTextVariableGroup[] = [
  {
    label: 'Employee',
    variables: [
      { label: 'First Name', value: '{{employee.firstName}}' },
      { label: 'Last Name', value: '{{employee.lastName}}' },
      { label: 'Full Name', value: '{{employee.name}}' },
      { label: 'Email', value: '{{employee.email}}' },
    ],
  },
  {
    label: 'Case',
    variables: [
      { label: 'Case Number', value: '{{case.caseNumber}}' },
      { label: 'Case Status', value: '{{case.status}}' },
      {
        label: 'Case Adjuster',
        value: '{{case.adjuster}}',
        insertValue:
          '{{case.adjuster}}, {{case.adjusterPhone}}, {{case.adjusterEmail}}',
      },
    ],
  },
];

function BasicExample() {
  const [value, setValue] = useState('');
  return (
    <div className="max-w-2xl">
      <RichTextEditor
        value={value}
        onChange={setValue}
        placeholder="Start writing your note…"
        aria-label="Note body"
      />
    </div>
  );
}

export const Basic: Story = {
  render: () => <BasicExample />,
};

function WithVariablesExample() {
  const [value, setValue] = useState(
    '<p>Dear &lt;&lt;employee.name&gt;&gt;,</p>'
  );
  return (
    <div className="max-w-2xl">
      <RichTextEditor
        value={value}
        onChange={setValue}
        placeholder="Compose a letter…"
        variableGroups={variableGroups}
        aria-label="Letter body"
      />
    </div>
  );
}

export const WithVariables: Story = {
  render: () => <WithVariablesExample />,
};

export const Disabled: Story = {
  render: () => (
    <div className="max-w-2xl">
      <RichTextEditor
        value="<p>This content is read-only.</p>"
        onChange={() => {}}
        disabled
        aria-label="Read-only content"
      />
    </div>
  ),
};
