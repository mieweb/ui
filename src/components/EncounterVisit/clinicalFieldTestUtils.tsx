import * as React from 'react';
import { vi } from 'vitest';
import type { RenderResult } from '@testing-library/react';
import {
  createFormStore,
  createUIStore,
  type FieldComponentProps,
  type FieldDefinition,
  type FieldResponse,
} from '@esheet/core';
import { CodeLookupProvider } from '../CodeLookup/context';
import type { CodeLookupProps } from '../CodeLookup/CodeLookup';
import type { CodifyResult } from '../CodeLookup/engine';
import type { ConditionConcern } from '../ProblemList';
import { renderWithTheme } from '../../test/test-utils';

export const hypertensionConcern: ConditionConcern = {
  concernId: 'hypertension',
  clinicalStatus: 'active',
  source: 'ehrProblemList',
  assertions: [
    {
      id: 'hypertension-assertion',
      date: '2026-10-10',
      text: 'Essential hypertension',
      verificationStatus: 'confirmed',
      coding: [
        { system: 'ICD10', code: 'I10', display: 'Essential hypertension' },
      ],
    },
  ],
};

export const conditionPick: CodifyResult = {
  fullid: 'ICD10|I10',
  label: 'Essential hypertension',
  codetype: 'ICD10',
  fullcode: 'I10',
  domain: 'condition',
  score: 1,
  viaAlias: false,
};

export const labPick: CodifyResult = {
  fullid: 'LOINC|4548-4',
  label: 'Hemoglobin A1c',
  codetype: 'LOINC',
  fullcode: '4548-4',
  domain: 'lab',
  score: 1,
  viaAlias: false,
};

export function renderClinicalField(
  Component: React.ComponentType<FieldComponentProps>,
  fieldType: string,
  initialValue?: unknown,
  options: {
    provider?: boolean;
    pick?: CodifyResult;
    props?: Partial<FieldComponentProps>;
    seedConcerns?: ConditionConcern[];
    initialAnswer?: string;
    initialResponse?: FieldResponse;
  } = {}
): RenderResult & {
  onResponse: ReturnType<typeof vi.fn>;
  form: FieldComponentProps['form'];
  latest: <T>() => T;
  Lookup: (props: CodeLookupProps) => React.JSX.Element;
  lookupProps: () => CodeLookupProps;
} {
  const onResponse = vi.fn();
  const form = options.props?.form ?? createFormStore();
  if (options.seedConcerns) {
    form.getState().loadDefinition({
      id: 'coded-visit',
      pages: [
        {
          id: 'visit',
          fields: [
            { id: 'conditions', fieldType: 'encounterConditions' },
          ] as unknown as FieldDefinition[],
        },
      ],
    });
    form.getState().setResponse('conditions', {
      answer: JSON.stringify({ concerns: options.seedConcerns }),
    });
  }
  const props: FieldComponentProps = {
    field: {
      definition: {
        id: 'test-field',
        fieldType,
        question:
          fieldType === 'encounterConditions'
            ? 'Conditions'
            : fieldType === 'encounterPlan'
              ? 'Plan'
              : 'Assessment and plan',
      } as unknown as FieldDefinition,
      parentId: null,
      childIds: [],
      index: 0,
    },
    form,
    ui: createUIStore(),
    isPreview: true,
    isEnabled: true,
    isReadOnly: false,
    isSelected: false,
    isRequired: false,
    isSoftRequired: false,
    response: undefined,
    onRemove: vi.fn(),
    onUpdate: vi.fn(),
    onResponse,
    ...options.props,
  };
  const Lookup = vi.fn((lookupProps: CodeLookupProps) => (
    <div aria-label={lookupProps['aria-label']}>
      <button
        type="button"
        onClick={() => lookupProps.onSelect?.(options.pick ?? conditionPick)}
      >
        Pick coded finding
      </button>
    </div>
  ));
  function Harness() {
    const [response, setResponse] = React.useState<FieldResponse | undefined>(
      options.initialResponse !== undefined
        ? options.initialResponse
        : options.initialAnswer !== undefined
          ? { answer: options.initialAnswer }
          : initialValue === undefined
            ? undefined
            : { answer: JSON.stringify(initialValue) }
    );
    const child = (
      <Component
        {...props}
        response={response}
        onResponse={(next) => {
          onResponse(next);
          setResponse(next);
        }}
      />
    );
    return options.provider === false ? (
      child
    ) : (
      <CodeLookupProvider component={Lookup} indexUrl="/clinical-codify">
        {child}
      </CodeLookupProvider>
    );
  }
  const rendered = renderWithTheme(<Harness />);
  const latest = <T,>(): T =>
    JSON.parse(onResponse.mock.calls.at(-1)![0].answer);
  const lookupProps = () => Lookup.mock.calls.at(-1)![0];
  return { ...rendered, onResponse, form, latest, Lookup, lookupProps };
}
