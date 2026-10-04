import * as React from 'react';
import { Button } from '../../components/Button';
import type { MedicationLookupProps } from '../../components/MedicationList/MedicationEditor';
import type {
  DrugProduct,
  PrescribingApi,
} from '../../prescribing/api/contracts';

/** API-backed catalog injection, scoped to invented products only. */
export function SyntheticMedicationLookup({
  client,
  now,
  ...props
}: MedicationLookupProps & { client: PrescribingApi; now: () => string }) {
  const [query, setQuery] = React.useState(props.initialQuery ?? '');
  const [products, setProducts] = React.useState<DrugProduct[]>([]);
  const [error, setError] = React.useState('');
  const searchSequence = React.useRef(0);
  const abort = React.useRef<AbortController | null>(null);
  React.useEffect(
    () => () => {
      abort.current?.abort();
      searchSequence.current += 1;
    },
    []
  );
  async function search() {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    const sequence = ++searchSequence.current;
    setError('');
    try {
      const result = await client.searchDrugs(query, undefined, {
        signal: controller.signal,
      });
      if (sequence === searchSequence.current)
        setProducts(result.body.data.items);
    } catch (failure) {
      if (sequence === searchSequence.current && !controller.signal.aborted)
        setError(
          failure instanceof Error ? failure.message : 'Catalog search failed'
        );
    }
  }
  return (
    <div className="space-y-2">
      <label className="block text-sm">
        Medication
        <input
          className="border-border bg-background text-foreground focus-visible:ring-ring aria-invalid:border-danger-500 w-full rounded border p-2 focus-visible:ring-2"
          id={props.id}
          aria-label="Medication"
          aria-invalid={props['aria-invalid']}
          aria-describedby={props['aria-describedby']}
          value={query}
          placeholder="Search SimDrug, or retain free text"
          onChange={(event) => {
            setQuery(event.target.value);
            props.onFreeText?.(event.target.value);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void search();
            }
          }}
        />
      </label>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={query.trim().length < 2}
        onClick={() => void search()}
      >
        Search synthetic catalog
      </Button>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
      {products.length > 0 && (
        <ul aria-label="Synthetic catalog results" className="space-y-1">
          {products.map((product) => (
            <li key={product.id}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const code = product.coding[0];
                  props.onSelect?.({
                    label: product.display,
                    codetype: code.system,
                    fullcode: code.code,
                    codeVersion: code.version,
                    productId: product.id,
                    strength: product.strength,
                    doseForm: product.doseForm,
                    quantityUnit: product.quantityUnits[0],
                    quantityUnits: product.quantityUnits,
                    conceptSpecificity: product.conceptSpecificity,
                    controlledSchedule:
                      product.controlledSchedule.state === 'known'
                        ? product.controlledSchedule.value
                        : undefined,
                    observedAt: now(),
                    sourceId: 'urn:mieweb:simulation:catalog',
                  });
                  setQuery(product.display);
                  setProducts([]);
                }}
              >
                Select {product.display}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
