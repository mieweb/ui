import { useEffect, useState } from 'react';
import type { Decorator, StoryContext } from '@storybook/react-vite';
import { buildArgsParam } from 'storybook/internal/router';
import {
  mobilePreviewMode,
  serializeProjectGlobals,
  setStoryState,
  storybookReturnUrl,
  variantUrl,
} from './mobile-preview';
import './mobile-preview.css';

// Storybook tooling copy is kept together for translation, separate from demos.
const messages = {
  en: {
    back: 'Storybook',
    navigation: 'Mobile preview navigation',
    variant: 'Story variant',
    fullscreen: 'Full screen',
    hint: 'Hides navigation. Use browser Back to return.',
    unavailable: 'Variants unavailable. Return to Storybook to browse.',
  },
  es: {
    back: 'Storybook',
    navigation: 'Navegación de vista móvil',
    variant: 'Variante de historia',
    fullscreen: 'Pantalla completa',
    hint: 'Oculta la navegación. Usa Atrás del navegador para volver.',
    unavailable: 'Variantes no disponibles. Vuelve a Storybook para explorar.',
  },
  ar: {
    back: 'Storybook',
    navigation: 'التنقل في المعاينة المحمولة',
    variant: 'نسخة المثال',
    fullscreen: 'ملء الشاشة',
    hint: 'يخفي التنقل. استخدم رجوع المتصفح للعودة.',
    unavailable: 'النسخ غير متاحة. ارجع إلى Storybook للتصفح.',
  },
};
type Entry = {
  id: string;
  type: string;
  subtype?: string;
  title: string;
  name: string;
};

function MobileNavigation({ context }: { context: StoryContext }) {
  const [variants, setVariants] = useState<Entry[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  const locale = String(context.globals.locale ?? 'en').split('-')[0];
  const copy = messages[locale as keyof typeof messages] ?? messages.en;
  const args = buildArgsParam(
    context.initialArgs,
    context.unmappedArgs ?? context.args
  );
  const globals = serializeProjectGlobals(
    context.userGlobals ?? context.globals
  );
  const current = setStoryState(new URL(window.location.href), args, globals);
  const back = setStoryState(
    storybookReturnUrl(current.href, context.id),
    args,
    globals
  );
  const fullscreen = new URL(current);
  fullscreen.searchParams.set('mobilePreview', 'fullscreen');

  useEffect(() => {
    const controller = new AbortController();
    fetch(new URL('index.json', window.location.href), {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Story index unavailable');
        return response.json();
      })
      .then((index: { entries: Record<string, Entry> }) => {
        setVariants(
          Object.values(index.entries).filter(
            (entry) =>
              entry.type === 'story' &&
              entry.subtype !== 'test' &&
              entry.title === context.title
          )
        );
      })
      .catch(() => {
        if (!controller.signal.aborted) setUnavailable(true);
      });
    return () => controller.abort();
  }, [context.title]);

  return (
    <header className="mobile-preview-navigation" data-mobile-sandbox>
      <nav aria-label={copy.navigation}>
        <a href={back.href} data-mobile-back>
          <span className="mobile-preview-back-icon" aria-hidden="true">
            ←
          </span>{' '}
          {copy.back}
        </a>
        <button
          type="button"
          title={copy.hint}
          onClick={() => window.location.assign(fullscreen.href)}
        >
          {copy.fullscreen} <span aria-hidden="true">↗</span>
        </button>
      </nav>
      <div className="mobile-preview-selection">
        <strong>{context.title.split('/').pop()}</strong>
        <select
          aria-label={copy.variant}
          value={context.id}
          onChange={(event) =>
            window.location.assign(
              variantUrl(current.href, event.target.value).href
            )
          }
        >
          {variants.length ? (
            variants.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))
          ) : (
            <option value={context.id}>{context.name}</option>
          )}
        </select>
      </div>
      {unavailable && <p role="status">{copy.unavailable}</p>}
    </header>
  );
}

export const withMobilePreview: Decorator = (Story, context) => {
  const mode = context.viewMode === 'story' ? mobilePreviewMode() : null;
  const standalone = context.parameters.mobilePreview?.mode === 'standalone';
  useEffect(() => {
    if (!mode) return;
    document.documentElement.dataset.mobilePreview = mode;
    return () => {
      delete document.documentElement.dataset.mobilePreview;
    };
  }, [mode]);
  if (!mode || mode === 'fullscreen' || standalone) return <Story />;
  return (
    <>
      <MobileNavigation context={context} />
      <div
        className="mobile-preview-content"
        data-layout={context.parameters.layout ?? 'padded'}
      >
        <Story />
      </div>
    </>
  );
};
