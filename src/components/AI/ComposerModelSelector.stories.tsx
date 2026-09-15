import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  ComposerModelSelector,
  type ComposerEffortOption,
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
  anyLabel?: string;
  emptyLabel?: string;
  ariaLabel?: string;
  disabled?: boolean;
  variant?: 'default' | 'ghost';
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
  anyLabel,
  emptyLabel,
  ariaLabel,
  variant,
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
      anyLabel={anyLabel}
      emptyLabel={emptyLabel}
      ariaLabel={ariaLabel}
      variant={variant}
      className={className}
    />
  );
}

function ConstrainedContainerDemo({
  modelsKey,
  disabled,
  placeholder,
  anyLabel,
  emptyLabel,
  ariaLabel,
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
          anyLabel={anyLabel}
          emptyLabel={emptyLabel}
          ariaLabel={ariaLabel}
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
  anyLabel,
  emptyLabel,
  ariaLabel,
  variant,
  className,
}: ComposerModelSelectorStoryArgs) {
  return (
    <SelectorDemo
      models={modelSets[modelsKey]}
      disabled={disabled}
      placeholder={placeholder}
      anyLabel={anyLabel}
      emptyLabel={emptyLabel}
      ariaLabel={ariaLabel}
      variant={variant}
      className={className}
    />
  );
}

const meta = {
  id: 'chat-composermodelselector',
  title: 'Modules/Chat/ComposerModelSelector',
  component: ComposerModelSelectorStoryDemo,
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

**A compact, provider-aware model picker sized for a chat composer's action row.** \`ComposerModelSelector\` renders a pill trigger showing the selected model (\`label ?? model ?? placeholder\`) and, on click or Arrow Up/Down, a portaled menu anchored **above** the trigger (\`useAnchoredPosition\`, \`top-start\`, no flip, clipped to \`boundaryRef\`). The menu has a provider filter strip (\`anyLabel\` + one \`aria-pressed\` chip per distinct \`provider\`, using \`providerLabel\` when present), a \`role="listbox"\` grouped by provider (\`role="group"\` per provider) and an optional **Effort** drill-down: pass \`effortOptions: { value, label, description? }[]\` with \`effort\`, \`defaultEffort\`, \`onEffortChange\` to expose reasoning levels for the selected model; the effort list replaces the model list in the same surface (\`backLabel\`, \`effortLabel\`, \`effortHint\`, \`defaultBadgeLabel\`). Props: \`models: ProviderModelOption[]\` (\`{ provider, model, label?, providerLabel?, id? }\`), \`value: ProviderModelValue | null\`, \`onChange({ provider, model })\`, \`providerFilter\` / \`onProviderFilterChange\` (controlled, or uncontrolled when \`providerFilter\` is omitted), \`disabled\`, \`variant\` (\`'default'\` bordered pill or \`'ghost'\` quiet text trigger — what \`ChatComposer\`'s selector row uses), \`placeholder\`, \`emptyLabel\`, \`ariaLabel\`, \`className\`. The host owns the model list, labels and selection. Types exported: \`ComposerModelSelectorProps\`, \`ProviderModelOption\`, \`ProviderModelValue\`, \`ComposerEffortOption\`.

### Use it when

- The user picks an **LLM per message** from a short, grouped list (OpenAI / Anthropic / Ollama…) inside a composer where vertical space is scarce and the menu must open upward and stay inside the widget — \`OzwellChat\` mounts it in \`AIChat\`'s composer trailing slot.
- You also need a per-model **effort/reasoning** level without a second control.

### Don't use it when

- It is a general form field — \`Select\` (labelled, form-integrated, opens downward) or \`Dropdown\` (arbitrary menu items) fit ordinary layouts; this component has no visible label or \`name\`.
- Options are not provider/model pairs: the grouping, filter strip and \`optionKey\` (\`provider + model\`) assume that shape; duplicate pairs are disambiguated only by an explicit \`id\`.
- You need search/typeahead across hundreds of models — \`Autocomplete\` or \`CommandPalette\`.

### Example

\`\`\`tsx
// Models come from the host's backend; the selector never fetches.
const { data: models = [] } = useQuery(['models'], () => api.listModels());
const [model, setModel] = useState<ProviderModelValue | null>(null);
const [effort, setEffort] = useState<string | null>(null);
const composerRef = useRef<HTMLDivElement>(null);

<div ref={composerRef} className="relative">
  <MessageComposer
    onSend={send}
    inputTrailing={
      <ComposerModelSelector
        models={models}
        value={model}
        onChange={(next) => { setModel(next); setEffort(null); }}
        effortOptions={effortsFor(model)} // [] hides the effort row
        effort={effort}
        defaultEffort="medium"
        onEffortChange={setEffort}
        boundaryRef={composerRef}
        ariaLabel={t('chat.model')}
        placeholder={t('chat.model')}
        anyLabel={t('common.any')}
        emptyLabel={t('chat.noModels')}
      />
    }
  />
</div>
\`\`\`

### Limitations

- **Accessibility as implemented:** the trigger is a \`<button aria-haspopup="listbox" aria-expanded aria-controls>\`; the open listbox receives focus (\`tabIndex={-1}\`) and manages Arrow Up/Down, Home, End, Enter/Space; Escape closes and returns focus to the trigger, while outside-click closes without restoring focus. The provider filter chips are **not** reachable by arrow keys from the list — only by Tab — and the "Any" chip's accessible name is just \`anyLabel\`. The trigger has no visible label; \`ariaLabel\` names the listbox, not the trigger. Highlight follows mouse hover, so the mouse can change what Enter selects.
- The menu never flips below the trigger (\`allowFlip: false\`); if there is no room above within \`boundaryRef\` it is clipped to \`maxHeight\` 320px. Menu width is fixed at \`w-80\` (\`max-w-full\`).
- Selecting a model closes the menu and calls \`onChange\` — it does **not** reset \`effort\`; the host decides whether the previous effort applies to the new model.
- i18n: all strings are props with English defaults ("Model", "Any", "No models", "Effort", "Default", "Back"); provider group headers are \`uppercase\`, which some scripts do not support. RTL: uses logical \`text-start\`, but the anchored menu placement is \`top-start\` resolved by \`useAnchoredPosition\`.
- Theming uses semantic tokens (\`bg-card\`, \`border-border\`, \`text-muted-foreground\`, \`bg-primary/10\`) and \`animate-in fade-in\` from the library stylesheet; icons from \`lucide-react\`. Entry \`@mieweb/ui\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'choice-inputs-select',
          why: 'ComposerModelSelector is an unlabelled upward-opening pill for provider/model pairs in a composer; Select is the labelled form field.',
        },
        {
          type: 'alternative to',
          target: 'choice-inputs-dropdown',
          why: 'Dropdown holds arbitrary menu items; ComposerModelSelector adds provider grouping, a filter strip and an effort drill-down for LLM choice.',
        },
        {
          type: 'composes with',
          target: 'chat-chatcomposer',
          why: 'ChatComposer embeds ComposerModelSelector in its bottom selector row via showModelSelector + modelSelectorProps.',
        },
      ],
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
    anyLabel: {
      control: 'text',
      description: 'Provider filter label for the unfiltered state.',
      table: {
        defaultValue: { summary: 'Any' },
      },
    },
    emptyLabel: {
      control: 'text',
      description: 'Text shown when the current filter has no models.',
      table: {
        defaultValue: { summary: 'No models' },
      },
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible label for the model listbox.',
      table: {
        defaultValue: { summary: 'Model' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Disable the selector trigger.',
    },
    variant: {
      control: 'select',
      options: ['default', 'ghost'],
      description:
        "Trigger appearance: bordered pill or a quiet ghost text trigger (used by ChatComposer's selector row).",
      table: {
        defaultValue: { summary: 'default' },
      },
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
    anyLabel: 'Any',
    emptyLabel: 'No models',
    ariaLabel: 'Model',
    disabled: false,
  },
};

export const MultipleProviders: Story = {
  args: {
    modelsKey: 'multipleProviders',
    placeholder: 'Model',
    anyLabel: 'Any',
    emptyLabel: 'No models',
    ariaLabel: 'Model',
    disabled: false,
  },
};

export const Ghost: Story = {
  args: {
    modelsKey: 'multipleProviders',
    placeholder: 'Model',
    anyLabel: 'Any',
    emptyLabel: 'No models',
    ariaLabel: 'Model',
    variant: 'ghost',
    disabled: false,
  },
};

export const LongOverflowNames: Story = {
  args: {
    modelsKey: 'longNames',
    placeholder: 'Model',
    anyLabel: 'Any',
    emptyLabel: 'No models',
    ariaLabel: 'Model',
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
    anyLabel: 'Any',
    emptyLabel: 'No models',
    ariaLabel: 'Model',
    disabled: false,
  },
  parameters: {
    layout: 'centered',
  },
  render: (args) => <ConstrainedContainerDemo {...args} />,
};

// Effort levels are provider-specific, so the caller supplies the list. Here
// the OpenAI models stop at 'high' while the Anthropic ones continue to
// 'xhigh' and 'max' — switching model swaps the available levels.
const effortsByProvider: Record<
  string,
  { options: ComposerEffortOption[]; defaultEffort: string }
> = {
  openai: {
    options: [
      { value: 'minimal', label: 'Minimal' },
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
    defaultEffort: 'high',
  },
  anthropic: {
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'xhigh', label: 'Extra high' },
      { value: 'max', label: 'Max' },
    ],
    defaultEffort: 'max',
  },
};

function EffortDemo() {
  const models = multiProviderModels.filter(
    (model) => model.provider !== 'ollama'
  );
  const [value, setValue] = React.useState<ProviderModelValue | null>(
    models[0] ?? null
  );
  const [effort, setEffort] = React.useState<string | null>('medium');

  const config = value ? effortsByProvider[value.provider] : undefined;

  return (
    <ComposerModelSelector
      models={models}
      value={value}
      onChange={setValue}
      effortOptions={config?.options ?? []}
      effort={effort}
      defaultEffort={config?.defaultEffort}
      onEffortChange={setEffort}
      effortHint="Higher effort means more thorough responses, but takes longer and uses more tokens."
    />
  );
}

export const WithReasoningEffort: Story = {
  args: {
    modelsKey: 'multipleProviders',
  },
  parameters: {
    layout: 'centered',
  },
  render: () => <EffortDemo />,
};
