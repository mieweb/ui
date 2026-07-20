import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ComposerModelSelector,
  type ProviderModelOption,
  type ProviderModelValue,
} from './ComposerModelSelector';

const oneProviderModels: ProviderModelOption[] = [
  { provider: 'openai', providerLabel: 'OpenAI', model: 'gpt-5-mini' },
  { provider: 'openai', providerLabel: 'OpenAI', model: 'gpt-5' },
  {
    provider: 'openai',
    providerLabel: 'OpenAI',
    model: 'gpt-5-chat-latest',
  },
];

const multiProviderModels: ProviderModelOption[] = [
  { provider: 'openai', providerLabel: 'OpenAI', model: 'gpt-5-mini' },
  { provider: 'openai', providerLabel: 'OpenAI', model: 'gpt-5' },
  {
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    model: 'claude-sonnet-4-5',
  },
  {
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    model: 'claude-opus-4-1',
  },
  { provider: 'ollama', providerLabel: 'Ollama', model: 'llama3.1:8b' },
  {
    provider: 'ollama',
    providerLabel: 'Ollama',
    model: 'qwen2.5-coder:14b',
  },
];

const longNameModels: ProviderModelOption[] = [
  {
    provider: 'openai',
    providerLabel: 'OpenAI',
    model: 'gpt-5-very-long-internal-routing-name-for-widget-overflow-testing',
    label: 'GPT-5 very long internal routing name for widget overflow testing',
  },
  {
    provider: 'anthropic',
    providerLabel: 'Anthropic',
    model: 'claude-sonnet-4-5-20260720-extra-long-stable-alias',
    label: 'Claude Sonnet 4.5 20260720 extra long stable alias',
  },
  {
    provider: 'ollama',
    providerLabel: 'Ollama',
    model: 'local-qwen2.5-coder-with-a-very-long-quantized-model-suffix:14b-q6',
  },
];

function SelectorDemo({
  models,
  boundaryRef,
}: {
  models: ProviderModelOption[];
  boundaryRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const [value, setValue] = React.useState<ProviderModelValue | null>(
    models[0] ?? null
  );
  const [providerFilter, setProviderFilter] = React.useState<string | 'any'>(
    'any'
  );

  return (
    <ComposerModelSelector
      models={models}
      value={value}
      providerFilter={providerFilter}
      onProviderFilterChange={setProviderFilter}
      onChange={setValue}
      boundaryRef={boundaryRef}
    />
  );
}

function ConstrainedContainerDemo() {
  const boundaryRef = React.useRef<HTMLDivElement>(null);

  return (
    <div
      ref={boundaryRef}
      className="border-border bg-background flex h-64 w-80 flex-col justify-end overflow-hidden rounded-lg border p-3 shadow-sm"
    >
      <div className="border-border bg-card rounded-lg border p-2">
        <SelectorDemo models={multiProviderModels} boundaryRef={boundaryRef} />
      </div>
    </div>
  );
}

const meta = {
  title: 'Product/Feature Modules/AI/ComposerModelSelector',
  component: ComposerModelSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ComposerModelSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneProvider: Story = {
  render: () => <SelectorDemo models={oneProviderModels} />,
};

export const MultipleProviders: Story = {
  render: () => <SelectorDemo models={multiProviderModels} />,
};

export const LongOverflowNames: Story = {
  render: () => (
    <div className="w-72">
      <SelectorDemo models={longNameModels} />
    </div>
  ),
};

export const ConstrainedContainer: Story = {
  parameters: {
    layout: 'centered',
  },
  render: () => <ConstrainedContainerDemo />,
};
