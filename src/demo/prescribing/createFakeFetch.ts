import { createPrescribingRouter } from './router';
import type { RouterService } from './router';

/** Inject only for the API client. No real-network fallback is ever performed. */
export function createFakeFetch(
  service: RouterService,
  options: {
    baseUrl?: string;
    origin?: string;
    onRequest?: (
      request: InstanceType<typeof globalThis.Request>,
      response: Response | null
    ) => void;
  } = {}
): typeof globalThis.fetch {
  const origin = options.origin ?? 'https://simulation.invalid';
  const baseUrl = options.baseUrl ?? service.baseUrl ?? '/api/prescribing/v1';
  const namespace = new URL(baseUrl, origin);
  const route = createPrescribingRouter(service, baseUrl);
  return async (input, init) => {
    const sourceSignal =
      init?.signal ??
      (input instanceof globalThis.Request ? input.signal : undefined);
    if (sourceSignal?.aborted)
      throw new globalThis.DOMException('Request aborted', 'AbortError');
    // jsdom and Node Request may use AbortSignals from different realms.
    const requestInit = { ...init, signal: undefined };
    const request =
      input instanceof globalThis.Request
        ? new globalThis.Request(input, requestInit)
        : new globalThis.Request(
            new URL(
              typeof input === 'string' ? input : input.toString(),
              origin
            ),
            requestInit
          );
    const url = new URL(request.url);
    if (
      url.origin !== namespace.origin ||
      !url.pathname.startsWith(`${namespace.pathname.replace(/\/$/, '')}/`)
    )
      throw new TypeError(
        'Fake fetch refuses requests outside its configured namespace'
      );
    if (sourceSignal?.aborted || request.signal.aborted)
      throw new globalThis.DOMException('Request aborted', 'AbortError');
    const observedRequest = options.onRequest ? request.clone() : null;
    let response: Response;
    try {
      response = await route(request, sourceSignal ?? undefined);
    } catch (error) {
      if (observedRequest) options.onRequest?.(observedRequest, null);
      throw error;
    }
    if (observedRequest) options.onRequest?.(observedRequest, response.clone());
    if (sourceSignal?.aborted || request.signal.aborted)
      throw new globalThis.DOMException(
        'Request aborted after commit; reconcile the operation',
        'AbortError'
      );
    return response;
  };
}
