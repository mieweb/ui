import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';
import { Text } from './Text';
import locoSamplePack from '../../../.storybook/loco/static/i18n-translations.json';
import { createLocoTranslator } from '../../../.storybook/loco/translator';

const meta: Meta = {
  id: 'foundations-loco-i18n',
  title: 'Foundations/Loco i18n',
  tags: ['autodocs', 'scope:general-purpose', 'maturity:experimental'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Demonstrates product-agnostic i18n consumption of a Loco export package. Change the Locale toolbar value to simulate cross-product translation behavior.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

const PackageDrivenTranslationsDemo = ({
  locale,
  packageMode,
}: {
  locale: string;
  packageMode: boolean;
}) => {
  const [isLocaleChanging, setIsLocaleChanging] = useState(false);
  const previousLocale = useRef(locale);

  useEffect(() => {
    // Only fade on an actual locale switch; dimming on mount fails color-contrast.
    if (previousLocale.current === locale) return;
    previousLocale.current = locale;
    setIsLocaleChanging(true);
    const timer = window.setTimeout(() => setIsLocaleChanging(false), 260);
    return () => window.clearTimeout(timer);
  }, [locale]);

  // Only package mode translates in React. Disable keeps the English baseline; live mode
  // renders English source and lets the Loco runtime translate from the server pack.
  const t = createLocoTranslator(locoSamplePack, packageMode ? locale : 'en', {
    fallbackLanguage: 'en',
  });

  return (
    // Package mode translates in React; keep the DOM runtime from rewriting (and later "restoring") it.
    <div
      className="min-w-[420px] space-y-3"
      data-notranslate={packageMode ? '' : undefined}
    >
      <Text size="sm" variant="muted" translate="no">
        Active Locale: {locale}
      </Text>
      <Text
        as="h3"
        size="xl"
        weight="bold"
        className={`transition-all duration-300 ${isLocaleChanging ? 'translate-y-[1px] opacity-60' : 'translate-y-0 opacity-100'}`}
      >
        {t('Edit Contact', 'Edit Contact')}
      </Text>
      <Text
        variant="muted"
        className={`transition-opacity duration-300 ${isLocaleChanging ? 'opacity-70' : 'opacity-100'}`}
      >
        {t('Description', 'Description')}
      </Text>

      <div className="space-y-1 border-t border-[var(--mieweb-border)] pt-2">
        <Text size="sm">
          Add Contact =&gt; {t('Add Contact', 'Add Contact')}
        </Text>
        <Text size="sm">Cancel =&gt; {t('Cancel', 'Cancel')}</Text>
        <Text size="sm">Email =&gt; {t('Email', 'Email')}</Text>
        <Text size="sm">
          Missing Phrase =&gt; {t('ui.unknown.key', 'Fallback text')}
        </Text>
      </div>
    </div>
  );
};

export const PackageDrivenTranslations: Story = {
  render: (_, context) => (
    <PackageDrivenTranslationsDemo
      locale={String(context.globals.locale || 'en')}
      packageMode={context.globals.locoMode === 'package'}
    />
  ),
};
