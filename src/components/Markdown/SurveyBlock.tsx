/** Survey/questionnaire preview from JSON or YAML. Requires `js-yaml` for YAML input. */
import React, { useEffect, useState } from 'react';

import { FenceBlock } from './FenceBlock';

interface SurveyBlockProps {
  code: string;
  id: string;
}

interface SurveyField {
  type: string;
  name: string;
  title?: string;
  label?: string;
  choices?: Array<string | { value: string; text: string }>;
  isRequired?: boolean;
}

interface ParsedSurvey {
  fields: SurveyField[];
  error: string | null;
}

type YamlLoadFn = (input: string) => unknown;
let yamlPromise: Promise<YamlLoadFn> | null = null;
function loadYaml(): Promise<YamlLoadFn> {
  if (!yamlPromise) {
    yamlPromise = import(/* @vite-ignore */ 'js-yaml')
      .then((mod) => {
        const api =
          (mod as { default?: { load?: YamlLoadFn }; load?: YamlLoadFn })
            .default ?? mod;
        const load = (api as { load?: YamlLoadFn }).load;
        if (typeof load !== 'function')
          throw new Error('js-yaml load not found');
        return load;
      })
      .catch((err) => {
        yamlPromise = null;
        throw err;
      });
  }
  return yamlPromise;
}

function tryParseJson(
  code: string
): { ok: true; data: unknown } | { ok: false } {
  try {
    return { ok: true, data: JSON.parse(code) };
  } catch {
    return { ok: false };
  }
}

function elementsToParsed(data: unknown): ParsedSurvey {
  if (!data || typeof data !== 'object') {
    return { fields: [], error: 'Invalid survey data format' };
  }
  const obj = data as Record<string, unknown>;

  let elements: unknown[] = [];
  if (Array.isArray(obj.pages)) {
    for (const page of obj.pages as Array<Record<string, unknown>>) {
      if (Array.isArray(page.elements)) {
        elements = elements.concat(page.elements);
      }
    }
  } else if (Array.isArray(obj.elements)) {
    elements = obj.elements;
  } else if (Array.isArray(obj.questions)) {
    elements = obj.questions;
  } else if (Array.isArray(obj.fields)) {
    elements = obj.fields;
  } else {
    return { fields: [], error: 'No survey questions found in data' };
  }

  return { fields: elements as SurveyField[], error: null };
}

export const SurveyBlock: React.FC<SurveyBlockProps> = ({ code, id }) => {
  const [parsed, setParsed] = useState<ParsedSurvey | null>(null);

  useEffect(() => {
    let cancelled = false;

    const jsonResult = tryParseJson(code);
    if (jsonResult.ok) {
      setParsed(elementsToParsed(jsonResult.data));
      return;
    }

    loadYaml()
      .then((load) => {
        try {
          const data = load(code);
          if (!cancelled) setParsed(elementsToParsed(data));
        } catch (err) {
          if (!cancelled)
            setParsed({
              fields: [],
              error: `Failed to parse survey data: ${(err as Error).message}`,
            });
        }
      })
      .catch(() => {
        if (!cancelled)
          setParsed({
            fields: [],
            error:
              'Survey preview requires the `js-yaml` package for YAML input. Install it with `npm install js-yaml`.',
          });
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!parsed) {
    return (
      <FenceBlock code={code} language="survey" supportsRawView>
        <div className="flex items-center justify-center p-6 text-sm text-neutral-500">
          Loading survey…
        </div>
      </FenceBlock>
    );
  }

  const { fields, error } = parsed;

  return (
    <FenceBlock
      code={code}
      language="survey"
      supportsRawView
      error={error ?? undefined}
    >
      <div className="space-y-4 p-4">
        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Survey Preview
        </h4>
        {fields.map((field, i) => {
          const fieldId = `${id}-field-${field.name ?? i}`;
          return (
            <div key={field.name ?? i} className="space-y-1.5">
              <label
                htmlFor={fieldId}
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
              >
                {field.title ?? field.label ?? field.name}
                {field.isRequired && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </label>

              {(field.type === 'radiogroup' || field.type === 'radio') &&
                field.choices && (
                  <div className="space-y-1">
                    {field.choices.map((choice, ci) => {
                      const value =
                        typeof choice === 'string' ? choice : choice.value;
                      const text =
                        typeof choice === 'string' ? choice : choice.text;
                      return (
                        <label
                          key={ci}
                          className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400"
                        >
                          <input
                            type="radio"
                            name={`${id}-${field.name}`}
                            value={value}
                            disabled
                            className="accent-primary-500"
                          />
                          {text}
                        </label>
                      );
                    })}
                  </div>
                )}

              {(field.type === 'checkbox' || field.type === 'boolean') && (
                <input
                  id={fieldId}
                  type="checkbox"
                  disabled
                  className="accent-primary-500"
                />
              )}

              {(field.type === 'text' || field.type === 'comment') && (
                <input
                  id={fieldId}
                  type="text"
                  disabled
                  placeholder={field.title ?? field.name}
                  className="w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                />
              )}

              {field.type === 'rating' && (
                <div className="flex gap-1" aria-label="Rating: 0 out of 5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span
                      key={n}
                      aria-hidden="true"
                      className="text-lg text-neutral-500 dark:text-neutral-500"
                    >
                      ★
                    </span>
                  ))}
                </div>
              )}

              {field.type === 'dropdown' && field.choices && (
                <select
                  id={fieldId}
                  name={fieldId}
                  disabled
                  className="w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800"
                >
                  {field.choices.map((choice, ci) => {
                    const value =
                      typeof choice === 'string' ? choice : choice.value;
                    const text =
                      typeof choice === 'string' ? choice : choice.text;
                    return (
                      <option key={ci} value={value}>
                        {text}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
          );
        })}
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          This is a preview. Interactive survey support coming soon.
        </p>
      </div>
    </FenceBlock>
  );
};
