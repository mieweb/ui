export type LocoI18nDictionary = Record<string, unknown>;

export type LocoI18nLanguageResource = {
  translation?: LocoI18nDictionary;
} & LocoI18nDictionary;

export type LocoI18nPackage = {
  format?: string;
  contextMode?: string;
  languages: string[];
  languageNames?: Record<string, string>;
  resources: Record<string, LocoI18nLanguageResource>;
  timestamp?: number;
  source?: string;
};

export type LocoTranslatorOptions = {
  fallbackLanguage?: string;
};

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function resolveDottedValue(dictionary: Record<string, unknown>, dottedKey: string): string | undefined {
  const parts = dottedKey.split('.').filter(Boolean);
  if (parts.length === 0) return undefined;

  let cursor: unknown = dictionary;
  for (let i = 0; i < parts.length; i++) {
    if (!cursor || typeof cursor !== 'object') return undefined;
    cursor = (cursor as Record<string, unknown>)[parts[i]];
  }

  return typeof cursor === 'string' ? cursor : undefined;
}

export function getLocoDictionary(
  i18nPackage: LocoI18nPackage,
  language: string,
): Record<string, unknown> {
  const resource = asObject(i18nPackage.resources?.[language]);
  if (!resource || Object.keys(resource).length === 0) return {};

  const nested = asObject(resource.translation);
  if (Object.keys(nested).length > 0) return nested;
  return resource;
}

export function resolveLocoTranslation(
  i18nPackage: LocoI18nPackage,
  language: string,
  key: string,
  fallbackLanguage?: string,
): string | undefined {
  const dictionary = getLocoDictionary(i18nPackage, language);

  const direct = dictionary[key];
  if (typeof direct === 'string') return direct;

  const nested = resolveDottedValue(dictionary, key);
  if (nested) return nested;

  if (fallbackLanguage && fallbackLanguage !== language) {
    const fallbackDictionary = getLocoDictionary(i18nPackage, fallbackLanguage);
    const fallbackDirect = fallbackDictionary[key];
    if (typeof fallbackDirect === 'string') return fallbackDirect;
    return resolveDottedValue(fallbackDictionary, key);
  }

  return undefined;
}

export function createLocoTranslator(
  i18nPackage: LocoI18nPackage,
  language: string,
  options: LocoTranslatorOptions = {},
) {
  const fallbackLanguage =
    options.fallbackLanguage ||
    i18nPackage.languages?.[0] ||
    language;

  return (key: string, defaultValue?: string): string => {
    const translated = resolveLocoTranslation(
      i18nPackage,
      language,
      key,
      fallbackLanguage,
    );
    return translated ?? defaultValue ?? key;
  };
}
