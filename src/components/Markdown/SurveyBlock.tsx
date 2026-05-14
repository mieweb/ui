/**
 * SurveyBlock — Renders survey/questionnaire forms from JSON/YAML data.
 * Requires `js-yaml` to be installed by the consumer (optional peer dependency).
 */
import yaml from 'js-yaml';
import React, { useMemo } from 'react';

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

function parseSurveyData(code: string): ParsedSurvey {
  let data: unknown;

  try {
    data = JSON.parse(code);
  } catch {
    try {
      data = yaml.load(code);
    } catch (err) {
      return { fields: [], error: `Failed to parse survey data: ${(err as Error).message}` };
    }
  }

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
  const { fields, error } = useMemo(() => parseSurveyData(code), [code]);

  return (
    <FenceBlock code={code} language="survey" supportsRawView error={error ?? undefined}>
      <div className="space-y-4 p-4">
        <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Survey Preview
        </h4>
        {fields.map((field, i) => (
          <div key={field.name ?? i} className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {field.title ?? field.label ?? field.name}
              {field.isRequired && <span className="ml-1 text-red-500">*</span>}
            </label>

            {(field.type === 'radiogroup' || field.type === 'radio') && field.choices && (
              <div className="space-y-1">
                {field.choices.map((choice, ci) => {
                  const value = typeof choice === 'string' ? choice : choice.value;
                  const text = typeof choice === 'string' ? choice : choice.text;
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
              <input type="checkbox" disabled className="accent-primary-500" />
            )}

            {(field.type === 'text' || field.type === 'comment') && (
              <input
                type="text"
                disabled
                placeholder={field.title ?? field.name}
                className="w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800"
              />
            )}

            {field.type === 'rating' && (
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span key={n} className="text-lg text-neutral-300 dark:text-neutral-600">
                    ★
                  </span>
                ))}
              </div>
            )}

            {field.type === 'dropdown' && field.choices && (
              <select
                disabled
                className="w-full rounded-md border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-sm dark:border-neutral-600 dark:bg-neutral-800"
              >
                {field.choices.map((choice, ci) => {
                  const value = typeof choice === 'string' ? choice : choice.value;
                  const text = typeof choice === 'string' ? choice : choice.text;
                  return (
                    <option key={ci} value={value}>
                      {text}
                    </option>
                  );
                })}
              </select>
            )}
          </div>
        ))}
        <p className="text-xs text-neutral-400 dark:text-neutral-500">
          This is a preview. Interactive survey support coming soon.
        </p>
      </div>
    </FenceBlock>
  );
};
