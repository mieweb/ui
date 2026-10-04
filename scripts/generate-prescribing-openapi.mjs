import { writeFile } from 'node:fs/promises';
import {
  prescribingRoutes,
  prescribingSchemas,
} from '../dist/prescribing-api.js';
const paths = {};
for (const route of prescribingRoutes) {
  const mutation = route.method !== 'GET';
  const parameters = [...route.path.matchAll(/\{([^}]+)\}/g)].map(
    ([, name]) => ({
      name,
      in: 'path',
      required: true,
      schema: { type: 'string', minLength: 1 },
    })
  );
  if (mutation)
    parameters.push({
      name: 'Idempotency-Key',
      in: 'header',
      required: true,
      description:
        'Caller-owned key retained until outcome is known. Same canonical request recovers one mutation; changed request conflicts.',
      schema: { type: 'string', minLength: 1 },
    });
  if (route.precondition)
    parameters.push({
      name: 'If-Match',
      in: 'header',
      required: true,
      description:
        'Current strong record ETag. Prescription ETags use recordVersion; content references use contentRevision.',
      schema: { type: 'string', minLength: 1 },
    });
  if (['/drugs', '/pharmacies'].includes(route.path))
    parameters.push(
      {
        name: 'q',
        in: 'query',
        required: true,
        schema: { type: 'string', minLength: 2 },
      },
      {
        name: 'cursor',
        in: 'query',
        required: false,
        schema: { type: 'string' },
      }
    );
  if (route.path === '/prescriptions' && !mutation)
    parameters.push(
      {
        name: 'patientId',
        in: 'query',
        required: true,
        schema: { type: 'string', minLength: 1 },
      },
      { name: 'encounterId', in: 'query', schema: { type: 'string' } },
      { name: 'cursor', in: 'query', schema: { type: 'string' } }
    );
  if (route.path.endsWith('/events'))
    parameters.push({
      name: 'cursor',
      in: 'query',
      schema: { type: 'string' },
    });
  if (route.path.includes('/policies/'))
    parameters.push({
      name: 'version',
      in: 'query',
      schema: { type: 'string' },
    });
  if (route.path.includes('/patients/'))
    parameters.push({
      name: 'encounterId',
      in: 'query',
      schema: { type: 'string' },
    });
  const success = {
    description:
      'Current resource. Async resources include pollAfterMs; reads never advance jobs.',
    headers: {
      ETag: {
        description: 'Strong mutable resource version',
        schema: { type: 'string' },
      },
      Location: {
        description: 'Readable resource/operation path',
        schema: { type: 'string' },
      },
    },
    content: {
      'application/json': {
        schema: {
          type: 'object',
          required: ['meta', 'data'],
          properties: {
            meta: { $ref: '#/components/schemas/Meta' },
            data: route.response,
          },
        },
      },
    },
  };
  const responses = { 200: success };
  if (mutation) {
    responses[201] = success;
    responses[202] = success;
  }
  for (const status of [400, 401, 403, 404, 409, 412, 422, 429, 503])
    responses[status] = {
      description:
        'RFC 9457 problem; clinical warnings remain in domain findings.',
      content: {
        'application/problem+json': {
          schema: { $ref: '#/components/schemas/Problem' },
        },
      },
    };
  const operation = {
    operationId: `${route.method.toLowerCase()}${route.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
    tags: [route.path.split('/')[1]],
    parameters,
    responses,
  };
  if (route.request)
    operation.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: { $ref: `#/components/schemas/${route.request}` },
          ...(route.path === '/prescriptions'
            ? {
                example: {
                  patientId: 'sim-patient-1',
                  prescriberId: 'sim-prescriber-1',
                  intent: 'prescribe',
                  display: 'Lasix',
                  prescription: {},
                },
              }
            : {}),
        },
      },
    };
  (paths[route.path] ??= {})[route.method.toLowerCase()] = operation;
}
const document = {
  openapi: '3.1.1',
  info: {
    title: 'MIE UI prescribing EHR API',
    version: '1.0.0',
    description:
      'Application contract for replaceable EHR services. Simulator contains invented drugs and patients; it does not provide clinical guidance, DEA EPCS certification, NCPDP/FHIR conformance, or real transmission. Production EHR supplies trusted session context, maintained knowledge sources, licensed NCPDP profiles, provider credentials, transport and durable audit. See docs/prescribing-api.md and prescribe-plan.md for applicable standards.',
  },
  servers: [{ url: '/api/prescribing/v1' }],
  paths,
  components: {
    schemas: {
      ...prescribingSchemas,
      Meta: {
        type: 'object',
        required: ['apiVersion', 'requestId', 'generatedAt', 'mode'],
        properties: {
          apiVersion: { const: '1' },
          requestId: { type: 'string' },
          generatedAt: { type: 'string', format: 'date-time' },
          mode: { type: 'string', enum: ['simulation', 'live'] },
        },
      },
    },
  },
};
await writeFile(
  new URL('../docs/prescribing-api.openapi.yaml', import.meta.url),
  `${JSON.stringify(document, null, 2)}\n`
);
console.log(
  `Generated ${prescribingRoutes.length} operations and ${Object.keys(prescribingSchemas).length} schemas.`
);
