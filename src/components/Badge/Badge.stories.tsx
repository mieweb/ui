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
  return createLocoTranslator(locoSamplePack, locale, { fallbackLanguage: 'en' });
}

const meta: Meta<typeof Badge> = {
  title: 'Components/Text & Data Display/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
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
    return <Badge {...args}>{t('ui.badge.single')}</Badge>;
  },
};

export const AllVariants: Story = {
  render: (_, context) => {
    const t = getTranslator(context);
    return (
      <div className="flex flex-wrap gap-2">
        <Badge variant="default">{t('ui.badge.variants.default')}</Badge>
        <Badge variant="secondary">{t('ui.badge.variants.secondary')}</Badge>
        <Badge variant="success">{t('ui.badge.variants.success')}</Badge>
        <Badge variant="warning">{t('ui.badge.variants.warning')}</Badge>
        <Badge variant="danger">{t('ui.badge.variants.danger')}</Badge>
        <Badge variant="outline">{t('ui.badge.variants.outline')}</Badge>
      </div>
    );
  },
};

export const AllSizes: Story = {
  render: (_, context) => {
    const t = getTranslator(context);
    return (
      <div className="flex items-center gap-2">
        <Badge size="sm">{t('ui.badge.sizes.small')}</Badge>
        <Badge size="md">{t('ui.badge.sizes.medium')}</Badge>
        <Badge size="lg">{t('ui.badge.sizes.large')}</Badge>
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
        {t('ui.badge.examples.new')}
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
        <Badge variant="success">{t('ui.badge.examples.active')}</Badge>
        <Badge variant="warning">{t('ui.badge.examples.pending')}</Badge>
        <Badge variant="danger">{t('ui.badge.examples.expired')}</Badge>
        <Badge variant="secondary">{t('ui.badge.examples.draft')}</Badge>
      </div>
    );
  },
};
