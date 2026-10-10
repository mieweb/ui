import * as React from 'react';
import type { FieldComponentProps } from '@esheet/core';
import { Assessment, type AssessmentProps } from '../Assessment';
import { Input } from '../Input';
import { Button } from '../Button';
import { useCodeLookupConfig } from '../CodeLookup/context';
import type { EncounterAssessmentValue } from './types';
import { validateEncounterAssessment } from './model';

function FreeTextSearch({
  onFreeText,
  placeholder,
}: {
  onFreeText?: (text: string) => void;
  placeholder: string;
}): React.JSX.Element {
  const [text, setText] = React.useState('');
  const add = () => {
    if (!text.trim()) return;
    onFreeText?.(text.trim());
    setText('');
  };
  return (
    <div className="flex min-w-0 flex-wrap items-end gap-2">
      <div className="min-w-0 flex-1">
        <Input
          label="Concern or order description"
          placeholder={placeholder}
          className="min-h-11"
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
        />
      </div>
      <Button
        type="button"
        className="min-h-11"
        onClick={add}
        disabled={!text.trim()}
      >
        Add
      </Button>
    </div>
  );
}

const freeTextSearch: Exclude<
  AssessmentProps['renderOrderSearch'],
  false | undefined
> = (props) => <FreeTextSearch {...props} />;

function readAssessment(answer?: string): {
  value: EncounterAssessmentValue;
  error?: string;
} {
  if (!answer) return { value: { concerns: [], items: [], orders: [] } };
  try {
    const parsed: unknown = JSON.parse(answer);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
      throw new Error();
    if (validateEncounterAssessment(parsed).length > 0) throw new Error();
    return { value: parsed as EncounterAssessmentValue };
  } catch {
    return {
      value: { concerns: [], items: [], orders: [] },
      error:
        'The saved assessment answer could not be read. The original answer is retained below; correct it through the visit data before editing.',
    };
  }
}

function reorder<T>(
  values: T[],
  ids: string[],
  getId: (value: T) => string
): T[] {
  const byId = new Map(values.map((value) => [getId(value), value]));
  return [
    ...ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : [])),
    ...values.filter((value) => !ids.includes(getId(value))),
  ];
}

/** Native eSheet adapter for the shared Assessment and plan editor. */
export function EncounterAssessmentField({
  field,
  response,
  isPreview,
  isEnabled,
  isReadOnly,
  onResponse,
}: FieldComponentProps): React.JSX.Element {
  const { value, error } = React.useMemo(
    () => readAssessment(response?.answer),
    [response?.answer]
  );
  const codeLookup = useCodeLookupConfig();
  const readOnly =
    !(isPreview && isEnabled) || Boolean(isReadOnly) || Boolean(error);
  const definition = field.definition as { question?: string };
  const commit = (next: EncounterAssessmentValue) => {
    if (!readOnly) onResponse({ answer: JSON.stringify(next) });
  };
  if (error) {
    return (
      <section
        aria-label={definition.question ?? 'Assessment and plan'}
        className="space-y-3"
      >
        <h3 className="text-lg font-semibold">
          {definition.question ?? 'Assessment and plan'}
        </h3>
        <div
          role="alert"
          className="border-destructive text-destructive rounded-lg border p-3"
        >
          <p>{error}</p>
          <pre className="mt-2 max-h-48 overflow-auto text-xs break-all whitespace-pre-wrap">
            {response?.answer}
          </pre>
        </div>
      </section>
    );
  }
  return (
    <Assessment
      concerns={value.concerns}
      items={value.items}
      orders={value.orders}
      title={definition.question ?? 'Assessment and plan'}
      className="[&_.min-w-64]:min-w-0 [&_input]:min-h-11 [&_select]:min-h-11"
      readOnly={readOnly}
      defaultAddMode="problem"
      renderOrderSearch={codeLookup ? undefined : freeTextSearch}
      onAddAssessment={(pick) => {
        const concernId = globalThis.crypto.randomUUID();
        const assertionId = globalThis.crypto.randomUUID();
        commit({
          ...value,
          concerns: [
            ...value.concerns,
            {
              concernId,
              clinicalStatus: 'active',
              source: 'manuallyAdded',
              assertions: [
                {
                  id: assertionId,
                  date: new Date().toISOString().slice(0, 10),
                  text: pick.label,
                  verificationStatus: 'unconfirmed',
                  coding: pick.code
                    ? [
                        {
                          system: pick.code.codetype,
                          code: pick.code.fullcode,
                          display: pick.label,
                        },
                      ]
                    : undefined,
                },
              ],
            },
          ],
          items: [...value.items, { concernId, assertionId }],
        });
      }}
      onRemoveAssessment={(item) =>
        commit({
          ...value,
          items: value.items.filter(
            (candidate) => candidate.concernId !== item.concernId
          ),
          orders: value.orders.map((order) =>
            order.concernId === item.concernId
              ? { ...order, concernId: undefined }
              : order
          ),
        })
      }
      onAddOrder={(item, order) =>
        commit({
          ...value,
          orders: [
            ...value.orders,
            {
              ...order,
              orderId: globalThis.crypto.randomUUID(),
              concernId: item?.concernId,
            },
          ],
        })
      }
      onEditOrder={(order, changes) =>
        commit({
          ...value,
          orders: value.orders.map((candidate) =>
            candidate.orderId === order.orderId
              ? { ...candidate, ...changes }
              : candidate
          ),
        })
      }
      onRemoveOrder={(order) =>
        commit({
          ...value,
          orders: value.orders.filter(
            (candidate) => candidate.orderId !== order.orderId
          ),
        })
      }
      onLinkOrder={(order, concernId) =>
        commit({
          ...value,
          orders: value.orders.map((candidate) =>
            candidate.orderId === order.orderId
              ? { ...candidate, concernId }
              : candidate
          ),
        })
      }
      onReorderItems={(ids) =>
        commit({
          ...value,
          items: reorder(value.items, ids, (item) => item.concernId),
        })
      }
      onReorderOrders={(ids) =>
        commit({
          ...value,
          orders: reorder(value.orders, ids, (order) => order.orderId),
        })
      }
    />
  );
}
