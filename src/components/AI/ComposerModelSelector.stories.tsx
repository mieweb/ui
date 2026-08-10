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

const modelSets = {
  oneProvider: oneProviderModels,
  multipleProviders: multiProviderModels,
  longNames: longNameModels,
};

type ModelsKey = keyof typeof modelSets;

type ComposerModelSelectorStoryArgs = {
  modelsKey: ModelsKey;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

type SelectorDemoProps = Omit<ComposerModelSelectorStoryArgs, 'modelsKey'> & {
  models: ProviderModelOption[];
  boundaryRef?: React.RefObject<HTMLDivElement | null>;
};

function SelectorDemo({
  models,
  boundaryRef,
  disabled,
  placeholder,
  className,
}: SelectorDemoProps) {
  const [value, setValue] = React.useState<ProviderModelValue | null>(
    models[0] ?? null
  );
  const [providerFilter, setProviderFilter] = React.useState<string | null>(
    null
  );

  React.useEffect(() => {
    setValue((currentValue) => {
      if (
        currentValue &&
        models.some(
          (model) =>
            model.provider === currentValue.provider &&
            model.model === currentValue.model
        )
      ) {
        return currentValue;
      }

      return models[0] ?? null;
    });
  }, [models]);

  return (
    <ComposerModelSelector
      models={models}
      value={value}
      providerFilter={providerFilter}
      onProviderFilterChange={setProviderFilter}
      onChange={setValue}
      boundaryRef={boundaryRef}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
}

function ConstrainedContainerDemo({
  modelsKey,
  disabled,
  placeholder,
  className,
}: ComposerModelSelectorStoryArgs) {
  const boundaryRef = React.useRef<HTMLDivElement>(null);
  const models = modelSets[modelsKey];

  return (
    <div
      ref={boundaryRef}
      className="border-border bg-background flex h-64 w-80 flex-col justify-end overflow-hidden rounded-lg border p-3 shadow-sm"
    >
      <div className="border-border bg-card rounded-lg border p-2">
        <SelectorDemo
          models={models}
          boundaryRef={boundaryRef}
          disabled={disabled}
          placeholder={placeholder}
          className={className}
        />
      </div>
    </div>
  );
}

function ComposerModelSelectorStoryDemo({
  modelsKey,
  disabled,
  placeholder,
  className,
}: ComposerModelSelectorStoryArgs) {
  return (
    <SelectorDemo
      models={modelSets[modelsKey]}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
}

const meta = {
  title: 'Product/Feature Modules/AI/ComposerModelSelector',
  component: ComposerModelSelectorStoryDemo,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'ComposerModelSelector is a compact provider-aware model picker for composer action rows. The host supplies provider/model rows and owns fetching, labels, and selection state.',
      },
    },
  },
  argTypes: {
    modelsKey: {
      control: 'select',
      options: ['oneProvider', 'multipleProviders', 'longNames'],
      description: 'Which sample provider/model dataset to display.',
      table: {
        defaultValue: { summary: 'multipleProviders' },
      },
    },
    placeholder: {
      control: 'text',
      description: 'Text shown when no model is selected.',
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the selector trigger.',
    },
    className: {
      control: 'text',
      description: 'Additional classes applied to the selector trigger.',
    },
  },
} satisfies Meta<typeof ComposerModelSelectorStoryDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OneProvider: Story = {
  args: {
    modelsKey: 'oneProvider',
    placeholder: 'Model',
    disabled: false,
  },
};

export const MultipleProviders: Story = {
  args: {
    modelsKey: 'multipleProviders',
    placeholder: 'Model',
    disabled: false,
  },
};

export const LongOverflowNames: Story = {
  args: {
    modelsKey: 'longNames',
    placeholder: 'Model',
    disabled: false,
  },
  render: (args) => (
    <div className="w-72">
      <ComposerModelSelectorStoryDemo {...args} />
    </div>
  ),
};

export const ConstrainedContainer: Story = {
  args: {
    modelsKey: 'multipleProviders',
    placeholder: 'Model',
    disabled: false,
  },
  parameters: {
    layout: 'centered',
  },
  render: (args) => <ConstrainedContainerDemo {...args} />,
};
