import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { RichEditor } from './RichEditor';
import { CodeEditor } from './CodeEditor';

const meta: Meta<typeof RichEditor> = {
  title: 'Components/Forms & Inputs/RichEditor',
  component: RichEditor,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

function BasicExample() {
  const [value, setValue] = useState('');
  return (
    <div className="max-w-2xl">
      <RichEditor value={value} onChange={setValue} showPreview />
    </div>
  );
}

export const Basic: Story = {
  render: () => <BasicExample />,
};

function CodeExample() {
  const [value, setValue] = useState('');
  return (
    <div className="max-w-2xl">
      <CodeEditor value={value} lang="javascript" onChange={setValue} />
    </div>
  );
}

export const Code: Story = {
  render: () => <CodeExample />,
};
