import type { Meta, StoryObj } from '@storybook/react-vite';
import { useEffect, useState } from 'react';
import { Text } from './Text';
import locoSamplePack from '../../i18n/i18n-translations.json';
import { createLocoTranslator } from '../../utils/i18n';

const meta: Meta = {
  title: 'Foundations/i18n/Loco Package Integration',
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

export const PackageDrivenTranslations: Story = {
  render: (_, context) => {
    const locale = String(context.globals.locale || 'en');
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
      <div className="space-y-3 min-w-[420px]">
        <Text size="sm" variant="muted">Active Locale: {locale}</Text>
        <Text
          as="h3"
          size="xl"
          weight="bold"
          className={`transition-all duration-300 ${isLocaleChanging ? 'opacity-60 translate-y-[1px]' : 'opacity-100 translate-y-0'}`}
        >
          {t('ui.page.title')}
        </Text>
        <Text
          variant="muted"
          className={`transition-opacity duration-300 ${isLocaleChanging ? 'opacity-70' : 'opacity-100'}`}
        >
          {t('ui.page.subtitle')}
        </Text>

        <div className="pt-2 border-t border-[var(--mieweb-border)] space-y-1">
          <Text size="sm">ui.actions.save =&gt; {t('ui.actions.save')}</Text>
          <Text size="sm">ui.actions.cancel =&gt; {t('ui.actions.cancel')}</Text>
          <Text size="sm">ui.status.ready =&gt; {t('ui.status.ready')}</Text>
          <Text size="sm">ui.unknown.key =&gt; {t('ui.unknown.key')}</Text>
        </div>
      </div>
    );
  },
};
