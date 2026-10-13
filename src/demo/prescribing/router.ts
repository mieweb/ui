import type { PrescribingApi } from '../../prescribing/api/contracts';
import {
  prescribingSchemas,
  validateResponse,
  validateSchema,
} from '../../prescribing/api/schemas';
import { SimulationApiError } from './createFakeEhrService';

export type RouterService = Pick<PrescribingApi, 'request'> & {
  baseUrl?: string;
};

/** One Request/Response adapter is shared by fake fetch and a potential localhost host. */
export function createPrescribingRouter(
  service: RouterService,
  baseUrl = service.baseUrl ?? '/api/prescribing/v1'
) {
  const namespace = new URL(
    baseUrl,
    'https://simulation.invalid'
  ).pathname.replace(/\/$/, '');
  return async (
    request: InstanceType<typeof globalThis.Request>,
    transportSignal?: AbortSignal
  ): Promise<Response> => {
    const url = new URL(request.url);
    if (!url.pathname.startsWith(`${namespace}/`))
      throw new TypeError(
        'Request is outside the simulated prescribing namespace'
      );
    const path = `${url.pathname.slice(namespace.length)}${url.search}`;
    try {
      if (!['GET', 'POST', 'PUT'].includes(request.method))
        throw new SimulationApiError({
          type: 'about:blank',
          title: 'Method not allowed',
          status: 405,
          detail: 'Use GET, POST or PUT for this contract',
          instance: url.pathname,
          code: 'METHOD_NOT_ALLOWED',
          requestId: 'router',
          retryable: false,
        });
      let body: unknown;
      if (request.method !== 'GET') {
        try {
          body = await request.json();
        } catch {
          throw new SimulationApiError({
            type: 'about:blank',
            title: 'Malformed JSON',
            status: 400,
            detail: 'Request body is not valid JSON',
            instance: url.pathname,
            code: 'MALFORMED_JSON',
            requestId: 'router',
            retryable: false,
          });
        }
      }
      const result = await service.request(
        request.method as 'GET' | 'POST' | 'PUT',
        path,
        body,
        {
          signal: transportSignal ?? request.signal,
          idempotencyKey: request.headers.get('Idempotency-Key') ?? undefined,
          ifMatch: request.headers.get('If-Match') ?? undefined,
          headers: Object.fromEntries(request.headers.entries()),
        }
      );
      const issues = validateResponse(request.method, path, result.body);
      if (issues.length)
        throw new Error(
          `Simulator produced an invalid response: ${issues.map((issue) => `${issue.fieldPath}: ${issue.message}`).join('; ')}`
        );
      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: result.headers,
      });
    } catch (error) {
      if (error instanceof SimulationApiError) {
        const issues = validateSchema(
          error.problem,
          prescribingSchemas.Problem
        );
        if (issues.length)
          throw new Error('Simulator produced an invalid problem response');
        return new Response(
          JSON.stringify({ ...error.problem, instance: url.pathname }),
          {
            status: error.problem.status,
            headers: {
              'Content-Type': 'application/problem+json',
              ...(error.problem.retryable ? { 'Retry-After': '1' } : {}),
            },
          }
        );
      }
      throw error; // Response loss and abort remain transport uncertainty, not domain rejection.
    }
  };
}
