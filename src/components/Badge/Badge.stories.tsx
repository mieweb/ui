import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { Badge } from './Badge';
import locoSamplePack from '../../i18n/i18n-translations.json';
import { createLocoTranslator } from '../../utils/i18n';
import {
  CheckIcon,
  AlertCircleIcon,
  InfoIcon,
  StarIcon,
  HeartIcon,
  BellIcon,
  TagIcon,
  ZapIcon,
  ShieldIcon,
  ClockIcon,
  UserIcon,
  MailIcon,
  PlusIcon,
  SparklesIcon,
} from '../Icons';
import type { LucideIcon } from 'lucide-react';

// Map of available icons for the dropdown
const iconMap: Record<string, LucideIcon | undefined> = {
  none: undefined,
  check: CheckIcon,
  alert: AlertCircleIcon,
  info: InfoIcon,
  star: StarIcon,
  heart: HeartIcon,
  bell: BellIcon,
  tag: TagIcon,
  zap: ZapIcon,
  shield: ShieldIcon,
  clock: ClockIcon,
  user: UserIcon,
  mail: MailIcon,
  plus: PlusIcon,
  sparkles: SparklesIcon,
};

// Extended args type that includes our custom iconName prop
type BadgeStoryArgs = React.ComponentProps<typeof Badge> & {
  iconName?: keyof typeof iconMap;
};

function getTranslator(context: { globals?: Record<string, unknown> }) {
  const locale = String(context.globals?.locale || 'en');
  return createLocoTranslator(locoSamplePack, locale, {
    fallbackLanguage: 'en',
  });
}

const meta: Meta<typeof Badge> = {
  id: 'data-display-badge',
  title: 'Components/Data display/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `### What it's for

A **static label chip**: an inline \`<span>\` with a rounded-full background, no behaviour and no semantics of its own. You choose the meaning through \`variant\` (\`default\` | \`secondary\` | \`success\` | \`warning\` | \`danger\` | \`outline\`) and the density through \`size\` (\`sm\` | \`md\` | \`lg\`); \`icon\` renders before the text. Any \`HTMLAttributes<HTMLSpanElement>\` pass through. \`badgeVariants\` (cva) is exported so other components can borrow the look.

### Use it when

- You are tagging a record with a **state or category the host already knows** — "Active", "Draft", "Pending", "Beta", a tag name — inside a table cell, a card header or next to a title.
- The meaning is fixed by the host: you decide the \`variant\`; nothing about the badge changes over time or on interaction.

### Don't use it when

- The chip shows a **count and opens something** — \`CountBadge\` is a real \`<button>\` ("Tasks 3") with an optional popover table and default View / Edit / Delete flows.
- The colour should follow **how old a date is** — \`FreshnessBadge\` derives \`fresh\` / \`aging\` / \`stale\` from a date and thresholds; you do not pick the variant.
- You are labelling a BlueHive service type or a payment provider — those domains have their own badges (\`ServiceBadge\`, \`StripeBadge\`).
- The user should be able to remove or toggle it — this component has no \`onRemove\` and no pressed state; use \`Toggle\` or a \`Button\`.

### Example

\`\`\`tsx
const statusVariant = { active: 'success', pending: 'warning', closed: 'secondary' } as const;

<td>
  <Badge variant={statusVariant[encounter.status]} size="sm">
    {statusLabel[encounter.status]}
  </Badge>
</td>

<Badge variant="danger" icon={<AlertCircleIcon size={12} />}>Overdue</Badge>
\`\`\`

The badge owns nothing: the host maps its domain state to a \`variant\` and supplies the (translated) text.

### Limitations

- Accessibility: a plain \`<span>\` with no role — colour is the only signal, so the text itself must carry the meaning ("Overdue", not "!"). The \`icon\` slot is not \`aria-hidden\`; pass decorative icons with \`aria-hidden\` yourself. Nothing is announced when the badge changes.
- Not interactive: no \`onClick\` styling, focus ring or keyboard handling. Wrapping it in a \`<button>\` is the host's job.
- RTL: the icon gap uses logical \`me-1\`; the layout is otherwise symmetric.
- Theming: \`default\` and \`outline\` use \`primary-*\` / \`border-current\`; \`secondary\`, \`success\`, \`warning\` and \`danger\` are hard-coded \`neutral|green|yellow|red-100/900\` with \`dark:\` variants, so a brand theme cannot recolour them.
- No built-in strings. Depends on \`class-variance-authority\`.`,
      },
    },
    catalog: {
      entry: '@mieweb/ui',
      relationships: [
        {
          type: 'alternative to',
          target: 'data-display-countbadge',
          why: 'Badge is a static label span; CountBadge is a button with a count chip that can open a popover table of items.',
        },
        {
          type: 'alternative to',
          target: 'data-display-freshnessbadge',
          why: 'Badge takes a variant you choose; FreshnessBadge computes its colour from a date and thresholds.',
        },
        {
          type: 'composes with',
          target: 'data-display-avatar',
          why: 'Identity plus state: an Avatar with a status Badge beside it is the header pattern in PatientHeader and EmployeeProfile.',
        },
        {
          type: 'alternative to',
          target: 'layout-productversion',
          why: 'ProductVersionBadge is a fixed monospace version + environment chip; Badge is the generic status label with variants you choose.',
        },
      ],
    },
  },
  tags: ['autodocs', 'scope:general-purpose', 'maturity:stable'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'secondary',
        'success',
        'warning',
        'danger',
        'outline',
      ],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    icon: {
      table: { disable: true }, // Hide the raw icon prop
    },
    iconName: {
      control: 'select',
      options: Object.keys(iconMap),
      description: 'Select an icon from the Lucide icon library',
    },
  } as Meta<BadgeStoryArgs>['argTypes'],
  // Convert iconName to actual icon element in render
  render: ({ iconName, ...args }: BadgeStoryArgs) => {
    const IconComponent = iconName ? iconMap[iconName] : undefined;
    return (
      <Badge
        {...args}
        icon={IconComponent ? <IconComponent size={12} /> : undefined}
      />
    );
  },
};

export default meta;
type Story = StoryObj<BadgeStoryArgs>;

export const Default: Story = {
  render: (args, context) => {
    const t = getTranslator(context);
    return <Badge {...args}>{t('ui.badge.single', 'Badge')}</Badge>;
  },
};

export const AllVariants: Story = {
  render: (_, context) => {
    const t = getTranslator(context);
    return (
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">
          {t('ui.badge.variants.default', 'Default')}
        </Badge>
        <Badge variant="secondary">
          {t('ui.badge.variants.secondary', 'Secondary')}
        </Badge>
        <Badge variant="success">
          {t('ui.badge.variants.success', 'Success')}
        </Badge>
        <Badge variant="warning">
          {t('ui.badge.variants.warning', 'Warning')}
        </Badge>
        <Badge variant="danger">
          {t('ui.badge.variants.danger', 'Danger')}
        </Badge>
        <Badge variant="outline">
          {t('ui.badge.variants.outline', 'Outline')}
        </Badge>
      </div>
    );
  },
};

export const AllSizes: Story = {
  render: (_, context) => {
    const t = getTranslator(context);
    return (
      <div className="flex items-center gap-2">
        <Badge size="sm">{t('ui.badge.sizes.small', 'Small')}</Badge>
        <Badge size="md">{t('ui.badge.sizes.medium', 'Medium')}</Badge>
        <Badge size="lg">{t('ui.badge.sizes.large', 'Large')}</Badge>
      </div>
    );
  },
};

export const WithIcon: Story = {
  render: (args, context) => {
    const t = getTranslator(context);
    const IconComponent = args.iconName ? iconMap[args.iconName] : undefined;
    return (
      <Badge
        {...args}
        icon={IconComponent ? <IconComponent size={12} /> : undefined}
      >
        {t('ui.badge.examples.new', 'New')}
      </Badge>
    );
  },
  args: {
    iconName: 'sparkles',
    variant: 'success',
  },
};

export const StatusExamples: Story = {
  render: (_, context) => {
    const t = getTranslator(context);
    return (
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">
          {t('ui.badge.examples.active', 'Active')}
        </Badge>
        <Badge variant="warning">
          {t('ui.badge.examples.pending', 'Pending')}
        </Badge>
        <Badge variant="danger">
          {t('ui.badge.examples.expired', 'Expired')}
        </Badge>
        <Badge variant="secondary">
          {t('ui.badge.examples.draft', 'Draft')}
        </Badge>
      </div>
    );
  },
};
