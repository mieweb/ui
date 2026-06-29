import { describe, expect, it } from 'vitest';

import {
  createLocoTranslator,
  getLocoDictionary,
  resolveLocoTranslation,
  type LocoI18nPackage,
} from './i18n';

const samplePack: LocoI18nPackage = {
  format: 'i18next-nested',
  contextMode: 'ignore',
  languages: ['en', 'fr'],
  languageNames: { en: 'English', fr: 'French' },
  resources: {
    en: {
      translation: {
        ui: {
          actions: {
            save: 'Save',
          },
          title: 'Settings',
        },
      },
    },
    fr: {
      translation: {
        ui: {
          actions: {
            save: 'Enregistrer',
          },
          title: 'Parametres',
        },
      },
    },
  },
};

describe('loco i18n utils', () => {
  it('returns nested translation dictionary', () => {
    const dict = getLocoDictionary(samplePack, 'fr');
    expect(dict).toHaveProperty('ui');
  });

  it('resolves dotted keys for active language', () => {
    expect(resolveLocoTranslation(samplePack, 'fr', 'ui.actions.save')).toBe('Enregistrer');
  });

  it('falls back to fallback language when missing', () => {
    expect(resolveLocoTranslation(samplePack, 'fr', 'ui.missing', 'en')).toBeUndefined();
    expect(resolveLocoTranslation(samplePack, 'fr', 'ui.title', 'en')).toBe('Parametres');
  });

  it('creates translator with key fallback behavior', () => {
    const t = createLocoTranslator(samplePack, 'fr', { fallbackLanguage: 'en' });
    expect(t('ui.actions.save')).toBe('Enregistrer');
    expect(t('ui.does.not.exist')).toBe('ui.does.not.exist');
    expect(t('ui.does.not.exist', 'Default text')).toBe('Default text');
  });
});
