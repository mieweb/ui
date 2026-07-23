import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import {
  AppHeader,
  AppHeaderActions,
  AppHeaderBrand,
  AppHeaderDivider,
  AppHeaderIconButton,
  AppHeaderSearch,
  AppHeaderSection,
  AppHeaderTitle,
  AppHeaderUserMenu,
} from './index';
import locoSamplePack from '../../i18n/i18n-translations.json';
import { createLocoTranslator } from '../../utils/i18n';

const BellIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5"
    />
  </svg>
);

const MessageIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const CogIcon = () => (
  <svg
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
  </svg>
);

const meta: Meta = {
  title: 'Components/Layout & Structure/AppHeader/Loco i18n Integration',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Shows how to translate a major component with an exported Loco package. Switch locale from the Storybook toolbar.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

const PackageTranslatedHeaderDemo = ({ locale }: { locale: string }) => {
  const [isLocaleChanging, setIsLocaleChanging] = useState(false);

  useEffect(() => {
    setIsLocaleChanging(true);
    const timer = window.setTimeout(() => setIsLocaleChanging(false), 260);
    return () => window.clearTimeout(timer);
  }, [locale]);

  const t = createLocoTranslator(locoSamplePack, locale, {
    fallbackLanguage: 'en',
  });

  return (
    <div className="min-h-[180px] bg-[var(--mieweb-background)] p-0">
      <AppHeader className="w-full">
        <AppHeaderSection align="left">
          <AppHeaderBrand>{t('AddContactModal')}</AppHeaderBrand>
          <AppHeaderDivider />
          <AppHeaderTitle
            subtitle={t('Description')}
            className={`transition-all duration-300 ${isLocaleChanging ? 'translate-y-[1px] opacity-70' : 'translate-y-0 opacity-100'}`}
          >
            {t('Edit Contact')}
          </AppHeaderTitle>
        </AppHeaderSection>

        <AppHeaderSection align="right">
          <AppHeaderActions>
            <AppHeaderSearch placeholder={t('Address')} />
            <AppHeaderIconButton icon={<MessageIcon />} label={t('Email')} />
            <AppHeaderIconButton
              icon={<BellIcon />}
              label={t('City')}
              badge={3}
            />
            <AppHeaderIconButton icon={<CogIcon />} label={t('Degree')} />
            <button className="bg-primary-800 hover:bg-primary-900 rounded-lg px-3 py-2 text-sm font-medium text-white transition-colors">
              {t('Add Contact')}
            </button>
            <AppHeaderUserMenu
              name="Dr. Jamie Rivera"
              email="jamie.rivera@bluehive.com"
            />
          </AppHeaderActions>
        </AppHeaderSection>
      </AppHeader>
    </div>
  );
};

export const PackageTranslatedHeader: Story = {
  render: (_, context) => (
    <PackageTranslatedHeaderDemo
      locale={String(context.globals.locale || 'en')}
    />
  ),
};
